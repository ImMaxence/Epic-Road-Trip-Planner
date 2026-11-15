"""DataTourisme feed ingestion (optional, needs a free account on datatourisme.fr).

The feed is a ZIP of JSON-LD objects. The parsing rules are a hardened port of
the 2024 `filtrer.py` script, plus addresses and English labels.
"""

from __future__ import annotations

import hashlib
import json
import logging
import shutil
import time
import zipfile
from pathlib import Path
from typing import Any, Iterator

from .categories import DATATOURISME_PRIORITY
from .osm import download
from .store import PoiRow, PoiWriter
from .text import clean_text, safe_url

log = logging.getLogger("geo.datatourisme")

DT_DB_NAME = "datatourisme.sqlite"
EVENT_TYPES = frozenset({"EntertainmentAndEvent", "schema:Event", "CulturalEvent", "SportsEvent",
                         "SaleEvent", "SocialEvent", "BusinessEvent", "ShowEvent", "Festival"})


def _first(value: Any) -> Any:
    if isinstance(value, list):
        return value[0] if value else None
    return value


def _lang(value: Any, lang: str) -> str | None:
    """DataTourisme localised strings look like {"fr": ["..."], "en": ["..."]}."""
    if isinstance(value, dict):
        return _first(value.get(lang))
    return None


def _date(value: Any) -> str | None:
    text = _first(value)
    if isinstance(text, str) and len(text) >= 10 and text[4] == "-":
        return text[:10]
    return None


def parse_object(obj: dict, types_by_category: dict[str, frozenset[str]]) -> PoiRow | None:
    types = set(obj.get("@type") or [])
    category = next((c for c in DATATOURISME_PRIORITY if types & types_by_category.get(c, frozenset())), None)
    if not category:
        return None

    label = obj.get("rdfs:label")
    name = clean_text(_lang(label, "fr") or _lang(label, "en"), 160)
    location = _first(obj.get("isLocatedAt")) or {}
    geo = location.get("schema:geo") or {}
    try:
        lat = float(_first(geo.get("schema:latitude")))
        lon = float(_first(geo.get("schema:longitude")))
    except (TypeError, ValueError):
        return None
    if not name:
        return None

    period = _first(obj.get("takesPlaceAt")) or {}
    date_start = _date(period.get("startDate"))
    date_end = _date(period.get("endDate")) or date_start
    is_event = bool(types & EVENT_TYPES) or date_start is not None

    address = _first(location.get("schema:address")) or {}
    street = clean_text(_first(address.get("schema:streetAddress")), 120)
    city = " ".join(p for p in (_first(address.get("schema:postalCode")), _first(address.get("schema:addressLocality"))) if isinstance(p, str))

    offer = _first(obj.get("offers")) or {}
    spec = _first(offer.get("schema:priceSpecification")) or {}
    min_price, max_price = _first(spec.get("schema:minPrice")), _first(spec.get("schema:maxPrice"))
    price = None
    if min_price and max_price and min_price != max_price:
        price = f"{min_price}–{max_price} €"
    elif min_price or max_price:
        price = f"{min_price or max_price} €"

    description = _first(obj.get("hasDescription")) or {}
    desc = description.get("dc:description") or description.get("shortDescription")
    contact = _first(obj.get("hasContact")) or {}
    representation = _first(obj.get("hasRepresentation")) or {}
    resource = _first(representation.get("ebucore:hasRelatedResource")) or {}
    image = safe_url(_first(resource.get("ebucore:locator")))
    if image and image.lower().endswith(".pdf"):
        image = None

    data: dict[str, object] = {"source": "datatourisme"}
    optional = {
        "nameEn": clean_text(_lang(label, "en"), 160),
        "address": ", ".join(p for p in (street, city) if p) or None,
        "phone": clean_text(_first(contact.get("schema:telephone")), 40),
        "email": clean_text(_first(contact.get("schema:email")), 120),
        "website": safe_url(_first(contact.get("foaf:homepage"))),
        "description": clean_text(_lang(desc, "fr"), 500),
        "descriptionEn": clean_text(_lang(desc, "en"), 500),
        "image": image,
        "price": price,
        "event": is_event or None,
    }
    data.update({k: v for k, v in optional.items() if v})
    uri = str(obj.get("@id") or f"{name}:{lat}:{lon}")
    return PoiRow(
        id="dt:" + hashlib.sha1(uri.encode("utf-8")).hexdigest()[:16],
        category="events" if is_event else category,
        kind=next(iter(sorted(t for t in types if ":" not in t)), None),
        name=name,
        lat=round(lat, 6),
        lon=round(lon, 6),
        date_start=date_start,
        date_end=date_end,
        data=data,
    )


def iter_zip_objects(archive: Path) -> Iterator[dict]:
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            if info.is_dir() or not info.filename.endswith(".json") or "objects/" not in info.filename:
                continue
            try:
                with zf.open(info) as fh:
                    yield json.load(fh)
            except (json.JSONDecodeError, UnicodeDecodeError, zipfile.BadZipFile):
                continue


def build_datatourisme_database(data_dir: Path, feed_url: str, types_by_category: dict[str, frozenset[str]],
                                user_agent: str) -> int:
    work = data_dir / "dt-work"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    archive = work / "feed.zip"
    started = time.monotonic()
    try:
        log.info("downloading DataTourisme feed")
        download(feed_url, archive, user_agent)
        writer = PoiWriter(data_dir / DT_DB_NAME)
        try:
            batch: list[PoiRow] = []
            for obj in iter_zip_objects(archive):
                row = parse_object(obj, types_by_category)
                if row:
                    batch.append(row)
                if len(batch) >= 2000:
                    writer.add_many(batch)
                    batch.clear()
            writer.add_many(batch)
            count = writer.commit({"source_url": "datatourisme"})
        except Exception:
            writer.abort()
            raise
        log.info("DataTourisme database ready: %s entries in %.0fs", count, time.monotonic() - started)
        return count
    finally:
        shutil.rmtree(work, ignore_errors=True)
