"""Category model shared by every data source.

Five permanent categories (eat, drink, sleep, enjoy, travel) mirror the original
Epic Road Trip API, plus a sixth "events" bucket for dated DataTourisme entries.
"""

from __future__ import annotations

import json
from pathlib import Path

CATEGORIES: tuple[str, ...] = ("eat", "drink", "sleep", "enjoy", "travel")
ALL_BUCKETS: tuple[str, ...] = (*CATEGORIES, "events")

# Order matters: the first matching rule wins (a hotel with a restaurant is "sleep").
OSM_RULES: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("sleep", "tourism", ("hotel", "guest_house", "hostel", "motel", "camp_site", "caravan_site",
                          "chalet", "alpine_hut", "apartment", "wilderness_hut")),
    ("eat", "amenity", ("restaurant", "fast_food", "ice_cream", "food_court", "marketplace")),
    ("eat", "shop", ("bakery", "pastry", "cheese", "deli", "chocolate")),
    ("drink", "amenity", ("bar", "pub", "cafe", "biergarten")),
    ("drink", "craft", ("winery", "brewery", "distillery")),
    ("drink", "shop", ("wine",)),
    ("enjoy", "tourism", ("museum", "attraction", "viewpoint", "gallery", "theme_park", "zoo", "aquarium")),
    ("enjoy", "historic", ("castle", "monument", "ruins", "archaeological_site", "fort", "manor", "abbey")),
    ("enjoy", "leisure", ("water_park", "nature_reserve", "beach_resort")),
    ("enjoy", "amenity", ("theatre", "cinema", "arts_centre")),
    ("enjoy", "natural", ("beach",)),
    ("travel", "railway", ("station", "halt")),
    ("travel", "amenity", ("bus_station", "ferry_terminal", "car_rental", "bicycle_rental",
                           "charging_station", "fuel")),
    ("travel", "aeroway", ("aerodrome",)),
)


def classify_osm(tags: dict[str, str]) -> tuple[str, str] | None:
    for category, key, values in OSM_RULES:
        value = tags.get(key)
        if value in values:
            return category, value
    return None


def osmium_filter_expressions() -> list[str]:
    """Expressions for `osmium tags-filter`, grouped by key (nwr/amenity=a,b,c)."""
    grouped: dict[str, list[str]] = {}
    for _, key, values in OSM_RULES:
        bucket = grouped.setdefault(key, [])
        bucket.extend(v for v in values if v not in bucket)
    return [f"nwr/{key}={','.join(values)}" for key, values in grouped.items()]


def overpass_selectors(category: str) -> list[str]:
    selectors = []
    for cat, key, values in OSM_RULES:
        if cat == category:
            selectors.append(f'nwr["{key}"~"^({"|".join(values)})$"]["name"]')
    return selectors


def load_datatourisme_types(directory: Path) -> dict[str, frozenset[str]]:
    """Type lists inherited from the 2024 project (filtre/*.json)."""
    types: dict[str, frozenset[str]] = {}
    for category in CATEGORIES:
        path = directory / f"{category}.json"
        if path.exists():
            types[category] = frozenset(json.loads(path.read_text(encoding="utf-8")))
    return types


DATATOURISME_PRIORITY: tuple[str, ...] = ("sleep", "eat", "drink", "travel", "enjoy")
