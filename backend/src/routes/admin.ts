import { Router } from "express";
import { z } from "zod";
import type { Repositories } from "../db/repositories.ts";
import type { GeoClient } from "../services/geo-client.ts";
import { notFound } from "../lib/http-error.ts";
import { parse, requireAdmin } from "../middleware.ts";

const listSchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(48).default(25),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});
const idSchema = z.coerce.number().int().positive();

interface SourceStatus {
  configured: boolean;
  ready: boolean;
  count: number;
  updatedAt: number | null;
  job: string | null;
}

/** Gallery curation (publish, unpublish, delete any trip) and map data refresh. Every action is logged. */
export function adminRouter(repos: Repositories, geo: GeoClient, geoToken?: string): Router {
  const router = Router();
  router.use(requireAdmin);

  router.get("/stats", async (_req, res) => {
    const trips = await repos.trips.counts();
    res.json({ trips: trips.total, publishedTrips: trips.published, featuredTrips: trips.featured });
  });

  // Map data: freshness of each source, and a manual rebuild (the current index keeps serving meanwhile).
  router.get("/data", async (_req, res) => {
    const health = (await geo.health()) as { osm: SourceStatus; datatourisme: SourceStatus };
    res.json({ osm: health.osm, datatourisme: health.datatourisme });
  });

  router.post("/data/:source/refresh", async (req, res) => {
    const source = parse(z.enum(["osm", "datatourisme"]), req.params.source);
    const result = await geo.refresh(source, geoToken);
    req.log?.info({ admin: req.user!.id, source, started: result.started }, "admin requested a data refresh");
    res.status(202).json(result);
  });

  router.get("/trips", async (req, res) => {
    const q = parse(listSchema, req.query);
    res.json(await repos.trips.list({ sort: "recent", author: q.q, limit: q.limit, offset: q.offset }, req.user!.id));
  });

  router.patch("/trips/:id", async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const { isPublic } = parse(z.object({ isPublic: z.boolean() }), req.body);
    if (!(await repos.trips.raw(id))) throw notFound();
    await repos.trips.setPublic(id, isPublic);
    req.log?.info({ admin: req.user!.id, trip: id, isPublic }, "admin changed trip visibility");
    res.status(204).end();
  });

  router.delete("/trips/:id", async (req, res) => {
    const id = parse(idSchema, req.params.id);
    if (!(await repos.trips.raw(id))) throw notFound();
    await repos.trips.delete(id);
    req.log?.info({ admin: req.user!.id, trip: id }, "admin deleted a trip");
    res.status(204).end();
  });

  return router;
}
