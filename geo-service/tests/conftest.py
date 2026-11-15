import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("GEO_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("OSM_EXTRACT_URL", "none")
    monkeypatch.setenv("OVERPASS_URLS", "none")
    monkeypatch.delenv("DATATOURISME_FEED_URL", raising=False)
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
