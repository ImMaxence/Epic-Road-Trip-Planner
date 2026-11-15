import { pino } from "pino";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { connect, runMigrations, waitForDatabase } from "./db/client.ts";
import { createRepositories } from "./db/repositories.ts";
import { seedFeaturedTrips } from "./db/seed.ts";
import { GeoClient } from "./services/geo-client.ts";
import { googleOAuth } from "./services/google.ts";
import { RoutingService } from "./services/osrm.ts";

const config = loadConfig();
const logger = pino({ level: config.LOG_LEVEL, base: { service: "backend", version: config.version } });

const { db, pool } = connect({
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,
  database: config.DATABASE_NAME,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
});

await waitForDatabase(pool, logger);
await runMigrations(db);
const repos = createRepositories(db);
await seedFeaturedTrips(repos, logger);

const app = createApp({
  config,
  logger,
  repos,
  geo: new GeoClient(config.GEO_SERVICE_URL),
  routing: new RoutingService(
    { car: config.OSRM_CAR_URL, bike: config.OSRM_BIKE_URL, foot: config.OSRM_FOOT_URL },
    `EpicRoadTripPlanner/${config.version} (+${config.publicOrigin})`,
  ),
  google: config.googleEnabled ? googleOAuth(config.GOOGLE_CLIENT_ID!, config.GOOGLE_CLIENT_SECRET!) : undefined,
  checkDatabase: async () => {
    await pool.query("SELECT 1");
    return true;
  },
});


const server = app.listen(config.PORT, "0.0.0.0", () => {
  logger.info({ port: config.PORT, google: config.googleEnabled, admins: config.adminEmails.length }, "API listening");
  if (config.googleEnabled && !config.adminEmails.length) logger.warn("ADMIN_EMAILS is empty: nobody can use the administration");
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "shutting down");
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
