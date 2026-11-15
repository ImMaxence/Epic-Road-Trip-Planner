"""Runtime configuration, read once from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
PACKAGE_DATA_DIR = APP_DIR.parent / "data"

DEFAULT_OSM_EXTRACT = "https://download.geofabrik.de/europe/france-latest.osm.pbf"
DEFAULT_OVERPASS = (
    "https://overpass-api.de/api/interpreter,"
    "https://overpass.private.coffee/api/interpreter,"
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
)


def _str(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value.strip()


def _int(name: str, default: int) -> int:
    raw = _str(name)
    try:
        return int(raw) if raw is not None else default
    except ValueError:
        return default


def _bool(name: str, default: bool) -> bool:
    raw = _str(name)
    if raw is None:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    communes_path: Path
    datatourisme_types_dir: Path
    osm_extract_url: str | None
    osm_refresh_days: int
    osm_auto_ingest: bool
    overpass_urls: tuple[str, ...]
    datatourisme_feed_url: str | None
    datatourisme_refresh_hours: int
    user_agent: str
    max_radius_km: int
    per_category_limit: int
    # Shared secret required by POST /refresh (defence in depth: the service is internal anyway).
    admin_token: str | None


def load_settings() -> Settings:
    data_dir = Path(_str("GEO_DATA_DIR", "/data") or "/data")
    disabled = {"none", "off", "disabled", "false"}
    overpass = _str("OVERPASS_URLS", DEFAULT_OVERPASS) or ""
    if overpass.lower() in disabled:
        overpass = ""
    extract = _str("OSM_EXTRACT_URL", DEFAULT_OSM_EXTRACT)
    if extract and extract.lower() in disabled:
        extract = None
    return Settings(
        data_dir=data_dir,
        communes_path=PACKAGE_DATA_DIR / "communes.json",
        datatourisme_types_dir=PACKAGE_DATA_DIR / "datatourisme",
        osm_extract_url=extract,
        osm_refresh_days=max(1, _int("OSM_REFRESH_DAYS", 30)),
        osm_auto_ingest=_bool("OSM_AUTO_INGEST", True),
        overpass_urls=tuple(u.strip() for u in overpass.split(",") if u.strip()),
        datatourisme_feed_url=_str("DATATOURISME_FEED_URL"),
        datatourisme_refresh_hours=max(1, _int("DATATOURISME_REFRESH_HOURS", 48)),
        user_agent=_str(
            "GEO_USER_AGENT",
            "EpicRoadTripPlanner/2.0 (+https://tripplanner.mbonnici.fr)",
        )
        or "EpicRoadTripPlanner/2.0",
        max_radius_km=max(1, _int("MAX_RADIUS_KM", 30)),
        per_category_limit=max(10, _int("PER_CATEGORY_LIMIT", 80)),
        admin_token=_str("GEO_ADMIN_TOKEN"),
    )
