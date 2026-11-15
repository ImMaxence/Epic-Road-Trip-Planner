from app.geo import bounding_box, haversine_km
from app.text import clean_text, normalize, safe_url


def test_normalize_strips_accents_and_separators():
    assert normalize("Saint-Étienne") == "saint etienne"
    assert normalize("  L'Haÿ-les-Roses ") == "l hay les roses"
    assert normalize("St Tropez") == "saint tropez"
    assert normalize("Ste Maxime") == "sainte maxime"


def test_normalize_keeps_partial_st_for_strasbourg():
    assert normalize("st") == "st"
    assert normalize("Stras") == "stras"


def test_safe_url_only_allows_http():
    assert safe_url("https://example.org/a") == "https://example.org/a"
    assert safe_url("www.example.org") == "https://www.example.org"
    assert safe_url("javascript:alert(1)") is None
    assert safe_url("data:text/html,hi") is None
    assert safe_url("https://exa mple.org") is None
    assert safe_url(None) is None


def test_clean_text_truncates_on_word_boundary():
    assert clean_text("  a   b  ") == "a b"
    assert clean_text("word " * 50, 20).endswith("…")
    assert clean_text("") is None


def test_haversine_marseille_paris():
    distance = haversine_km(43.2965, 5.3698, 48.8566, 2.3522)
    assert 655 < distance < 665


def test_bounding_box_contains_radius():
    min_lat, max_lat, min_lon, max_lon = bounding_box(45.0, 5.0, 10)
    assert haversine_km(45.0, 5.0, max_lat, 5.0) >= 9.99
    assert haversine_km(45.0, 5.0, 45.0, max_lon) >= 9.99
    assert min_lat < 45.0 < max_lat and min_lon < 5.0 < max_lon
