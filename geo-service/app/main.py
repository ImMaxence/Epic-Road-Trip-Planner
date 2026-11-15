"""Epic Road Trip — geo service (internal).

Serves commune search and points of interest around a coordinate. It is only
reachable from the Node backend on the private Docker network.
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated

import hmac

from fastapi import FastAPI, Header, HTTPException, Query

from .categories import ALL_BUCKETS, load_datatourisme_types
from .communes import CommuneIndex
from .config import Settings, load_settings
from .datatourisme import DT_DB_NAME, build_datatourisme_database
from .geo import valid_coordinates
from .osm import OSM_DB_NAME, OverpassClient, build_osm_database
from .store import JsonCache, PoiRow, query_around, read_meta
from .text import normalize

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("geo")


class State:
    settings: Settings
    communes: CommuneIndex
    overpass: OverpassClient
    dt_types: dict[str, frozenset[str]]
    jobs: dict[str, str]
    lock: asyncio.Lock
    tasks: set[asyncio.Task]


state = State()


def _age_s(meta: dict[str, str]) -> float | None:
    built = meta.get("built_at")
    return time.time() - int(built) if built else None


async def _run_job(name: str, func, *args, claimed: bool = False) -> None:
    if not claimed and state.jobs.get(name) == "running":
        return
    state.jobs[name] = "running"
    try:
        await asyncio.to_thread(func, *args)
        state.jobs[name] = "done"
    except Exception as exc:  # keep the service alive whatever happens
        log.exception("job %s failed", name)
        state.jobs[name] = f"failed: {type(exc).__name__}"


async def refresh_loop() -> None:
    """Rebuild sources when missing or stale. Checks every hour."""
    s = state.settings
    while True:
        try:
            osm_meta = read_meta(s.data_dir / OSM_DB_NAME)
            age = _age_s(osm_meta)
            if s.osm_extract_url and s.osm_auto_ingest and (age is None or age > s.osm_refresh_days * 86400):
                await _run_job("osm", build_osm_database, s.data_dir, s.osm_extract_url, s.user_agent)
            if s.datatourisme_feed_url:
                dt_age = _age_s(read_meta(s.data_dir / DT_DB_NAME))
                if dt_age is None or dt_age > s.datatourisme_refresh_hours * 3600:
                    await _run_job("datatourisme", build_datatourisme_database, s.data_dir,
                                   s.datatourisme_feed_url, state.dt_types, s.user_agent)
        except Exception:
            log.exception("refresh loop iteration failed")
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(_: FastAPI):
    state.settings = load_settings()
    state.settings.data_dir.mkdir(parents=True, exist_ok=True)
    state.communes = CommuneIndex.load(state.settings.communes_path)
    state.overpass = OverpassClient(state.settings.overpass_urls, JsonCache(state.settings.data_dir / "cache.sqlite"),
                                    state.settings.user_agent)
    state.dt_types = load_datatourisme_types(state.settings.datatourisme_types_dir)
    state.jobs = {}
    state.tasks = set()
    log.info("loaded %s communes", len(state.communes))
    task = asyncio.create_task(refresh_loop())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title="Epic Road Trip geo service", version="2.0.0", lifespan=lifespan,
              docs_url="/docs", redoc_url=None)


def _source_status(db_name: str, job: str) -> dict:
    meta = read_meta(state.settings.data_dir / db_name)
    built = meta.get("built_at")
    return {
        "ready": bool(meta),
        "count": int(meta.get("count", 0)) if meta else 0,
        "updatedAt": int(built) if built else None,
        "job": state.jobs.get(job),
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "communes": len(state.communes),
        "osm": _source_status(OSM_DB_NAME, "osm") | {"configured": bool(state.settings.osm_extract_url)},
        "datatourisme": _source_status(DT_DB_NAME, "datatourisme")
        | {"configured": bool(state.settings.datatourisme_feed_url)},
    }


def _start(name: str, func, *args) -> bool:
    """Starts a rebuild in the background unless one is already running for this source."""
    if state.jobs.get(name) == "running":
        return False
    state.jobs[name] = "running"  # claimed now, so a second request or the hourly loop cannot start a duplicate
    task = asyncio.create_task(_run_job(name, func, *args, claimed=True))
    state.tasks.add(task)
    task.add_done_callback(state.tasks.discard)
    return True


@app.post("/refresh/{source}", status_code=202)
async def refresh(source: str, x_admin_token: Annotated[str | None, Header()] = None) -> dict:
    """Manual rebuild requested from the administration (the old index keeps serving until the swap)."""
    s = state.settings
    if s.admin_token and not hmac.compare_digest(x_admin_token or "", s.admin_token):
        raise HTTPException(status_code=403, detail="forbidden")
    if source == "osm":
        if not s.osm_extract_url:
            raise HTTPException(status_code=409, detail="not_configured")
        started = _start("osm", build_osm_database, s.data_dir, s.osm_extract_url, s.user_agent)
    elif source == "datatourisme":
        if not s.datatourisme_feed_url:
            raise HTTPException(status_code=409, detail="not_configured")
        started = _start("datatourisme", build_datatourisme_database, s.data_dir, s.datatourisme_feed_url, state.dt_types, s.user_agent)
    else:
        raise HTTPException(status_code=404, detail="unknown_source")
    return {"source": source, "started": started, "job": state.jobs.get(source)}


@app.get("/communes/search")
def search_communes(q: Annotated[str, Query(min_length=1, max_length=80)],
                    limit: Annotated[int, Query(ge=1, le=20)] = 8) -> dict:
    return {"results": [c.to_dict() for c in state.communes.search(q, limit)]}


@app.get("/communes")
def get_communes(codes: Annotated[str, Query(max_length=400)]) -> dict:
    wanted = [c for c in (part.strip() for part in codes.split(",")) if c][:30]
    found = [state.communes.get(code) for code in wanted]
    return {"results": [c.to_dict() for c in found if c]}


def _serialize(distance: float, row: PoiRow, lang: str) -> dict:
    data = dict(row.data)
    name = row.name
    if lang == "en":
        name = data.pop("nameEn", None) or name
        if data.get("descriptionEn"):
            data["description"] = data["descriptionEn"]
    else:
        data.pop("nameEn", None)
    data.pop("descriptionEn", None)
    return {
        "id": row.id,
        "category": row.category,
        "kind": row.kind,
        "name": name,
        "lat": row.lat,
        "lon": row.lon,
        "distanceKm": round(distance, 2),
        "dateStart": row.date_start,
        "dateEnd": row.date_end,
        **data,
    }


def _parse_date(value: str | None, field: str) -> str | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"{field} must be YYYY-MM-DD") from exc


@app.get("/pois")
async def pois(
    lat: Annotated[float, Query()],
    lon: Annotated[float, Query()],
    radius_km: Annotated[float, Query(gt=0)] = 5,
    date_from: str | None = None,
    date_to: str | None = None,
    lang: Annotated[str, Query(pattern="^(fr|en)$")] = "fr",
) -> dict:
    if not valid_coordinates(lat, lon):
        raise HTTPException(status_code=422, detail="invalid coordinates")
    s = state.settings
    radius = min(radius_km, s.max_radius_km)
    d_from = _parse_date(date_from, "date_from") or date.today().isoformat()
    d_to = _parse_date(date_to, "date_to")
    if d_to and d_to < d_from:
        raise HTTPException(status_code=422, detail="date_to must be after date_from")

    osm_path = s.data_dir / OSM_DB_NAME
    osm_meta = read_meta(osm_path)
    # updatedAt = when the current index was built (Unix seconds), shown to users as data freshness.
    osm_status: dict = {"status": "ok", "via": "extract", "updatedAt": int(osm_meta["built_at"]) if osm_meta.get("built_at") else None}
    if osm_path.exists():
        osm_rows = await asyncio.to_thread(lambda: list(query_around(osm_path, lat, lon, radius)))
    elif s.overpass_urls:
        osm_rows, status, cached_at = await state.overpass.around(lat, lon, radius, s.per_category_limit)
        osm_status = {"status": status, "via": "overpass", "cachedAt": cached_at,
                      "building": state.jobs.get("osm") == "running"}
    else:
        osm_rows, osm_status = [], {"status": "unavailable", "via": None}

    dt_path = s.data_dir / DT_DB_NAME
    dt_rows = await asyncio.to_thread(lambda: list(query_around(dt_path, lat, lon, radius, d_from, d_to)))
    dt_meta = read_meta(dt_path)
    dt_status = {
        "status": "ok" if dt_path.exists() else ("pending" if s.datatourisme_feed_url else "disabled"),
        "updatedAt": int(dt_meta["built_at"]) if dt_meta.get("built_at") else None,
    }

    buckets: dict[str, list[tuple[float, PoiRow]]] = {b: [] for b in ALL_BUCKETS}
    seen_names: dict[str, set[str]] = {b: set() for b in ALL_BUCKETS}
    # DataTourisme first: richer descriptions and photos win over OSM duplicates.
    for distance, row in sorted(dt_rows, key=lambda r: r[0]) + sorted(osm_rows, key=lambda r: r[0]):
        bucket = buckets.get(row.category)
        if bucket is None:
            continue
        dedupe_key = f"{normalize(row.name)}@{round(row.lat, 3)},{round(row.lon, 3)}"
        if dedupe_key in seen_names[row.category]:
            continue
        seen_names[row.category].add(dedupe_key)
        bucket.append((distance, row))

    limit = s.per_category_limit
    return {
        "center": {"lat": lat, "lon": lon},
        "radiusKm": radius,
        "dateFrom": d_from,
        "dateTo": d_to,
        "categories": {
            name: [_serialize(d, r, lang) for d, r in sorted(rows, key=lambda x: x[0])[:limit]]
            for name, rows in buckets.items()
        },
        "sources": {"osm": osm_status, "datatourisme": dt_status},
    }
