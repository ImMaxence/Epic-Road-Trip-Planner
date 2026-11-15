import { z } from "zod";

export const COVERS = ["city", "campfire", "forest", "mountain", "beach"] as const;
export const ROUTE_COLORS = ["red", "green", "blue", "yellow", "brown", "ink"] as const;
export const MAP_STYLES = ["atlas", "day", "night"] as const;
export const POI_BUCKETS = ["eat", "drink", "sleep", "enjoy", "travel", "events"] as const;

const isoDate = z.iso.date();
const inseeCode = z.string().regex(/^[0-9][0-9AB][0-9]{3}$/, "Invalid INSEE code");

export const placeSchema = z.object({
  code: inseeCode,
  name: z.string().trim().min(1).max(120),
  postcode: z.string().max(5).optional(),
  departmentCode: z.string().max(3).optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const pinSchema = z.object({
  id: z.string().min(1).max(40),
  stop: z.number().int().min(0).max(30),
  name: z.string().trim().min(1).max(160),
  category: z.enum(POI_BUCKETS),
  kind: z.string().max(40).nullish(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const tripPlanSchema = z
  .object({
    version: z.literal(1),
    from: placeSchema,
    to: placeSchema,
    via: z.array(placeSchema).max(12).default([]),
    startDate: isoDate.nullish(),
    endDate: isoDate.nullish(),
    travelMode: z.enum(["car", "bike", "foot"]).default("car"),
    mapStyle: z.enum(MAP_STYLES).default("atlas"),
    routeColor: z.enum(ROUTE_COLORS).default("red"),
    radiusKm: z.number().min(1).max(30).default(5),
    pins: z.array(pinSchema).max(150).default([]),
    distanceKm: z.number().nonnegative().max(30000).nullish(),
    durationMin: z.number().nonnegative().max(60000).nullish(),
    notes: z.string().max(2000).nullish(),
    titles: z.object({ fr: z.string().max(80).optional(), en: z.string().max(80).optional() }).optional(),
    summary: z.object({ fr: z.string().max(400).optional(), en: z.string().max(400).optional() }).optional(),
  })
  .refine((p) => !p.startDate || !p.endDate || p.startDate <= p.endDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

export type TripPlan = z.infer<typeof tripPlanSchema>;

export const tripInputSchema = z.object({
  title: z.string().trim().min(2).max(80),
  cover: z.enum(COVERS).default("city"),
  isPublic: z.boolean().default(false),
  plan: tripPlanSchema,
});

export type TripInput = z.infer<typeof tripInputSchema>;
