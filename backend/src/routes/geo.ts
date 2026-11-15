import { Router } from "express";
import { z } from "zod";
import { badRequest } from "../lib/http-error.ts";
import { parse } from "../middleware.ts";
import type { GeoClient } from "../services/geo-client.ts";
import { TRAVEL_MODES, type RoutingService } from "../services/osrm.ts";

const searchSchema = z.object({ q: z.string().trim().min(1).max(80), limit: z.coerce.number().int().min(1).max(20).default(8) });
const codesSchema = z.object({ codes: z.string().regex(/^([0-9][0-9AB][0-9]{3})(,[0-9][0-9AB][0-9]{3}){0,29}$/) });
const poiSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(30).default(5),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  lang: z.enum(["fr", "en"]).default("fr"),
});
const routeSchema = z.object({ points: z.string().max(600), mode: z.enum(TRAVEL_MODES).default("car") });

function parsePoints(raw: string) {
  const points = raw.split(";").map((pair) => {
    const [lat, lon] = pair.split(",").map(Number);
    if (lat === undefined || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw badRequest("invalid_points");
    }
    return { lat, lon };
  });
  if (points.length < 2 || points.length > 14) throw badRequest("invalid_points");
  return points;
}

export function geoRouter(geo: GeoClient, routing: RoutingService): Router {
  const router = Router();

  router.get("/places/search", async (req, res) => {
    const q = parse(searchSchema, req.query);
    res.set("Cache-Control", "public, max-age=3600");
    res.json(await geo.get("/communes/search", { q: q.q, limit: q.limit }));
  });

  router.get("/places", async (req, res) => {
    const q = parse(codesSchema, req.query);
    res.set("Cache-Control", "public, max-age=86400");
    res.json(await geo.get("/communes", { codes: q.codes }));
  });

  router.get("/pois", async (req, res) => {
    const q = parse(poiSchema, req.query);
    const body = await geo.get("/pois", {
      lat: q.lat.toFixed(4),
      lon: q.lon.toFixed(4),
      radius_km: q.radius,
      date_from: q.from,
      date_to: q.to,
      lang: q.lang,
    });
    res.set("Cache-Control", "public, max-age=600");
    res.json(body);
  });

  router.get("/route", async (req, res) => {
    const q = parse(routeSchema, req.query);
    const result = await routing.route(parsePoints(q.points), q.mode);
    res.set("Cache-Control", result.approximate ? "no-store" : "public, max-age=86400");
    res.json(result);
  });

  return router;
}
