import { Router } from "express";
import { z } from "zod";
import type { Repositories } from "../db/repositories.ts";
import { parse, requireAdmin } from "../middleware.ts";
import { publicUser } from "./auth.ts";

const profileSchema = z
  .object({ username: z.string().trim().min(2).max(40).optional(), locale: z.enum(["fr", "en"]).optional() })
  .refine((v) => v.username || v.locale, { message: "nothing_to_update" });

/** The signed-in administrator's own profile and trips. */
export function meRouter(repos: Repositories): Router {
  const router = Router();
  router.use(requireAdmin);

  router.patch("/", async (req, res) => {
    const input = parse(profileSchema, req.body);
    await repos.users.update(req.user!.id, input);
    res.json({ user: publicUser((await repos.users.byId(req.user!.id))!) });
  });

  router.get("/trips", async (req, res) => {
    res.json({ items: await repos.trips.listByOwner(req.user!.id) });
  });

  return router;
}
