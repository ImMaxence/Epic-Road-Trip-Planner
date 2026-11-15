import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  datetime,
  index,
  int,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import type { TripPlan } from "../lib/trip-schema.ts";

/** MariaDB stores JSON as LONGTEXT; (de)serialise explicitly so both MySQL and MariaDB behave the same. */
const jsonText = <T>(name: string) =>
  customType<{ data: T; driverData: string }>({
    dataType: () => "longtext",
    toDriver: (value) => JSON.stringify(value),
    fromDriver: (value) => (typeof value === "string" ? (JSON.parse(value) as T) : (value as T)),
  })(name);

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
};

/**
 * Administrator accounts only (Google sign-in, ADMIN_EMAILS). Visitors have no account: they save
 * trips and favourites on their device. `token_version` revokes every session when bumped.
 */
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  username: varchar("username", { length: 40 }).notNull(),
  googleSub: varchar("google_sub", { length: 64 }).notNull().unique(),
  tokenVersion: int("token_version").notNull().default(0),
  locale: varchar("locale", { length: 5 }).notNull().default("fr"),
  ...timestamps,
});

export const trips = mysqlTable(
  "trips",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 80 }).notNull(),
    cover: varchar("cover", { length: 16 }).notNull().default("city"),
    isPublic: boolean("is_public").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    authorName: varchar("author_name", { length: 40 }),
    fromName: varchar("from_name", { length: 120 }).notNull(),
    fromCode: varchar("from_code", { length: 5 }).notNull(),
    toName: varchar("to_name", { length: 120 }).notNull(),
    toCode: varchar("to_code", { length: 5 }).notNull(),
    stopCount: int("stop_count").notNull().default(0),
    distanceKm: int("distance_km"),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    plan: jsonText<TripPlan>("plan").notNull(),
    ...timestamps,
  },
  (t) => [
    index("trips_public_created_idx").on(t.isPublic, t.createdAt),
    index("trips_user_idx").on(t.userId),
    index("trips_from_code_idx").on(t.fromCode),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type TripRow = typeof trips.$inferSelect;
