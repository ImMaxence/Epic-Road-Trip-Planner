"""In-memory index of French communes (official geo.api.gouv.fr dataset)."""

from __future__ import annotations

import heapq
import json
from dataclasses import dataclass
from pathlib import Path

from .text import normalize


@dataclass(frozen=True, slots=True)
class Commune:
    code: str
    name: str
    postcode: str
    dep: str
    dep_name: str
    lat: float
    lon: float
    population: int
    key: str

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "name": self.name,
            "postcode": self.postcode,
            "departmentCode": self.dep,
            "department": self.dep_name,
            "lat": self.lat,
            "lon": self.lon,
            "population": self.population,
            "label": f"{self.name} ({self.dep})",
        }


class CommuneIndex:
    def __init__(self, items: list[Commune], source: str = "") -> None:
        self.items = items
        self.source = source
        self._by_code = {c.code: c for c in items}

    @classmethod
    def load(cls, path: Path) -> "CommuneIndex":
        raw = json.loads(path.read_text(encoding="utf-8"))
        departments: dict[str, str] = raw.get("departments", {})
        items = [
            Commune(
                code=row[0],
                name=row[1],
                postcode=row[2],
                dep=row[3],
                dep_name=departments.get(row[3], ""),
                lat=float(row[4]),
                lon=float(row[5]),
                population=int(row[6] or 0),
                key=normalize(row[1]),
            )
            for row in raw["rows"]
        ]
        return cls(items, raw.get("source", ""))

    def __len__(self) -> int:
        return len(self.items)

    def get(self, code: str) -> Commune | None:
        return self._by_code.get(code)

    def search(self, query: str, limit: int = 8) -> list[Commune]:
        tokens = normalize(query).split()
        if not tokens:
            return []
        # A trailing number narrows by department or postcode ("marseille 13", "lyon 69003").
        number = tokens[-1] if tokens[-1].isdigit() else None
        words = " ".join(t for t in tokens if not t.isdigit())

        candidates: list[tuple[int, int, int, str, Commune]] = []
        for c in self.items:
            if number and not (c.postcode.startswith(number) or c.dep == number or c.code.startswith(number)):
                continue
            # Same tier → most populated first, so "mars" suggests Marseille before the village of Mars.
            if words:
                if c.key.startswith(words):
                    rank = 0
                elif f" {words}" in c.key:
                    rank = 1
                elif words in c.key:
                    rank = 2
                else:
                    continue
            else:
                rank = 0
            candidates.append((rank, -c.population, len(c.name), c.code, c))
        return [entry[-1] for entry in heapq.nsmallest(limit, candidates)]
