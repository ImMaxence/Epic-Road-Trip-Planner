/**
 * Integration tests against a real MariaDB. Skipped unless TEST_DATABASE_HOST is set:
 *   docker run -d --name ert-test-db -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=roadtrip_test -p 3307:3306 mariadb:11.8
 *   TEST_DATABASE_HOST=127.0.0.1 TEST_DATABASE_PORT=3307 npm test
 */
import { pino } from "pino";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { loadConfig } from "../src/config.ts";
import { connect, runMigrations, type DbConnection } from "../src/db/client.ts";
import { createRepositories, type Repositories } from "../src/db/repositories.ts";
import { seedFeaturedTrips, TEAM_AUTHOR } from "../src/db/seed.ts";
import type { GeoClient } from "../src/services/geo-client.ts";
import type { GoogleIdentity, GoogleOAuth } from "../src/services/google.ts";
import type { RoutingService } from "../src/services/osrm.ts";

const host = process.env.TEST_DATABASE_HOST;
const suite = host ? describe : describe.skip;

const marseille = { code: "13055", name: "Marseille", lat: 43.2803, lon: 5.3806 };
const lyon = { code: "69123", name: "Lyon", lat: 45.758, lon: 4.835 };
const paris = { code: "75056", name: "Paris", lat: 48.8589, lon: 2.347 };
const plan = { version: 1, from: marseille, to: paris, via: [lyon], distanceKm: 775.4, startDate: "2026-07-01", endDate: "2026-07-05" };
const ORIGIN = "http://localhost:8765";

/** Fake Google: the authorization "code" selects the identity returned by the token exchange. */
const IDENTITIES: Record<string, GoogleIdentity> = {
  admin: { sub: "g-admin", email: "admin@example.org", emailVerified: true, name: "Admin" },
  second: { sub: "g-second", email: "second@team.example", emailVerified: true, name: "Second" },
  eve: { sub: "g-eve", email: "eve@example.org", emailVerified: true, name: "Eve" },
  unverified: { sub: "g-x", email: "admin@example.org", emailVerified: false },
};
const fakeGoogle: GoogleOAuth = {
  authUrl: ({ state, codeChallenge, redirectUri }) =>
    `https://accounts.google.test/o/oauth2/auth?state=${state}&code_challenge=${codeChallenge}&redirect_uri=${encodeURIComponent(redirectUri)}`,
  exchange: async ({ code, codeVerifier }) => (codeVerifier.length >= 43 ? (IDENTITIES[code] ?? null) : null),
};

suite("API (MariaDB)", () => {
  let conn: DbConnection;
  let repos: Repositories;
  let app: ReturnType<typeof createApp>;
  const logger = pino({ level: "silent" });
  const refreshCalls: { source: string; token?: string }[] = [];
  const source = (count: number) => ({ configured: true, ready: true, count, updatedAt: 1_794_000_000, job: null });
  const geo = {
    get: async () => ({ results: [] }),
    health: async () => ({ status: "ok", osm: source(412_000), datatourisme: { ...source(0), configured: false } }),
    refresh: async (src: string, token?: string) => {
      refreshCalls.push({ source: src, token });
      return { started: refreshCalls.length === 1, job: "running" };
    },
  } as unknown as GeoClient;
  const routing = { route: async () => ({ distanceKm: 1, durationMin: 1, legs: [], geometry: { type: "LineString", coordinates: [] }, approximate: false }) } as unknown as RoutingService;
  const makeApp = (admins: string) =>
    createApp({
      config: loadConfig({ JWT_SECRET: "t".repeat(48), PUBLIC_URL: ORIGIN, NODE_ENV: "test", ADMIN_EMAILS: admins, GEO_ADMIN_TOKEN: "geo-secret" }),
      logger,
      repos,
      geo,
      routing,
      google: fakeGoogle,
      checkDatabase: async () => true,
    });

  beforeAll(async () => {
    conn = connect({
      host: host!,
      port: Number(process.env.TEST_DATABASE_PORT ?? 3306),
      database: process.env.TEST_DATABASE_NAME ?? "roadtrip_test",
      user: process.env.TEST_DATABASE_USER ?? "root",
      password: process.env.TEST_DATABASE_PASSWORD ?? "root",
    });
    await conn.pool.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of ["favorites", "trips", "users", "__drizzle_migrations"]) await conn.pool.query(`DROP TABLE IF EXISTS \`${table}\``);
    await conn.pool.query("SET FOREIGN_KEY_CHECKS = 1");
    await runMigrations(conn.db);
    repos = createRepositories(conn.db);
    await seedFeaturedTrips(repos, logger);
    await seedFeaturedTrips(repos, logger); // idempotent
    app = makeApp("admin@example.org, @team.example");
  });

  afterAll(async () => {
    await conn?.pool.end();
  });

  async function googleLogin(code: string, next?: string, target = app) {
    const agent = request.agent(target);
    const start = await agent.get(`/api/auth/google/start?lang=fr${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    expect(start.status).toBe(303);
    const location = new URL(start.headers.location!);
    expect(location.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/api/auth/google/callback`);
    const callback = await agent.get(`/api/auth/google/callback?code=${code}&state=${location.searchParams.get("state")}`);
    return { agent, callback };
  }

  it("serves health, config and the OpenAPI document", async () => {
    expect((await request(app).get("/api/health")).body).toMatchObject({ status: "ok", database: true });
    expect((await request(app).get("/api/config")).body).toEqual({ version: "2.0.0", google: true, feedbackMailbox: null });
    expect((await request(app).get("/api/openapi.json")).body.openapi).toBe("3.1.0");
  });

  it("seeds featured trips exactly once", async () => {
    const res = await request(app).get("/api/trips?featured=true");
    expect(res.body.total).toBe(6);
    expect(res.body.items[0].author.name).toBe(TEAM_AUTHOR);
  });

  it("has no visitor accounts: sign-up, password and guest endpoints do not exist", async () => {
    for (const path of ["/api/auth/register", "/api/auth/login", "/api/auth/guest", "/api/auth/recover"]) {
      expect((await request(app).post(path).send({ email: "a@b.fr", password: "x" })).status, path).toBe(404);
    }
    expect((await request(app).get("/api/auth/me")).body.user).toBeNull();
    expect((await request(app).post("/api/trips").send({ title: "Anonyme", plan })).status).toBe(401);
  });

  it("filters the gallery by the ids a visitor keeps as favourites", async () => {
    const featured = (await request(app).get("/api/trips?featured=true")).body.items as { id: number }[];
    const ids = [featured[0]!.id, featured[2]!.id];
    const res = await request(app).get(`/api/trips?ids=${ids.join(",")},999999`);
    expect(res.body.items.map((t: { id: number }) => t.id).sort()).toEqual([...ids].sort());
    expect((await request(app).get("/api/trips?ids=1;DROP")).status).toBe(400);
  });

  it("signs administrators in with Google only when their address is listed", async () => {
    const eve = await googleLogin("eve");
    expect(eve.callback.headers.location).toBe("/fr/connexion?error=not_admin");
    expect(await repos.users.byEmail("eve@example.org")).toBeUndefined(); // nothing stored about refused people
    expect((await googleLogin("unverified")).callback.headers.location).toBe("/fr/connexion?error=google_failed");

    const { agent, callback } = await googleLogin("admin");
    expect(callback.headers.location).toBe("/fr/admin");
    expect((await agent.get("/api/auth/me")).body.user).toMatchObject({ email: "admin@example.org", isAdmin: true });
    // Whole domains can be listed too, and `next` is honoured when same-site.
    const second = await googleLogin("second", "/en/plan?from=13055");
    expect(second.callback.headers.location).toBe("/en/plan?from=13055");

    // Removing the address from ADMIN_EMAILS revokes the session at once.
    const session = ([] as string[]).concat(callback.headers["set-cookie"] ?? []).find((c) => c.startsWith("ert_session="))!.split(";")[0]!;
    expect((await request(makeApp("")).get("/api/admin/stats").set("Cookie", session)).status).toBe(401);
    expect((await request(makeApp("")).get("/api/auth/me").set("Cookie", session)).body.user).toBeNull();
    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/me")).body.user).toBeNull();
  });

  it("rejects forged OAuth callbacks and open redirects", async () => {
    const agent = request.agent(app);
    const start = await agent.get("/api/auth/google/start?lang=en&next=https://evil.example");
    const state = new URL(start.headers.location!).searchParams.get("state");
    expect((await agent.get("/api/auth/google/callback?code=admin&state=wrong")).headers.location).toBe("/en/login?error=state_mismatch");
    expect((await agent.get(`/api/auth/google/callback?code=admin&state=${state}`)).headers.location).toBe("/fr/connexion?error=session_expired");
    const { callback } = await googleLogin("admin", "//evil.example");
    expect(callback.headers.location).toBe("/fr/admin");
  });

  it("lets administrators publish, curate and delete trips", async () => {
    const { agent: admin } = await googleLogin("admin");
    const { agent: other } = await googleLogin("second");
    const id = (await admin.post("/api/trips").send({ title: "Vers Paris", cover: "city", isPublic: false, plan })).body.trip.id;
    expect((await request(app).get(`/api/trips/${id}`)).status).toBe(404); // private
    expect((await other.put(`/api/trips/${id}`).send({ title: "Hijack", plan })).status).toBe(403);
    expect((await admin.put(`/api/trips/${id}`).send({ title: "Vers Paris", cover: "beach", isPublic: true, plan })).body.trip.isPublic).toBe(true);
    expect((await request(app).get("/api/trips?author=Admin")).body.items).toMatchObject([{ id, title: "Vers Paris" }]);
    expect((await admin.get("/api/me/trips")).body.items).toHaveLength(1);

    const stats = (await admin.get("/api/admin/stats")).body;
    expect(stats).toMatchObject({ featuredTrips: 6 });
    expect(stats.publishedTrips).toBe(7);
    // Curation applies to every trip, including the team's.
    const featured = (await request(app).get("/api/trips?featured=true")).body.items[0];
    expect((await other.patch(`/api/admin/trips/${featured.id}`).send({ isPublic: false })).status).toBe(204);
    expect((await request(app).get(`/api/trips/${featured.id}`)).status).toBe(404);
    expect((await other.patch(`/api/admin/trips/${featured.id}`).send({ isPublic: true })).status).toBe(204);
    expect((await other.delete(`/api/admin/trips/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/admin/trips`)).status).toBe(401);
    expect((await admin.patch("/api/me").send({ username: "Maxence", locale: "en" })).body.user).toMatchObject({ username: "Maxence", locale: "en" });
  });

  it("lets administrators check and refresh the map data", async () => {
    expect((await request(app).get("/api/admin/data")).status).toBe(401);
    expect((await request(app).post("/api/admin/data/osm/refresh")).status).toBe(401);
    const { agent } = await googleLogin("admin");
    expect((await agent.get("/api/admin/data")).body).toMatchObject({ osm: { ready: true, count: 412_000 }, datatourisme: { configured: false } });
    expect((await agent.post("/api/admin/data/osm/refresh")).body).toEqual({ started: true, job: "running" });
    expect((await agent.post("/api/admin/data/osm/refresh")).body.started).toBe(false); // already running
    expect((await agent.post("/api/admin/data/nope/refresh")).status).toBe(400);
    expect(refreshCalls).toEqual([{ source: "osm", token: "geo-secret" }, { source: "osm", token: "geo-secret" }]);
  });

  it("blocks cross-origin writes and forged tokens", async () => {
    const { agent } = await googleLogin("admin");
    expect((await agent.post("/api/trips").set("Origin", "https://evil.example").send({ title: "x", plan })).status).toBe(403);
    expect((await request(app).post("/api/trips").set("Cookie", "ert_session=gg").send({ title: "x", plan })).status).toBe(401);
  });

  it("returns JSON 404s for unknown API routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found" });
  });
});
