from app.categories import load_datatourisme_types
from app.config import PACKAGE_DATA_DIR
from app.datatourisme import parse_object

TYPES = load_datatourisme_types(PACKAGE_DATA_DIR / "datatourisme")


def _event(**overrides):
    obj = {
        "@id": "https://data.datatourisme.fr/1/abc",
        "@type": ["schema:Event", "Festival", "EntertainmentAndEvent"],
        "rdfs:label": {"fr": ["Festival de jazz"], "en": ["Jazz festival"]},
        "takesPlaceAt": [{"startDate": "2026-07-10", "endDate": "2026-07-12", "startTime": "18:00:00"}],
        "isLocatedAt": [{
            "schema:geo": {"schema:latitude": "43.52", "schema:longitude": "5.45"},
            "schema:address": [{"schema:streetAddress": ["Cours Mirabeau"], "schema:postalCode": "13100",
                                "schema:addressLocality": "Aix-en-Provence"}],
        }],
        "offers": [{"schema:priceSpecification": [{"schema:minPrice": ["10"], "schema:maxPrice": ["25"]}]}],
        "hasDescription": [{"dc:description": {"fr": ["Trois soirs de concerts."], "en": ["Three nights."]}}],
        "hasContact": [{"schema:telephone": ["+33 4 00 00 00 00"], "foaf:homepage": ["https://jazz.example"]}],
        "hasRepresentation": [{"ebucore:hasRelatedResource": [{"ebucore:locator": ["https://img.example/a.jpg"]}]}],
    }
    obj.update(overrides)
    return obj


def test_types_loaded_from_legacy_filters():
    assert {"eat", "drink", "sleep", "enjoy", "travel"} <= set(TYPES)
    assert "Festival" in TYPES["enjoy"]


def test_event_is_parsed_with_dates_and_details():
    row = parse_object(_event(), TYPES)
    assert row is not None
    assert row.category == "events"
    assert (row.date_start, row.date_end) == ("2026-07-10", "2026-07-12")
    assert row.data["price"] == "10–25 €"
    assert row.data["address"] == "Cours Mirabeau, 13100 Aix-en-Provence"
    assert row.data["nameEn"] == "Jazz festival"
    assert row.data["website"] == "https://jazz.example"
    assert row.id.startswith("dt:")


def test_permanent_place_keeps_its_category():
    obj = _event(**{"@type": ["Accommodation", "schema:LodgingBusiness"], "takesPlaceAt": None})
    row = parse_object(obj, TYPES)
    assert row is not None and row.category == "sleep" and row.date_start is None


def test_rejects_missing_coordinates_or_unknown_type():
    assert parse_object(_event(isLocatedAt=[{}]), TYPES) is None
    assert parse_object(_event(**{"@type": ["Unknown"]}), TYPES) is None


def test_pdf_image_and_unsafe_links_are_dropped():
    obj = _event(
        hasRepresentation=[{"ebucore:hasRelatedResource": [{"ebucore:locator": ["https://x.example/a.PDF"]}]}],
        hasContact=[{"foaf:homepage": ["javascript:alert(1)"]}],
    )
    row = parse_object(obj, TYPES)
    assert "image" not in row.data and "website" not in row.data
