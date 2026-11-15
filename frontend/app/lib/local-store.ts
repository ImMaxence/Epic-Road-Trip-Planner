import { useSyncExternalStore } from "react";
import type { Cover, TripPlan } from "./api";

/**
 * "Road book on this device": visitors keep their saved trips and favourites in localStorage.
 * Nothing leaves the browser; an export file moves them to another device.
 */
export interface LocalTrip {
  id: string;
  title: string;
  cover: Cover;
  plan: TripPlan;
  createdAt: string;
  updatedAt: string;
}

const TRIPS_KEY = "ert-local-trips";
const FAVORITES_KEY = "ert-local-favorites";
const EVENT = "ert-local-store";
export const LOCAL_ID = /^local-[a-z0-9]{8,32}$/;
const MAX_TRIPS = 50;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Returns false when storage is unavailable or full (private mode, quota). */
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

export const localStore = {
  trips(): LocalTrip[] {
    const list = read<LocalTrip[]>(TRIPS_KEY, []);
    return Array.isArray(list) ? list.filter((t) => t && LOCAL_ID.test(t.id) && t.plan?.from && t.plan?.to) : [];
  },
  trip(id: string): LocalTrip | undefined {
    return localStore.trips().find((t) => t.id === id);
  },
  saveTrip(input: { id?: string; title: string; cover: Cover; plan: TripPlan }): LocalTrip | null {
    const now = new Date().toISOString();
    const list = localStore.trips();
    const existing = input.id ? list.find((t) => t.id === input.id) : undefined;
    const trip: LocalTrip = existing
      ? { ...existing, title: input.title, cover: input.cover, plan: input.plan, updatedAt: now }
      : { id: `local-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`, title: input.title, cover: input.cover, plan: input.plan, createdAt: now, updatedAt: now };
    const next = [trip, ...list.filter((t) => t.id !== trip.id)].slice(0, MAX_TRIPS);
    return write(TRIPS_KEY, next) ? trip : null;
  },
  deleteTrip(id: string): void {
    write(TRIPS_KEY, localStore.trips().filter((t) => t.id !== id));
  },
  favorites(): number[] {
    const list = read<number[]>(FAVORITES_KEY, []);
    return Array.isArray(list) ? list.filter((n) => Number.isInteger(n) && n > 0) : [];
  },
  toggleFavorite(id: number, on: boolean): boolean {
    const set = new Set(localStore.favorites());
    if (on) set.add(id);
    else set.delete(id);
    return write(FAVORITES_KEY, [...set]);
  },
  clear(): void {
    try {
      localStorage.removeItem(TRIPS_KEY);
      localStorage.removeItem(FAVORITES_KEY);
      window.dispatchEvent(new Event(EVENT));
    } catch {
      /* storage unavailable */
    }
  },
  exportJson(): string {
    return JSON.stringify({ exportedAt: new Date().toISOString(), source: "tripplanner.mbonnici.fr (this device)", trips: localStore.trips(), favorites: localStore.favorites() }, null, 2);
  },
  /**
   * Merges a file produced by exportJson() (another browser, another device). Invalid entries are
   * skipped; for a trip present on both sides the most recently updated copy wins.
   * Returns null when the file is not an export, or when storage is full.
   */
  importJson(text: string): { trips: number; favorites: number } | null {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    if (!data || typeof data !== "object" || !Array.isArray((data as { trips?: unknown }).trips)) return null;
    const { trips = [], favorites = [] } = data as { trips?: unknown[]; favorites?: unknown[] };
    const place = (p: unknown) => {
      const v = p as Partial<TripPlan["from"]> | null;
      return Boolean(v && typeof v.code === "string" && /^[0-9][0-9AB][0-9]{3}$/.test(v.code) && typeof v.name === "string" && Number.isFinite(v.lat) && Number.isFinite(v.lon));
    };
    const valid = trips.filter((raw): raw is LocalTrip => {
      const t = raw as Partial<LocalTrip> | null;
      return Boolean(
        t && typeof t.id === "string" && LOCAL_ID.test(t.id) && typeof t.title === "string" && t.title.length <= 80 &&
          t.plan && place(t.plan.from) && place(t.plan.to) && Array.isArray(t.plan.via) && t.plan.via.every(place),
      );
    });
    const byId = new Map(localStore.trips().map((t) => [t.id, t]));
    for (const trip of valid) {
      const mine = byId.get(trip.id);
      if (!mine || String(trip.updatedAt) > String(mine.updatedAt)) byId.set(trip.id, { ...trip, plan: { ...trip.plan, pins: Array.isArray(trip.plan.pins) ? trip.plan.pins : [] } });
    }
    const merged = [...byId.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, MAX_TRIPS);
    const favs = [...new Set([...localStore.favorites(), ...favorites.filter((n): n is number => Number.isInteger(n) && (n as number) > 0)])];
    if (!write(TRIPS_KEY, merged) || !write(FAVORITES_KEY, favs)) return null;
    return { trips: valid.length, favorites: favorites.length };
  },
};

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback); // other tabs
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Snapshots must be referentially stable between changes: cache by raw string.
let tripsCache: { raw: string | null; value: LocalTrip[] } = { raw: "", value: [] };
let favCache: { raw: string | null; value: number[] } = { raw: "", value: [] };
const rawOf = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export function useLocalTrips(): LocalTrip[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = rawOf(TRIPS_KEY);
      if (raw !== tripsCache.raw) tripsCache = { raw, value: localStore.trips() };
      return tripsCache.value;
    },
    () => [],
  );
}

export function useLocalFavorites(): number[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = rawOf(FAVORITES_KEY);
      if (raw !== favCache.raw) favCache = { raw, value: localStore.favorites() };
      return favCache.value;
    },
    () => [],
  );
}

export function downloadText(filename: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
