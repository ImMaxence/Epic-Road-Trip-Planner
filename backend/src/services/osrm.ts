import { TtlCache } from "../lib/ttl-cache.ts";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface RouteLeg {
  distanceKm: number;
  durationMin: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  legs: RouteLeg[];
  geometry: { type: "LineString"; coordinates: [number, number][] };
  approximate: boolean;
}

export const TRAVEL_MODES = ["car", "bike", "foot"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

const EARTH_KM = 6371.0088;

export function haversineKm(a: LatLon, b: LatLon): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ramer–Douglas–Peucker on lon/lat pairs; tolerance in degrees (~0.0004 ≈ 40 m). */
export function simplify(points: [number, number][], tolerance = 0.0004): [number, number][] {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  const sq = tolerance * tolerance;
  while (stack.length) {
    const [start, end] = stack.pop()!;
    const [x1, y1] = points[start]!;
    const [x2, y2] = points[end]!;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = dx * dx + dy * dy;
    let maxDist = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const [px, py] = points[i]!;
      let t = len ? ((px - x1) * dx + (py - y1) * dy) / len : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = x1 + t * dx - px;
      const ey = y1 + t * dy - py;
      const dist = ex * ex + ey * ey;
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }
    if (index !== -1 && maxDist > sq) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Average speed (km/h) and detour factor used for the straight-line fallback. */
const FALLBACK: Record<TravelMode, { speed: number; detour: number }> = {
  car: { speed: 75, detour: 1.25 },
  bike: { speed: 16, detour: 1.2 },
  foot: { speed: 4.5, detour: 1.15 },
};

/** Straight-line estimate used when the routing engine is unreachable. */
export function approximateRoute(points: LatLon[], mode: TravelMode = "car"): RouteResult {
  const { speed, detour } = FALLBACK[mode];
  const legs = points.slice(1).map((p, i) => {
    const km = haversineKm(points[i]!, p) * detour;
    return { distanceKm: round1(km), durationMin: Math.round((km / speed) * 60) };
  });
  return {
    distanceKm: round1(legs.reduce((s, l) => s + l.distanceKm, 0)),
    durationMin: legs.reduce((s, l) => s + l.durationMin, 0),
    legs,
    geometry: { type: "LineString", coordinates: points.map((p) => [p.lon, p.lat]) },
    approximate: true,
  };
}

interface OsrmResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    legs: { distance: number; duration: number }[];
    geometry: { coordinates: [number, number][] };
  }[];
}

/**
 * OSRM client with one engine per travel mode. Defaults to the FOSSGIS servers behind
 * openstreetmap.org (routing.openstreetmap.de/routed-car|bike|foot); results are cached 24 h.
 */
export class RoutingService {
  readonly #baseUrls: Record<TravelMode, string>;
  readonly #userAgent: string;
  readonly #cache = new TtlCache<RouteResult>(800, 24 * 3600 * 1000);
  readonly #fetch: typeof fetch;

  constructor(baseUrls: Record<TravelMode, string>, userAgent: string, fetchImpl: typeof fetch = fetch) {
    this.#baseUrls = {
      car: baseUrls.car.replace(/\/$/, ""),
      bike: baseUrls.bike.replace(/\/$/, ""),
      foot: baseUrls.foot.replace(/\/$/, ""),
    };
    this.#userAgent = userAgent;
    this.#fetch = fetchImpl;
  }

  async route(points: LatLon[], mode: TravelMode = "car"): Promise<RouteResult> {
    const coords = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
    const key = `${mode}:${coords}`;
    const cached = this.#cache.get(key);
    if (cached) return cached;
    try {
      const url = `${this.#baseUrls[mode]}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
      const response = await this.#fetch(url, {
        headers: { "User-Agent": this.#userAgent },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
      const body = (await response.json()) as OsrmResponse;
      const best = body.routes?.[0];
      if (body.code !== "Ok" || !best) throw new Error(`OSRM ${body.code}`);
      const result: RouteResult = {
        distanceKm: round1(best.distance / 1000),
        durationMin: Math.round(best.duration / 60),
        legs: best.legs.map((l) => ({ distanceKm: round1(l.distance / 1000), durationMin: Math.round(l.duration / 60) })),
        geometry: { type: "LineString", coordinates: simplify(best.geometry.coordinates) },
        approximate: false,
      };
      this.#cache.set(key, result);
      return result;
    } catch {
      return approximateRoute(points, mode);
    }
  }
}
