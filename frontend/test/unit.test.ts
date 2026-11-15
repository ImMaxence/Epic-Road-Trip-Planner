import { describe, expect, it } from "vitest";
import { en } from "../app/i18n/en";
import { fr } from "../app/i18n/fr";
import { langFromPath, ROUTE_KEYS, ROUTES, routeKeyFromPath } from "../app/i18n/paths";
import { daysBetween, formatDuration, formatKm, safeHttpUrl } from "../app/lib/format";
import { decodePins, encodePins, readParams, writeParams } from "../app/lib/planner-state";

function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

describe("i18n", () => {
  it("French and English dictionaries have the same keys", () => {
    expect(keysOf(en).sort()).toEqual(keysOf(fr).sort());
  });

  it("every route has distinct, prefixed slugs in both languages", () => {
    const all = ROUTE_KEYS.flatMap((k) => [ROUTES[k].fr, ROUTES[k].en]);
    expect(new Set(all).size).toBe(all.length);
    for (const k of ROUTE_KEYS) {
      expect(ROUTES[k].fr.startsWith("/fr")).toBe(true);
      expect(ROUTES[k].en.startsWith("/en")).toBe(true);
      expect(routeKeyFromPath(ROUTES[k].en)).toBe(k);
      expect(routeKeyFromPath(`${ROUTES[k].fr}/`)).toBe(k);
    }
  });

  it("detects the language from the path", () => {
    expect(langFromPath("/en/plan")).toBe("en");
    expect(langFromPath("/en")).toBe("en");
    expect(langFromPath("/english")).toBe("fr");
    expect(langFromPath("/fr/voyages")).toBe("fr");
  });
});

describe("planner URL state", () => {
  it("round-trips through the query string", () => {
    const params = readParams(new URLSearchParams("from=13055&to=06088&via=13001.83119&start=2026-07-10&end=2026-07-17&style=night&color=blue&r=10&mode=bike&trip=4"));
    expect(params).toEqual({ from: "13055", to: "06088", via: ["13001", "83119"], start: "2026-07-10", end: "2026-07-17", style: "night", color: "blue", radius: 10, mode: "bike", trip: 4 });
    expect(readParams(new URLSearchParams(writeParams(params).slice(1)))).toEqual(params);
  });

  it("drops invalid values and omits defaults", () => {
    const params = readParams(new URLSearchParams("from=<script>&to=2A004&via=1.75056&style=neon&color=pink&r=7&start=tomorrow"));
    expect(params).toMatchObject({ from: undefined, to: "2A004", via: ["75056"], style: "atlas", color: "red", radius: 5, mode: "car", start: undefined });
    expect(writeParams({ from: "13055", to: "75056", style: "atlas", color: "red", radius: 5, mode: "car", via: [] })).toBe("?from=13055&to=75056");
  });
});

describe("share links carry pinned places", () => {
  const pins = [
    { id: "osm:node/1", stop: 0, name: "Chez Fonfon — bouillabaisse", category: "eat" as const, kind: "restaurant", lat: 43.28512, lon: 5.35021 },
    { id: "osm:way/2", stop: 2, name: "Château d'If", category: "enjoy" as const, kind: null, lat: 43.27986, lon: 5.32527 },
  ];
  it("round-trips through a URL-safe parameter", () => {
    const encoded = encodePins(pins);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePins(encoded)).toEqual(pins);
    expect(new URLSearchParams(`p=${encoded}`).get("p")).toBe(encoded);
  });
  it("drops anything malformed instead of trusting it", () => {
    expect(decodePins("not-base64!!")).toBeNull();
    expect(decodePins(null)).toBeNull();
    const evil = btoa(JSON.stringify([[0, 99, 1, 1, "x", "", "a"], [1, 0, "NaN", 1, "y", "", "b"], [2, 0, 1, 1, "", "", "c"], [3, 1, 4300000, 530000, "ok", "", "d"]]));
    expect(decodePins(evil)).toEqual([{ id: "d", stop: 3, category: "drink", name: "ok", kind: null, lat: 43, lon: 5.3 }]);
  });
});

describe("formatting", () => {
  it("formats distances and durations per language", () => {
    expect(formatKm(1234, "fr").replace(/\s/g, " ")).toBe("1 234 km"); // fr-FR groups with a narrow no-break space
    expect(formatKm(1234, "en")).toBe("1,234 km");
    expect(formatDuration(251, "fr")).toBe("4 h 11");
    expect(formatDuration(70, "en")).toBe("1h 10m");
    expect(formatDuration(45, "fr")).toBe("45 min");
    expect(daysBetween("2026-07-10", "2026-07-17")).toBe(8);
  });

  it("only keeps http(s) links", () => {
    expect(safeHttpUrl("https://example.org")).toBe("https://example.org/");
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
  });
});
