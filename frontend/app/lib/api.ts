/** Typed client for the same-origin REST API (/api, proxied by nginx or Vite). */

export interface Place {
  code: string;
  name: string;
  postcode?: string;
  departmentCode?: string;
  department?: string;
  lat: number;
  lon: number;
  population?: number;
  label?: string;
}

export type Category = "eat" | "drink" | "sleep" | "enjoy" | "travel" | "events";
export const CATEGORIES: Category[] = ["eat", "drink", "sleep", "enjoy", "travel", "events"];

export interface Poi {
  id: string;
  category: Category;
  kind: string | null;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  source: "osm" | "datatourisme";
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  cuisine?: string;
  stars?: string;
  wheelchair?: "yes" | "limited" | "no";
  description?: string;
  image?: string;
  price?: string;
  dateStart?: string | null;
  dateEnd?: string | null;
}

export interface PoiResponse {
  radiusKm: number;
  categories: Record<Category, Poi[]>;
  sources: {
    osm: { status: "ok" | "stale" | "unavailable"; via: "extract" | "overpass" | null; building?: boolean; updatedAt?: number | null };
    datatourisme: { status: "ok" | "pending" | "disabled"; updatedAt?: number | null };
  };
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  legs: { distanceKm: number; durationMin: number }[];
  geometry: { type: "LineString"; coordinates: [number, number][] };
  approximate: boolean;
}

export type MapStyle = "atlas" | "day" | "night";
export type TravelMode = "car" | "bike" | "foot";
export type RouteColor = "red" | "green" | "blue" | "yellow" | "brown" | "ink";
export type Cover = "city" | "campfire" | "forest" | "mountain" | "beach";

export interface Pin {
  id: string;
  stop: number;
  name: string;
  category: Category;
  kind?: string | null;
  lat: number;
  lon: number;
}

export interface TripPlan {
  version: 1;
  from: Place;
  to: Place;
  via: Place[];
  startDate?: string | null;
  endDate?: string | null;
  travelMode?: TravelMode;
  mapStyle: MapStyle;
  routeColor: RouteColor;
  radiusKm: number;
  pins: Pin[];
  distanceKm?: number | null;
  durationMin?: number | null;
  titles?: { fr?: string; en?: string };
  summary?: { fr?: string; en?: string };
}

export interface TripSummary {
  id: number;
  title: string;
  titles?: { fr?: string; en?: string };
  summary?: { fr?: string; en?: string };
  cover: Cover;
  isPublic: boolean;
  featured: boolean;
  author: { id: number | null; name: string };
  from: { code: string; name: string };
  to: { code: string; name: string };
  via: string[];
  stopCount: number;
  distanceKm: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  isOwner: boolean;
}

export interface TripDetail extends TripSummary {
  plan: TripPlan;
}

/** Signed-in administrator (Google). Visitors have no account. */
export interface User {
  id: number;
  email: string;
  username: string;
  locale: "fr" | "en";
  isAdmin: true;
  createdAt: string;
}

export interface PublicConfig {
  version: string;
  google: boolean;
}

export interface DataSource {
  configured: boolean;
  ready: boolean;
  count: number;
  /** Unix seconds of the last successful build. */
  updatedAt: number | null;
  /** "running", "done", "failed: …" or null. */
  job: string | null;
}

export interface AdminStats {
  trips: number;
  publishedTrips: number;
  featuredTrips: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: { path: string; message: string }[];

  constructor(status: number, code: string, issues: { path: string; message: string }[] = []) {
    super(code);
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

async function request<T>(method: string, url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "network");
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error ?? "generic", data.issues);
  return data as T;
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  return search.toString();
};

export const api = {
  config: () => request<PublicConfig>("GET", "/api/config"),
  me: () => request<{ user: User | null }>("GET", "/api/auth/me"),
  /** Full-page navigation: the server redirects to Google (administrators only), then back to `next`. */
  googleStartUrl: (lang: string, next?: string | null) => `/api/auth/google/start?${qs({ lang, next })}`,
  logout: () => request<void>("POST", "/api/auth/logout"),

  updateProfile: (input: { username?: string; locale?: string }) => request<{ user: User }>("PATCH", "/api/me", input),
  myTrips: () => request<{ items: TripSummary[] }>("GET", "/api/me/trips"),

  trips: (params: { sort?: string; from?: string; author?: string; featured?: boolean; ids?: number[]; limit?: number; offset?: number }) =>
    request<{ items: TripSummary[]; total: number }>("GET", `/api/trips?${qs({ ...params, ids: params.ids?.join(",") })}`),
  trip: (id: number) => request<{ trip: TripDetail }>("GET", `/api/trips/${id}`),
  createTrip: (input: { title: string; cover: Cover; isPublic: boolean; plan: TripPlan }) => request<{ trip: TripDetail }>("POST", "/api/trips", input),
  updateTrip: (id: number, input: { title: string; cover: Cover; isPublic: boolean; plan: TripPlan }) =>
    request<{ trip: TripDetail }>("PUT", `/api/trips/${id}`, input),
  deleteTrip: (id: number) => request<void>("DELETE", `/api/trips/${id}`),

  searchPlaces: (q: string, signal?: AbortSignal) => request<{ results: Place[] }>("GET", `/api/places/search?${qs({ q, limit: 8 })}`, undefined, signal),
  places: (codes: string[]) => request<{ results: Place[] }>("GET", `/api/places?${qs({ codes: codes.join(",") })}`),
  pois: (params: { lat: number; lon: number; radius: number; from?: string | null; to?: string | null; lang: string }, signal?: AbortSignal) =>
    request<PoiResponse>("GET", `/api/pois?${qs({ ...params, lat: params.lat.toFixed(4), lon: params.lon.toFixed(4) })}`, undefined, signal),
  route: (points: { lat: number; lon: number }[], mode: TravelMode, signal?: AbortSignal) =>
    request<RouteResult>("GET", `/api/route?points=${points.map((p) => `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`).join(";")}&mode=${mode}`, undefined, signal),

  admin: {
    stats: () => request<AdminStats>("GET", "/api/admin/stats"),
    data: () => request<{ osm: DataSource; datatourisme: DataSource }>("GET", "/api/admin/data"),
    refreshData: (source: "osm" | "datatourisme") => request<{ started: boolean; job: string | null }>("POST", `/api/admin/data/${source}/refresh`),
    trips: (params: { q?: string; limit?: number; offset?: number }) => request<{ items: TripSummary[]; total: number }>("GET", `/api/admin/trips?${qs(params)}`),
    setTripPublic: (id: number, isPublic: boolean) => request<void>("PATCH", `/api/admin/trips/${id}`, { isPublic }),
    deleteTrip: (id: number) => request<void>("DELETE", `/api/admin/trips/${id}`),
  },
};

