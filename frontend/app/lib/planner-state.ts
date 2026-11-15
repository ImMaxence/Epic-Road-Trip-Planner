import { CATEGORIES, type MapStyle, type Pin, type Place, type RouteColor, type TravelMode, type TripPlan } from "./api";

export const TRAVEL_MODES: TravelMode[] = ["car", "bike", "foot"];

/**
 * The planner's shareable state lives in the URL:
 *   ?from=13055&to=75056&via=69123.21231&start=2026-07-01&end=2026-07-10&style=atlas&color=red&r=5&trip=12
 * Communes are referenced by their official INSEE code, resolved through /api/places.
 */
export interface PlannerParams {
  from?: string;
  to?: string;
  via: string[];
  start?: string;
  end?: string;
  style: MapStyle;
  color: RouteColor;
  radius: number;
  mode: TravelMode;
  trip?: number;
  /** Trip saved on this device (localStorage), see lib/local-store.ts */
  local?: string;
}

const STYLES: MapStyle[] = ["atlas", "day", "night"];
const COLORS: RouteColor[] = ["red", "green", "blue", "yellow", "brown", "ink"];
export const RADII = [2, 5, 10, 20] as const;
const CODE = /^[0-9][0-9AB][0-9]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function readParams(search: URLSearchParams): PlannerParams {
  const code = (v: string | null) => (v && CODE.test(v) ? v : undefined);
  const date = (v: string | null) => (v && DATE.test(v) ? v : undefined);
  const radius = Number(search.get("r"));
  const trip = Number(search.get("trip"));
  const local = search.get("local");
  return {
    from: code(search.get("from")),
    to: code(search.get("to")),
    via: (search.get("via") ?? "").split(".").filter((c) => CODE.test(c)).slice(0, 12),
    start: date(search.get("start")),
    end: date(search.get("end")),
    style: STYLES.includes(search.get("style") as MapStyle) ? (search.get("style") as MapStyle) : "atlas",
    color: COLORS.includes(search.get("color") as RouteColor) ? (search.get("color") as RouteColor) : "red",
    radius: (RADII as readonly number[]).includes(radius) ? radius : 5,
    mode: TRAVEL_MODES.includes(search.get("mode") as TravelMode) ? (search.get("mode") as TravelMode) : "car",
    trip: Number.isInteger(trip) && trip > 0 ? trip : undefined,
    local: local && /^local-[a-z0-9]{8,32}$/.test(local) ? local : undefined,
  };
}

export function writeParams(p: Partial<PlannerParams>): string {
  const search = new URLSearchParams();
  if (p.from) search.set("from", p.from);
  if (p.to) search.set("to", p.to);
  if (p.via?.length) search.set("via", p.via.join("."));
  if (p.start) search.set("start", p.start);
  if (p.end) search.set("end", p.end);
  if (p.style && p.style !== "atlas") search.set("style", p.style);
  if (p.color && p.color !== "red") search.set("color", p.color);
  if (p.radius && p.radius !== 5) search.set("r", String(p.radius));
  if (p.mode && p.mode !== "car") search.set("mode", p.mode);
  if (p.trip) search.set("trip", String(p.trip));
  if (p.local) search.set("local", p.local);
  const s = search.toString();
  return s ? `?${s}` : "";
}

export function paramsFromPlan(plan: TripPlan, tripId?: number): PlannerParams {
  return {
    from: plan.from.code,
    to: plan.to.code,
    via: plan.via.map((v) => v.code),
    start: plan.startDate ?? undefined,
    end: plan.endDate ?? undefined,
    style: plan.mapStyle,
    color: plan.routeColor,
    radius: (RADII as readonly number[]).includes(plan.radiusKm) ? plan.radiusKm : 5,
    mode: plan.travelMode ?? "car",
    trip: tripId,
  };
}

/** Ordered stops: start, vias, finish. */
export function stopsOf(from?: Place, via: (Place | undefined)[] = [], to?: Place): (Place | undefined)[] {
  return [from, ...via, to];
}

export const ROUTE_COLOR_HEX: Record<RouteColor, string> = {
  red: "#c8331f",
  green: "#0b6b47",
  blue: "#1f4fa8",
  yellow: "#e0a800",
  brown: "#7a4a2a",
  ink: "#1d2433",
};

const MAX_SHARED_PINS = 40;
const toBase64Url = (text: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromBase64Url = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

/**
 * Pinned places travel in share links as `?p=`: a compact base64url JSON list of
 * [stop, category index, lat×1e5, lon×1e5, name, kind, id]. Nothing is stored on the server.
 */
export function encodePins(pins: Pin[]): string {
  const rows = pins
    .slice(0, MAX_SHARED_PINS)
    .map((p) => [p.stop, CATEGORIES.indexOf(p.category), Math.round(p.lat * 1e5), Math.round(p.lon * 1e5), p.name.slice(0, 80), p.kind ?? "", p.id.slice(0, 64)]);
  return toBase64Url(JSON.stringify(rows));
}

/** Reads `?p=` defensively: anything malformed is dropped, never trusted. */
export function decodePins(value: string | null): Pin[] | null {
  if (!value || value.length > 8000) return null;
  try {
    const rows: unknown = JSON.parse(fromBase64Url(value));
    if (!Array.isArray(rows)) return null;
    return rows.slice(0, MAX_SHARED_PINS).flatMap((row): Pin[] => {
      if (!Array.isArray(row) || row.length < 7) return [];
      const [stop, cat, lat, lon, name, kind, id] = row as unknown[];
      const category = CATEGORIES[Number(cat)];
      const ok =
        Number.isInteger(stop) && (stop as number) >= 0 && (stop as number) <= 13 && category &&
        Number.isFinite(lat) && Math.abs(lat as number) <= 9e6 && Number.isFinite(lon) && Math.abs(lon as number) <= 18e6 &&
        typeof name === "string" && name.trim() !== "" && typeof id === "string" && id !== "";
      if (!ok) return [];
      return [{ id: id.slice(0, 64), stop: stop as number, category, name: name.slice(0, 80), kind: typeof kind === "string" && kind ? kind.slice(0, 40) : null, lat: (lat as number) / 1e5, lon: (lon as number) / 1e5 }];
    });
  } catch {
    return null;
  }
}
