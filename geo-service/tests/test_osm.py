import json

from app.categories import classify_osm, osmium_filter_expressions, overpass_selectors
from app.osm import centre_of, overpass_query, poi_from_tags, rows_from_geojsonseq, rows_from_overpass


def test_classify_priority_hotel_with_restaurant_is_sleep():
    assert classify_osm({"tourism": "hotel", "amenity": "restaurant"}) == ("sleep", "hotel")
    assert classify_osm({"amenity": "cafe"}) == ("drink", "cafe")
    assert classify_osm({"shop": "bakery"}) == ("eat", "bakery")
    assert classify_osm({"amenity": "charging_station"}) == ("travel", "charging_station")
    assert classify_osm({"amenity": "bench"}) is None


def test_poi_requires_name_and_sanitises_links():
    assert poi_from_tags("node", 1, 43.0, 5.0, {"amenity": "restaurant"}) is None
    row = poi_from_tags("way", 42, 43.123456789, 5.0, {
        "amenity": "restaurant", "name": "Chez Fonfon", "cuisine": "fish;regional",
        "website": "javascript:alert(1)", "addr:street": "Vallon des Auffes", "addr:housenumber": "140",
        "addr:postcode": "13007", "addr:city": "Marseille", "wheelchair": "maybe",
    })
    assert row is not None
    assert row.id == "osm:w42"
    assert row.category == "eat" and row.kind == "restaurant"
    assert row.lat == 43.123457
    assert row.data["cuisine"] == "fish, regional"
    assert row.data["address"] == "140 Vallon des Auffes, 13007 Marseille"
    assert "website" not in row.data
    assert "wheelchair" not in row.data


def test_centre_of_polygon_uses_bbox_centre():
    poly = {"type": "Polygon", "coordinates": [[[5.0, 43.0], [5.2, 43.0], [5.2, 43.2], [5.0, 43.2], [5.0, 43.0]]]}
    lat, lon = centre_of(poly)
    assert round(lat, 6) == 43.1 and round(lon, 6) == 5.1
    assert centre_of({"type": "Point", "coordinates": [5.5, 43.5]}) == (43.5, 5.5)


def test_geojsonseq_parsing_dedupes_and_skips_garbage():
    feature = {"type": "Feature", "geometry": {"type": "Point", "coordinates": [5.37, 43.29]},
               "properties": {"@type": "node", "@id": 7, "amenity": "bar", "name": "Le Bar"}}
    lines = ["\x1e" + json.dumps(feature), json.dumps(feature), "not json", ""]
    rows = list(rows_from_geojsonseq(lines))
    assert len(rows) == 1 and rows[0].id == "osm:n7" and rows[0].category == "drink"


def test_overpass_query_and_parsing():
    query = overpass_query(43.3, 5.4, 5000, 50)
    for category in ("eat", "drink", "sleep", "enjoy", "travel"):
        assert f"->.{category};.{category} out tags center 50;" in query
    payload = {"elements": [
        {"type": "node", "id": 1, "lat": 43.3, "lon": 5.4, "tags": {"amenity": "pub", "name": "Pub"}},
        {"type": "way", "id": 2, "center": {"lat": 43.31, "lon": 5.41}, "tags": {"tourism": "museum", "name": "Mucem"}},
        {"type": "node", "id": 3, "tags": {"amenity": "pub", "name": "No coords"}},
    ]}
    rows = {r.id: r for r in rows_from_overpass(payload)}
    assert set(rows) == {"osm:n1", "osm:w2"}
    assert rows["osm:w2"].category == "enjoy"


def test_filter_expressions_cover_every_rule():
    expressions = osmium_filter_expressions()
    assert any(e.startswith("nwr/amenity=") and "restaurant" in e and "fuel" in e for e in expressions)
    assert any(e.startswith("nwr/tourism=") and "hotel" in e and "museum" in e for e in expressions)
    assert overpass_selectors("drink")
