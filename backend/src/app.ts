import cookieParser from "cookie-parser";
import express, { Router } from "express";
import helmet from "helmet";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import swaggerUi from "swagger-ui-express";
import type { Config } from "./config.ts";
import type { Repositories } from "./db/repositories.ts";
import { SessionSigner } from "./lib/session.ts";
import { errorHandler, loadSession, notFoundHandler, sameOrigin } from "./middleware.ts";
import { openApiDocument } from "./openapi.ts";
import { authRouter } from "./routes/auth.ts";
import { geoRouter } from "./routes/geo.ts";
import { adminRouter } from "./routes/admin.ts";
import { meRouter } from "./routes/me.ts";
import { tripsRouter } from "./routes/trips.ts";
import type { GeoClient } from "./services/geo-client.ts";
import type { GoogleOAuth } from "./services/google.ts";
import type { RoutingService } from "./services/osrm.ts";

export interface AppDeps {
  config: Config;
  logger: Logger;
  repos: Repositories;
  geo: GeoClient;
  routing: RoutingService;
  google?: GoogleOAuth;
  checkDatabase: () => Promise<boolean>;
}

export function createApp(deps: AppDeps) {
  const { config, logger, repos } = deps;
  const signer = new SessionSigner(config.JWT_SECRET);
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/health" },
      // Never log headers (session cookie) or bodies (passwords); auth query strings carry OAuth codes.
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url.startsWith("/api/auth/") ? req.url.split("?")[0] : req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  // CSP and HSTS are owned by the nginx front container.
  app.use(helmet({ contentSecurityPolicy: false, strictTransportSecurity: false }));
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());

  const allowedOrigins = [config.publicOrigin];
  if (config.NODE_ENV !== "production") allowedOrigins.push("http://localhost:5173");

  const api = Router();
  api.use(sameOrigin(allowedOrigins));
  api.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  // Per-IP budgets: generous for browsing, tighter for the endpoints that hit the geo service and OSRM.
  const keyGenerator = (req: express.Request) =>
    ipKeyGenerator((config.TRUST_CLOUDFLARE ? req.get("cf-connecting-ip") : undefined) ?? req.ip ?? "0.0.0.0");
  const budget = (windowMs: number, limit: number) =>
    rateLimit({ windowMs, limit, keyGenerator, standardHeaders: "draft-8", legacyHeaders: false, handler: (_req, res) => res.status(429).json({ error: "too_many_requests" }) });
  api.use(budget(5 * 60_000, 1000));
  api.use("/route", budget(60_000, 40));
  api.use("/pois", budget(60_000, 90));
  api.use("/places", budget(60_000, 240));
  api.use(loadSession(signer, repos, config.adminEmails));

  api.get("/health", async (_req, res) => {
    const [dbOk, geo] = await Promise.all([
      deps.checkDatabase().catch(() => false),
      deps.geo.health().catch(() => null),
    ]);
    res.status(dbOk ? 200 : 503).json({ status: dbOk ? "ok" : "degraded", version: config.version, database: dbOk, geo });
  });

  api.get("/config", (_req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    // The feedback address is sent reversed and base64-encoded: never in clear in the page or this JSON (scrapers).
    const feedbackMailbox = config.FEEDBACK_EMAIL ? Buffer.from([...config.FEEDBACK_EMAIL].reverse().join("")).toString("base64") : null;
    res.json({ version: config.version, google: Boolean(deps.google), feedbackMailbox });
  });

  const spec = openApiDocument(config.version, config.publicOrigin);
  api.get("/openapi.json", (_req, res) => {
    res.json(spec);
  });
  api.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "Epic Road Trip API" }));

  api.use(
    "/auth",
    authRouter({
      repos,
      signer,
      secret: config.JWT_SECRET,
      publicOrigin: config.publicOrigin,
      secureCookies: config.secureCookies,
      adminEmails: config.adminEmails,
      google: deps.google,
      trustCloudflare: config.TRUST_CLOUDFLARE,
    }),
  );
  api.use("/me", meRouter(repos));
  api.use("/admin", adminRouter(repos, deps.geo, config.GEO_ADMIN_TOKEN));
  api.use("/trips", tripsRouter(repos));
  api.use(geoRouter(deps.geo, deps.routing));
  api.use(notFoundHandler);

  app.use("/api", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
