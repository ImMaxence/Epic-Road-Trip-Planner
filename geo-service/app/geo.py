"""Small geodesy helpers (WGS84, distances in kilometres)."""

from __future__ import annotations

import math

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


def bounding_box(lat: float, lon: float, radius_km: float) -> tuple[float, float, float, float]:
    """Return (min_lat, max_lat, min_lon, max_lon) enclosing a circle."""
    dlat = math.degrees(radius_km / EARTH_RADIUS_KM)
    cos_lat = max(0.01, math.cos(math.radians(lat)))
    dlon = math.degrees(radius_km / (EARTH_RADIUS_KM * cos_lat))
    return lat - dlat, lat + dlat, lon - dlon, lon + dlon


def valid_coordinates(lat: float, lon: float) -> bool:
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
