"""OpenStreetMap points of interest.

Primary path: a regional/national extract (Geofabrik .osm.pbf) is downloaded,
filtered with `osmium tags-filter`, exported as GeoJSON lines and indexed in SQLite.
Fallback path: a live Overpass query, cached, used only until the extract is ready.
"""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import time
from pathlib import Path
from typing import Iterable, Iterator

import httpx

from .categories import ALL_BUCKETS, CATEGORIES, classify_osm, osmium_filter_expressions, overpass_selectors
from .geo import haversine_km
from .store import JsonCache, PoiRow, PoiWriter
from .text import clean_text, safe_url

log = logging.getLogger("geo.osm")

OSM_DB_NAME = "osm.sqlite"


def poi_from_tags(osm_type: str, osm_id: int, lat: float, lon: float, tags: dict[str, str]) -> PoiRow | None:
    classified = classify_osm(tags)
    if not classified:
        return None
    category, kind = classified
    # Fuel and charging stations are often only tagged with a brand or an operator.
    name = (tags.get("name") or tags.get("brand") or (tags.get("operator") if category == "travel" else "") or "").strip()
    if not name:
        return None

    street = " ".join(p for p in (tags.get("addr:housenumber"), tags.get("addr:street")) if p)
    city = " ".join(p for p in (tags.get("addr:postcode"), tags.get("addr:city")) if p)
    address = ", ".join(p for p in (street, city) if p) or None

    data: dict[str, object] = {"source": "osm"}
    optional = {
        "nameEn": tags.get("name:en"),
        "address": address,
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "email": tags.get("email") or tags.get("contact:email"),
        "website": safe_url(tags.get("website") or tags.get("contact:website") or tags.get("url")),
        "openingHours": clean_text(tags.get("opening_hours"), 200),
        "cuisine": clean_text((tags.get("cuisine") or "").replace(";", ", "), 120),
        "stars": clean_text(tags.get("stars"), 10),
        "wheelchair": tags.get("wheelchair") if tags.get("wheelchair") in {"yes", "limited", "no"} else None,
        "description": clean_text(tags.get("description"), 400),
        "image": safe_url(tags.get("image")),
        "wikipedia": clean_text(tags.get("wikipedia"), 120),
        "fee": tags.get("fee") if tags.get("fee") in {"yes", "no"} else None,
    }
    data.update({k: v for k, v in optional.items() if v})

    return PoiRow(
        id=f"osm:{osm_type[0]}{osm_id}",
        category=category,
        kind=kind,
        name=name[:160],
        lat=round(lat, 6),
        lon=round(lon, 6),
        date_start=None,
        date_end=None,
        data=data,
    )


def _iter_coords(geometry: dict) -> Iterator[tuple[float, float]]:
    coords = geometry.get("coordinates")
    stack = [coords]
    while stack:
        item = stack.pop()
        if not isinstance(item, list) or not item:
            continue
        if isinstance(item[0], (int, float)):
            yield float(item[0]), float(item[1])
        else:
            stack.extend(item)


def centre_of(geometry: dict) -> tuple[float, float] | None:
    """(lat, lon) of a GeoJSON geometry: the point itself or the bounding-box centre."""
    if geometry.get("type") == "Point":
        lon, lat = geometry["coordinates"][:2]
        return float(lat), float(lon)
    xs: list[float] = []
    ys: list[float] = []
    for x, y in _iter_coords(geometry):
        xs.append(x)
        ys.append(y)
    if not xs:
        return None
    return (min(ys) + max(ys)) / 2, (min(xs) + max(xs)) / 2


def rows_from_geojsonseq(lines: Iterable[str]) -> Iterator[PoiRow]:
    seen: set[str] = set()
    for line in lines:
        line = line.strip().lstrip("\x1e")
        if not line:
            continue
        try:
            feature = json.loads(line)
        except json.JSONDecodeError:
            continue
        props: dict = feature.get("properties") or {}
        osm_type = str(props.pop("@type", "node"))
        osm_id = props.pop("@id", None)
        if osm_id is None:
            continue
        centre = centre_of(feature.get("geometry") or {})
        if not centre:
            continue
        tags = {k: str(v) for k, v in props.items() if not k.startswith("@")}
        row = poi_from_tags(osm_type, int(osm_id), centre[0], centre[1], tags)
        if row and row.id not in seen:
            seen.add(row.id)
            yield row


def _run(cmd: list[str]) -> None:
    log.info("running %s", " ".join(cmd[:3]))
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def download(url: str, dest: Path, user_agent: str) -> str | None:
    """Stream a large file to disk. Returns the Last-Modified header if any."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with httpx.stream("GET", url, headers={"User-Agent": user_agent}, follow_redirects=True,
                      timeout=httpx.Timeout(60.0, read=300.0)) as response:
        response.raise_for_status()
        last_modified = response.headers.get("last-modified")
        with tmp.open("wb") as fh:
            for chunk in response.iter_bytes(1 << 20):
                fh.write(chunk)
    tmp.replace(dest)
    return last_modified


def build_osm_database(data_dir: Path, extract_url: str, user_agent: str) -> int:
    """Full pipeline. Blocking: run it in a worker thread."""
    if not shutil.which("osmium"):
        raise RuntimeError("osmium-tool is not installed")
    work = data_dir / "osm-work"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    extract = work / "extract.osm.pbf"
    filtered = work / "pois.osm.pbf"
    exported = work / "pois.geojsonseq"
    started = time.monotonic()
    try:
        log.info("downloading OSM extract %s", extract_url)
        last_modified = download(extract_url, extract, user_agent)
        _run(["osmium", "tags-filter", str(extract), *osmium_filter_expressions(),
              "-o", str(filtered), "--overwrite"])
        extract.unlink(missing_ok=True)
        _run(["osmium", "export", str(filtered), "-f", "geojsonseq", "-o", str(exported), "--overwrite",
              "-a", "type,id", "-x", "print_record_separator=false"])
        filtered.unlink(missing_ok=True)

        writer = PoiWriter(data_dir / OSM_DB_NAME)
        try:
            batch: list[PoiRow] = []
            with exported.open("r", encoding="utf-8") as fh:
                for row in rows_from_geojsonseq(fh):
                    batch.append(row)
                    if len(batch) >= 5000:
                        writer.add_many(batch)
                        batch.clear()
            writer.add_many(batch)
            count = writer.commit({
                "source_url": extract_url,
                "extract_last_modified": last_modified or "",
            })
        except Exception:
            writer.abort()
            raise
        log.info("OSM database ready: %s POIs in %.0fs", count, time.monotonic() - started)
        return count
    finally:
        shutil.rmtree(work, ignore_errors=True)


# --------------------------------------------------------------------------- Overpass


def overpass_query(lat: float, lon: float, radius_m: int, per_category: int) -> str:
    parts = ["[out:json][timeout:25];"]
    for category in CATEGORIES:
        selectors = "".join(f"{s}(around:{radius_m},{lat:.5f},{lon:.5f});" for s in overpass_selectors(category))
        parts.append(f"({selectors})->.{category};.{category} out tags center {per_category};")
    return "".join(parts)


def rows_from_overpass(payload: dict) -> list[PoiRow]:
    rows: dict[str, PoiRow] = {}
    for element in payload.get("elements", []):
        lat = element.get("lat") or (element.get("center") or {}).get("lat")
        lon = element.get("lon") or (element.get("center") or {}).get("lon")
        if lat is None or lon is None:
            continue
        row = poi_from_tags(element.get("type", "node"), int(element["id"]), float(lat), float(lon),
                            element.get("tags") or {})
        if row:
            rows[row.id] = row
    return list(rows.values())


class OverpassClient:
    def __init__(self, urls: tuple[str, ...], cache: JsonCache, user_agent: str) -> None:
        self.urls = urls
        self.cache = cache
        self.user_agent = user_agent

    async def around(self, lat: float, lon: float, radius_km: float, per_category: int
                     ) -> tuple[list[tuple[float, PoiRow]], str, int | None]:
        """Return (rows with distance, status, cached_at). Status: ok | stale | unavailable."""
        radius_m = int(min(radius_km, 15) * 1000)
        key = f"{lat:.3f}:{lon:.3f}:{radius_m}"
        fresh = self.cache.get(key, 7 * 86400)
        if fresh:
            payload, stored_at = fresh
            return self._with_distance(payload, lat, lon, radius_km), "ok", stored_at

        query = overpass_query(lat, lon, radius_m, per_category)
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0), headers={"User-Agent": self.user_agent}) as client:
            for url in self.urls:
                try:
                    response = await client.post(url, data={"data": query})
                    if response.status_code != 200:
                        log.warning("overpass %s returned %s", url, response.status_code)
                        continue
                    payload = response.json()
                    self.cache.set(key, payload)
                    return self._with_distance(payload, lat, lon, radius_km), "ok", int(time.time())
                except (httpx.HTTPError, ValueError) as exc:
                    log.warning("overpass %s failed: %s", url, exc)
        stale = self.cache.get(key, 90 * 86400)
        if stale:
            payload, stored_at = stale
            return self._with_distance(payload, lat, lon, radius_km), "stale", stored_at
        return [], "unavailable", None

    @staticmethod
    def _with_distance(payload: object, lat: float, lon: float, radius_km: float) -> list[tuple[float, PoiRow]]:
        out = []
        for row in rows_from_overpass(payload if isinstance(payload, dict) else {}):
            distance = haversine_km(lat, lon, row.lat, row.lon)
            if distance <= radius_km:
                out.append((distance, row))
        return out


__all__ = [
    "ALL_BUCKETS",
    "OSM_DB_NAME",
    "OverpassClient",
    "build_osm_database",
    "centre_of",
    "poi_from_tags",
    "rows_from_geojsonseq",
    "rows_from_overpass",
]
