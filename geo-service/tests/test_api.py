from app.osm import OSM_DB_NAME, poi_from_tags
from app.datatourisme import DT_DB_NAME
from app.store import PoiRow, PoiWriter


def test_health(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["communes"] > 30000
    assert body["osm"]["configured"] is False


def test_search_ranks_big_cities_first(client):
    results = client.get("/communes/search", params={"q": "mars"}).json()["results"]
    assert results[0]["name"] == "Marseille"
    assert results[0]["code"] == "13055"
    assert results[0]["label"] == "Marseille (13)"


def test_search_accent_insensitive_and_department_filter(client):
    results = client.get("/communes/search", params={"q": "saint etienne 42"}).json()["results"]
    assert results and results[0]["name"] == "Saint-Étienne"
    assert all(r["departmentCode"] == "42" or r["postcode"].startswith("42") for r in results)


def test_resolve_codes(client):
    results = client.get("/communes", params={"codes": "75056,13055,nope"}).json()["results"]
    assert [r["name"] for r in results] == ["Paris", "Marseille"]


def test_pois_from_local_databases(client, tmp_path):
    writer = PoiWriter(tmp_path / OSM_DB_NAME)
    writer.add_many([
        poi_from_tags("node", 1, 43.2965, 5.3698, {"amenity": "restaurant", "name": "Near"}),
        poi_from_tags("node", 2, 43.30, 5.38, {"amenity": "bar", "name": "Bar", "name:en": "Bar EN"}),
        poi_from_tags("node", 3, 44.5, 5.38, {"amenity": "restaurant", "name": "Far away"}),
    ])
    writer.commit({"source_url": "test"})

    dt = PoiWriter(tmp_path / DT_DB_NAME)
    dt.add_many([
        PoiRow("dt:1", "events", "Festival", "Fête", 43.297, 5.37, "2026-07-01", "2026-07-03", {"source": "datatourisme"}),
        PoiRow("dt:2", "events", "Festival", "Old", 43.297, 5.37, "2024-07-01", "2024-07-03", {"source": "datatourisme"}),
    ])
    dt.commit({})

    body = client.get("/pois", params={"lat": 43.2965, "lon": 5.3698, "radius_km": 5,
                                        "date_from": "2026-06-30", "date_to": "2026-07-05", "lang": "en"}).json()
    assert [p["name"] for p in body["categories"]["eat"]] == ["Near"]
    assert body["categories"]["drink"][0]["name"] == "Bar EN"
    assert [p["name"] for p in body["categories"]["events"]] == ["Fête"]
    assert body["sources"]["osm"]["via"] == "extract"
    assert isinstance(body["sources"]["osm"]["updatedAt"], int)
    assert body["sources"]["datatourisme"]["status"] == "ok"
    assert isinstance(body["sources"]["datatourisme"]["updatedAt"], int)


def test_pois_validation(client):
    assert client.get("/pois", params={"lat": 120, "lon": 5}).status_code == 422
    assert client.get("/pois", params={"lat": 43, "lon": 5, "date_from": "bad"}).status_code == 422
    assert client.get("/pois", params={"lat": 43, "lon": 5, "lang": "de"}).status_code == 422


def test_pois_without_any_source_reports_unavailable(client):
    body = client.get("/pois", params={"lat": 43.3, "lon": 5.4}).json()
    assert body["sources"]["osm"]["status"] == "unavailable"
    assert all(v == [] for v in body["categories"].values())


def test_refresh_rejects_unknown_or_unconfigured_sources(client):
    assert client.post("/refresh/nope").status_code == 404
    assert client.post("/refresh/osm").status_code == 409  # OSM_EXTRACT_URL disabled in tests
    assert client.post("/refresh/datatourisme").status_code == 409


def test_refresh_requires_the_token_and_never_runs_twice(tmp_path, monkeypatch):
    import threading

    from fastapi.testclient import TestClient

    import app.main as main

    monkeypatch.setenv("GEO_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("OSM_EXTRACT_URL", "https://example.invalid/test.osm.pbf")
    monkeypatch.setenv("OSM_AUTO_INGEST", "false")
    monkeypatch.setenv("OVERPASS_URLS", "none")
    monkeypatch.setenv("GEO_ADMIN_TOKEN", "s3cret")
    release, calls = threading.Event(), []

    def fake_build(*args):
        calls.append(args)
        release.wait(5)

    monkeypatch.setattr(main, "build_osm_database", fake_build)
    with TestClient(main.app) as client:
        assert client.post("/refresh/osm").status_code == 403
        assert client.post("/refresh/osm", headers={"X-Admin-Token": "wrong"}).status_code == 403
        first = client.post("/refresh/osm", headers={"X-Admin-Token": "s3cret"})
        assert first.status_code == 202 and first.json()["started"] is True
        second = client.post("/refresh/osm", headers={"X-Admin-Token": "s3cret"}).json()
        assert second == {"source": "osm", "started": False, "job": "running"}
        assert client.get("/health").json()["osm"]["job"] == "running"
        release.set()
    assert len(calls) == 1
