import { Router } from "express";
import { z } from "zod";
import type { Repositories } from "../db/repositories.ts";
import { conflict, forbidden, notFound } from "../lib/http-error.ts";
import { tripInputSchema } from "../lib/trip-schema.ts";
import { parse, requireAdmin } from "../middleware.ts";

const listSchema = z.object({
  sort: z.enum(["recent", "oldest"]).default("recent"),
  from: z.string().trim().max(120).optional(),
  author: z.string().trim().max(40).optional(),
  featured: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  // Favourites live on the visitor's device: the gallery can be filtered by those ids.
  ids: z
    .string()
    .regex(/^\d{1,9}(,\d{1,9}){0,47}$/)
    .transform((v) => [...new Set(v.split(",").map(Number))])
    .optional(),
  limit: z.coerce.number().int().min(1).max(48).default(24),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

const idSchema = z.coerce.number().int().positive();

/** Storage quota per administrator account. */
export const TRIP_LIMIT = 500;

/**
 * The public gallery is read by everyone; trips are written by administrators only
 * (visitors save theirs on their device and share them by link).
 */
export function tripsRouter(repos: Repositories): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const q = parse(listSchema, req.query);
    const result = await repos.trips.list(
      { sort: q.sort, from: q.from || undefined, author: q.author || undefined, featured: q.featured, ids: q.ids, limit: q.limit, offset: q.offset },
      req.user?.id,
    );
    res.json({ ...result, limit: q.limit, offset: q.offset });
  });

  router.get("/:id", async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const trip = await repos.trips.detail(id, req.user?.id);
    // Private trips are invisible (404, not 403) to anyone but their owner.
    if (!trip || (!trip.isPublic && !trip.isOwner)) throw notFound();
    res.json({ trip });
  });

  router.post("/", requireAdmin, async (req, res) => {
    const input = parse(tripInputSchema, req.body);
    if ((await repos.trips.countByOwner(req.user!.id)) >= TRIP_LIMIT) throw conflict("trip_limit_reached");
    const id = await repos.trips.create(req.user!.id, input);
    res.status(201).json({ trip: await repos.trips.detail(id, req.user!.id) });
  });

  router.put("/:id", requireAdmin, async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const existing = await repos.trips.raw(id);
    if (!existing) throw notFound();
    if (existing.userId !== req.user!.id) throw forbidden();
    await repos.trips.update(id, parse(tripInputSchema, req.body));
    res.json({ trip: await repos.trips.detail(id, req.user!.id) });
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const existing = await repos.trips.raw(id);
    if (!existing) throw notFound();
    if (existing.userId !== req.user!.id) throw forbidden();
    await repos.trips.delete(id);
    res.status(204).end();
  });

  return router;
}
