"""Manual maintenance commands.

    docker compose exec geo python -m app.cli ingest-osm
    docker compose exec geo python -m app.cli ingest-datatourisme
"""

from __future__ import annotations

import logging
import sys

from .categories import load_datatourisme_types
from .config import load_settings
from .datatourisme import build_datatourisme_database
from .osm import build_osm_database


def main(argv: list[str]) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    settings = load_settings()
    command = argv[1] if len(argv) > 1 else ""
    if command == "ingest-osm":
        if not settings.osm_extract_url:
            print("OSM_EXTRACT_URL is disabled", file=sys.stderr)
            return 1
        build_osm_database(settings.data_dir, settings.osm_extract_url, settings.user_agent)
        return 0
    if command == "ingest-datatourisme":
        if not settings.datatourisme_feed_url:
            print("DATATOURISME_FEED_URL is not set", file=sys.stderr)
            return 1
        types = load_datatourisme_types(settings.datatourisme_types_dir)
        build_datatourisme_database(settings.data_dir, settings.datatourisme_feed_url, types, settings.user_agent)
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
