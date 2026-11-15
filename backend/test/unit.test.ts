import { describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config.ts";
import { isAllowedEmail, parseAllowlist } from "../src/lib/allowlist.ts";
import { safeNext } from "../src/routes/auth.ts";
import { SessionSigner } from "../src/lib/session.ts";
import { tripInputSchema } from "../src/lib/trip-schema.ts";
import { TtlCache } from "../src/lib/ttl-cache.ts";
import { approximateRoute, haversineKm, RoutingService, simplify } from "../src/services/osrm.ts";

const marseille = { code: "13055", name: "Marseille", lat: 43.2803, lon: 5.3806 };
const paris = { code: "75056", name: "Paris", lat: 48.8589, lon: 2.347 };

describe("admin allow-list", () => {
  const list = parseAllowlist("Alice@Gmail.com, @mbonnici.fr ; not-an-email  bob@example.org");
  it("parses e-mails and domains, ignoring junk", () => {
    expect(list).toEqual(["alice@gmail.com", "@mbonnici.fr", "bob@example.org"]);
  });
  it("matches exact addresses and whole domains only", () => {
    expect(isAllowedEmail("ALICE@gmail.com", list)).toBe(true);
    expect(isAllowedEmail("maxence@mbonnici.fr", list)).toBe(true);
    expect(isAllowedEmail("eve@evil-mbonnici.fr", list)).toBe(false);
    expect(isAllowedEmail("alice@gmail.com.evil.org", list)).toBe(false);
    expect(isAllowedEmail("carol@gmail.com", list)).toBe(false);
  });
  it("denies everyone when the list is empty", () => {
    expect(isAllowedEmail("alice@gmail.com", [])).toBe(false);
  });
});

describe("post-login redirect", () => {
  it("only accepts same-site localised paths", () => {
    expect(safeNext("/fr/planifier?from=13055")).toBe("/fr/planifier?from=13055");
    expect(safeNext("/en")).toBe("/en");
    expect(safeNext("//evil.example")).toBeNull();
    expect(safeNext("https://evil.example")).toBeNull();
    expect(safeNext("/fr\\..\\evil")).toBeNull();
    expect(safeNext("/api/me")).toBeNull();
  });
});

describe("session tokens", () => {
  const signer = new SessionSigner("x".repeat(40));
  it("round-trips claims", async () => {
    const token = await signer.sign({ userId: 7, version: 2 });
    expect(await signer.verify(token)).toEqual({ userId: 7, version: 2 });
  });
  it("rejects tampered or foreign tokens", async () => {
    const token = await signer.sign({ userId: 7, version: 2 });
    expect(await signer.verify(token.slice(0, -2) + "xx")).toBeNull();
    expect(await new SessionSigner("y".repeat(40)).verify(token)).toBeNull();
    expect(await signer.verify("gg")).toBeNull();
  });
});

describe("config", () => {
  it("refuses short JWT secrets and derives the public origin", () => {
    expect(() => loadConfig({ JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
    const config = loadConfig({ JWT_SECRET: "z".repeat(32), PUBLIC_URL: "https://tripplanner.mbonnici.fr/", GOOGLE_CLIENT_ID: "id", ADMIN_EMAILS: "a@b.fr" });
    expect(config.publicOrigin).toBe("https://tripplanner.mbonnici.fr");
    expect(config.secureCookies).toBe(true);
    expect(config.googleEnabled).toBe(false); // the client secret is required too
    expect(config.adminEmails).toEqual(["a@b.fr"]);
  });
});

describe("trip schema", () => {
  const base = { title: "Sud", plan: { version: 1, from: marseille, to: paris } };
  it("applies defaults", () => {
    const parsed = tripInputSchema.parse(base);
    expect(parsed.plan.via).toEqual([]);
    expect(parsed.plan.routeColor).toBe("red");
    expect(parsed.isPublic).toBe(false);
  });
  it("rejects inverted dates, bad codes and oversized plans", () => {
    expect(() => tripInputSchema.parse({ ...base, plan: { ...base.plan, startDate: "2026-08-10", endDate: "2026-08-01" } })).toThrow();
    expect(() => tripInputSchema.parse({ ...base, plan: { ...base.plan, from: { ...marseille, code: "ABCDE" } } })).toThrow();
    expect(() => tripInputSchema.parse({ ...base, plan: { ...base.plan, via: Array(13).fill(marseille) } })).toThrow();
  });
  it("accepts Corsican INSEE codes", () => {
    expect(tripInputSchema.parse({ ...base, plan: { ...base.plan, to: { ...paris, code: "2A004" } } }).plan.to.code).toBe("2A004");
  });
});

describe("routing", () => {
  it("haversine is about 660 km between Marseille and Paris", () => {
    expect(haversineKm(marseille, paris)).toBeGreaterThan(650);
    expect(haversineKm(marseille, paris)).toBeLessThan(670);
  });

  it("simplify keeps endpoints and drops collinear points", () => {
    const line: [number, number][] = [[0, 0], [1, 0.00001], [2, 0], [3, 1]];
    const out = simplify(line, 0.001);
    expect(out[0]).toEqual([0, 0]);
    expect(out.at(-1)).toEqual([3, 1]);
    expect(out).not.toContainEqual([1, 0.00001]);
  });

  const engines = { car: "https://osrm.test/car/", bike: "https://osrm.test/bike", foot: "https://osrm.test/foot" };

  it("falls back to an approximate route when OSRM fails, with a speed per travel mode", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("down"));
    const service = new RoutingService(engines, "test", failing as unknown as typeof fetch);
    const result = await service.route([marseille, paris]);
    expect(result.approximate).toBe(true);
    expect(result.legs).toHaveLength(1);
    expect(result).toEqual(approximateRoute([marseille, paris]));
    const bike = await service.route([marseille, paris], "bike");
    const foot = await service.route([marseille, paris], "foot");
    expect(bike.durationMin).toBeGreaterThan(result.durationMin * 3);
    expect(foot.durationMin).toBeGreaterThan(bike.durationMin * 3);
  });

  it("calls the engine of the requested mode and caches each mode separately", async () => {
    const body = {
      code: "Ok",
      routes: [{ distance: 774_000, duration: 25_200, legs: [{ distance: 774_000, duration: 25_200 }], geometry: { coordinates: [[5.38, 43.28], [2.347, 48.85]] } }],
    };
    const ok = vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), { status: 200 }));
    const service = new RoutingService(engines, "test", ok as unknown as typeof fetch);
    const first = await service.route([marseille, paris]);
    await service.route([marseille, paris]);
    await service.route([marseille, paris], "bike");
    expect(first).toMatchObject({ distanceKm: 774, durationMin: 420, approximate: false });
    expect(ok).toHaveBeenCalledTimes(2);
    expect(String(ok.mock.calls[0]![0])).toContain("https://osrm.test/car/route/v1/driving/5.38060,43.28030;2.34700,48.85890");
    expect(String(ok.mock.calls[1]![0])).toContain("https://osrm.test/bike/route/v1/driving/");
  });
});

describe("ttl cache", () => {
  it("evicts the least recently used entry", () => {
    const cache = new TtlCache<number>(2, 1000);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.size).toBe(2);
  });
});
