import { z } from "zod";
import pkg from "../package.json" with { type: "json" };
import { parseAllowlist } from "./lib/allowlist.ts";

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));
/** Like optional, but "disabled" / "none" / "off" also mean "not configured" (required compose variables). */
const disableable = optional.transform((v) => (v && ["disabled", "none", "off"].includes(v.toLowerCase()) ? undefined : v));

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  PUBLIC_URL: z.url().default("http://localhost:5173"),
  DATABASE_HOST: z.string().min(1).default("localhost"),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_NAME: z.string().min(1).default("roadtrip"),
  DATABASE_USER: z.string().min(1).default("roadtrip"),
  DATABASE_PASSWORD: z.string().default(""),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  GEO_SERVICE_URL: z.url().default("http://localhost:8000"),
  // Shared with the geo service to authorise manual data refreshes (Coolify generates it).
  GEO_ADMIN_TOKEN: optional,
  // One OSRM engine per travel mode (FOSSGIS servers used by openstreetmap.org by default).
  OSRM_CAR_URL: z.url().default("https://routing.openstreetmap.de/routed-car"),
  OSRM_BIKE_URL: z.url().default("https://routing.openstreetmap.de/routed-bike"),
  OSRM_FOOT_URL: z.url().default("https://routing.openstreetmap.de/routed-foot"),
  // Google OAuth 2.0 (authorization code + PKCE). Redirect URI: <PUBLIC_URL>/api/auth/google/callback
  GOOGLE_CLIENT_ID: disableable,
  GOOGLE_CLIENT_SECRET: disableable,
  // Administrators (Google sign-in only): comma/space separated e-mails or whole "@domain" entries. Empty = no admin.
  ADMIN_EMAILS: z.string().default(""),
  TRUST_PROXY: z.string().default("loopback, linklocal, uniquelocal"),
  // Only when the domain is proxied by Cloudflare: otherwise CF-Connecting-IP could be forged by clients.
  TRUST_CLOUDFLARE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Config = Omit<z.infer<typeof schema>, "ADMIN_EMAILS"> & {
  version: string;
  publicOrigin: string;
  secureCookies: boolean;
  adminEmails: string[];
  googleEnabled: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration — ${details}`);
  }
  const { ADMIN_EMAILS, ...rest } = parsed.data;
  const publicOrigin = new URL(rest.PUBLIC_URL).origin;
  return {
    ...rest,
    version: pkg.version,
    publicOrigin,
    secureCookies: publicOrigin.startsWith("https://"),
    adminEmails: parseAllowlist(ADMIN_EMAILS),
    googleEnabled: Boolean(rest.GOOGLE_CLIENT_ID && rest.GOOGLE_CLIENT_SECRET),
  };
}
