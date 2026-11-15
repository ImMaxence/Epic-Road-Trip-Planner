import type { Logger } from "pino";
import { tripInputSchema } from "../lib/trip-schema.ts";
import featured from "./featured-trips.json" with { type: "json" };
import type { Repositories } from "./repositories.ts";

export const TEAM_AUTHOR = "Équipe Epic Road Trip";

/** Curated itineraries shown on the home page. Idempotent: inserted once, matched by title. */
export async function seedFeaturedTrips(repos: Repositories, log: Logger): Promise<void> {
  const existing = await repos.trips.featuredTitles();
  let added = 0;
  for (const raw of featured) {
    if (existing.has(raw.title)) continue;
    const input = tripInputSchema.parse({ title: raw.title, cover: raw.cover, isPublic: true, plan: raw.plan });
    await repos.trips.create(null, input, { featured: true, authorName: TEAM_AUTHOR });
    added++;
  }
  if (added) log.info({ added }, "featured trips seeded");
}
