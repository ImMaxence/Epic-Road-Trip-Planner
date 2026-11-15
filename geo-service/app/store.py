"""SQLite storage for points of interest.

Each source (OpenStreetMap extract, DataTourisme feed) is built into its own file
and swapped atomically, so readers never see a half-written database.
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator

from .geo import bounding_box, haversine_km

SCHEMA = """
CREATE TABLE IF NOT EXISTS poi (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    kind TEXT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    date_start TEXT,
    date_end TEXT,
    data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
"""

INDEXES = """
CREATE INDEX IF NOT EXISTS idx_poi_lat_lon ON poi(lat, lon);
"""


@dataclass(slots=True)
class PoiRow:
    id: str
    category: str
    kind: str | None
    name: str
    lat: float
    lon: float
    date_start: str | None
    date_end: str | None
    data: dict


class PoiWriter:
    """Writes a fresh database next to the target, then replaces it atomically."""

    def __init__(self, target: Path) -> None:
        self.target = target
        self.tmp = target.with_suffix(".building.sqlite")
        target.parent.mkdir(parents=True, exist_ok=True)
        if self.tmp.exists():
            self.tmp.unlink()
        self.conn = sqlite3.connect(self.tmp)
        self.conn.executescript("PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;" + SCHEMA)
        self.count = 0

    def add_many(self, rows: Iterable[PoiRow]) -> None:
        batch = [
            (r.id, r.category, r.kind, r.name, r.lat, r.lon, r.date_start, r.date_end,
             json.dumps(r.data, ensure_ascii=False, separators=(",", ":")))
            for r in rows
        ]
        if batch:
            self.conn.executemany("INSERT OR REPLACE INTO poi VALUES (?,?,?,?,?,?,?,?,?)", batch)
            self.count += len(batch)

    def commit(self, meta: dict[str, str]) -> int:
        meta = {**meta, "built_at": str(int(time.time())), "count": str(self.count)}
        self.conn.executemany("INSERT OR REPLACE INTO meta VALUES (?,?)", meta.items())
        self.conn.executescript(INDEXES)
        self.conn.commit()
        self.conn.execute("VACUUM")
        self.conn.close()
        os.replace(self.tmp, self.target)
        return self.count

    def abort(self) -> None:
        try:
            self.conn.close()
        finally:
            if self.tmp.exists():
                self.tmp.unlink()


def _connect_ro(path: Path) -> sqlite3.Connection:
    return sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, timeout=5)


def read_meta(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    try:
        with closing(_connect_ro(path)) as conn:
            return dict(conn.execute("SELECT key, value FROM meta").fetchall())
    except sqlite3.DatabaseError:
        return {}


def query_around(
    path: Path,
    lat: float,
    lon: float,
    radius_km: float,
    date_from: str | None = None,
    date_to: str | None = None,
) -> Iterator[tuple[float, PoiRow]]:
    """Yield (distance_km, row) inside the radius, unsorted.

    Dated rows are kept only when they overlap [date_from, date_to]; undated rows always pass.
    """
    if not path.exists():
        return
    min_lat, max_lat, min_lon, max_lon = bounding_box(lat, lon, radius_km)
    sql = (
        "SELECT id, category, kind, name, lat, lon, date_start, date_end, data FROM poi "
        "WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?"
    )
    params: list[object] = [min_lat, max_lat, min_lon, max_lon]
    if date_from:
        sql += " AND (date_end IS NULL OR date_end >= ?)"
        params.append(date_from)
    if date_to:
        sql += " AND (date_start IS NULL OR date_start <= ?)"
        params.append(date_to)
    with closing(_connect_ro(path)) as conn:
        for row in conn.execute(sql, params):
            distance = haversine_km(lat, lon, row[4], row[5])
            if distance <= radius_km:
                yield distance, PoiRow(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7],
                                       json.loads(row[8]))


class JsonCache:
    """Tiny key/value cache with TTL, used for Overpass fallback responses."""

    def __init__(self, path: Path) -> None:
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(path)) as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, stored_at INTEGER, value TEXT)"
            )
            conn.commit()

    def get(self, key: str, max_age_s: int) -> tuple[object, int] | None:
        with closing(sqlite3.connect(self.path, timeout=5)) as conn:
            row = conn.execute("SELECT stored_at, value FROM cache WHERE key = ?", (key,)).fetchone()
        if not row:
            return None
        stored_at, value = row
        if time.time() - stored_at > max_age_s:
            return None
        return json.loads(value), stored_at

    def set(self, key: str, value: object) -> None:
        with closing(sqlite3.connect(self.path, timeout=5)) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO cache VALUES (?, ?, ?)",
                (key, int(time.time()), json.dumps(value, ensure_ascii=False)),
            )
            conn.commit()
