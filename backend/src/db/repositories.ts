import { and, asc, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import type { TripInput, TripPlan } from "../lib/trip-schema.ts";
import type { Database } from "./client.ts";
import { trips, users, type TripRow, type UserRow } from "./schema.ts";

export interface TripSummary {
  id: number;
  title: string;
  titles?: TripPlan["titles"];
  summary?: TripPlan["summary"];
  cover: string;
  isPublic: boolean;
  featured: boolean;
  author: { id: number | null; name: string };
  from: { code: string; name: string };
  to: { code: string; name: string };
  via: string[];
  stopCount: number;
  distanceKm: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

export interface TripDetail extends TripSummary {
  plan: TripPlan;
}

export interface TripQuery {
  sort: "recent" | "oldest";
  from?: string;
  author?: string;
  featured?: boolean;
  /** Restrict to these trips (favourites kept on the visitor's device). */
  ids?: number[];
  limit: number;
  offset: number;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

function toSummary(row: TripRow, username: string | null, viewerId?: number): TripSummary {
  const plan = row.plan;
  return {
    id: row.id,
    title: row.title,
    titles: plan.titles,
    summary: plan.summary,
    cover: row.cover,
    isPublic: row.isPublic,
    featured: row.featured,
    author: { id: row.userId, name: row.authorName ?? username ?? "—" },
    from: { code: row.fromCode, name: row.fromName },
    to: { code: row.toCode, name: row.toName },
    via: (plan.via ?? []).map((p) => p.name),
    stopCount: row.stopCount,
    distanceKm: row.distanceKm,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isOwner: viewerId !== undefined && row.userId === viewerId,
  };
}

function columnsFromInput(input: TripInput) {
  const { plan } = input;
  return {
    title: input.title,
    cover: input.cover,
    isPublic: input.isPublic,
    fromName: plan.from.name,
    fromCode: plan.from.code,
    toName: plan.to.name,
    toCode: plan.to.code,
    stopCount: plan.via.length,
    distanceKm: plan.distanceKm != null ? Math.round(plan.distanceKm) : null,
    startDate: plan.startDate ?? null,
    endDate: plan.endDate ?? null,
    plan,
  };
}

export function createRepositories(db: Database) {
  const users_ = {
    async byId(id: number): Promise<UserRow | undefined> {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row;
    },
    async byEmail(email: string): Promise<UserRow | undefined> {
      const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      return row;
    },
    async byGoogleSub(sub: string): Promise<UserRow | undefined> {
      const [row] = await db.select().from(users).where(eq(users.googleSub, sub)).limit(1);
      return row;
    },
    async create(values: { email: string; username: string; googleSub: string; locale?: string }): Promise<UserRow> {
      const [result] = await db.insert(users).values({ ...values, email: values.email.toLowerCase() }).$returningId();
      const created = await users_.byId(result!.id);
      if (!created) throw new Error("user insert failed");
      return created;
    },
    async update(id: number, values: Partial<Pick<UserRow, "email" | "username" | "googleSub" | "locale" | "tokenVersion">>): Promise<void> {
      await db.update(users).set({ ...values, ...(values.email ? { email: values.email.toLowerCase() } : {}) }).where(eq(users.id, id));
    },
    async delete(id: number): Promise<void> {
      await db.delete(users).where(eq(users.id, id));
    },
  };

  const trips_ = {
    async list(query: TripQuery, viewerId?: number): Promise<{ items: TripSummary[]; total: number }> {
      const conditions: SQL[] = [eq(trips.isPublic, true)];
      if (query.featured !== undefined) conditions.push(eq(trips.featured, query.featured));
      if (query.from) {
        const term = query.from.trim();
        conditions.push(/^[0-9][0-9AB][0-9]{3}$/.test(term) ? eq(trips.fromCode, term) : like(trips.fromName, `%${escapeLike(term)}%`));
      }
      if (query.author) {
        const pattern = `%${escapeLike(query.author.trim())}%`;
        conditions.push(or(like(users.username, pattern), like(trips.authorName, pattern))!);
      }
      if (query.ids) conditions.push(query.ids.length ? inArray(trips.id, query.ids) : sql`false`);
      const where = and(...conditions);
      const order = query.sort === "oldest" ? [asc(trips.createdAt), asc(trips.id)] : [desc(trips.createdAt), desc(trips.id)];

      const rows = await db
        .select({ trip: trips, username: users.username })
        .from(trips)
        .leftJoin(users, eq(trips.userId, users.id))
        .where(where)
        .orderBy(...order)
        .limit(query.limit)
        .offset(query.offset);
      const [count] = await db
        .select({ n: sql<number>`count(*)`.mapWith(Number) })
        .from(trips)
        .leftJoin(users, eq(trips.userId, users.id))
        .where(where);
      return {
        items: rows.map((r) => toSummary(r.trip, r.username, viewerId)),
        total: count?.n ?? 0,
      };
    },

    async listByOwner(userId: number): Promise<TripSummary[]> {
      const rows = await db
        .select({ trip: trips, username: users.username })
        .from(trips)
        .leftJoin(users, eq(trips.userId, users.id))
        .where(eq(trips.userId, userId))
        .orderBy(desc(trips.updatedAt));
      return rows.map((r) => toSummary(r.trip, r.username, userId));
    },

    async detail(id: number, viewerId?: number): Promise<TripDetail | undefined> {
      const [row] = await db
        .select({ trip: trips, username: users.username })
        .from(trips)
        .leftJoin(users, eq(trips.userId, users.id))
        .where(eq(trips.id, id))
        .limit(1);
      if (!row) return undefined;
      return { ...toSummary(row.trip, row.username, viewerId), plan: row.trip.plan };
    },

    async countByOwner(userId: number): Promise<number> {
      const [row] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(trips).where(eq(trips.userId, userId));
      return row?.n ?? 0;
    },

    async raw(id: number): Promise<TripRow | undefined> {
      const [row] = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
      return row;
    },

    async create(userId: number | null, input: TripInput, extra: { featured?: boolean; authorName?: string } = {}): Promise<number> {
      const [result] = await db
        .insert(trips)
        .values({ ...columnsFromInput(input), userId, featured: extra.featured ?? false, authorName: extra.authorName ?? null })
        .$returningId();
      return result!.id;
    },

    async update(id: number, input: TripInput): Promise<void> {
      await db.update(trips).set(columnsFromInput(input)).where(eq(trips.id, id));
    },

    async delete(id: number): Promise<void> {
      await db.delete(trips).where(eq(trips.id, id));
    },

    async setPublic(id: number, isPublic: boolean): Promise<void> {
      await db.update(trips).set({ isPublic }).where(eq(trips.id, id));
    },

    async counts() {
      const [row] = await db
        .select({
          total: sql<number>`count(*)`.mapWith(Number),
          published: sql<number>`sum(case when ${trips.isPublic} = true then 1 else 0 end)`.mapWith(Number),
          featured: sql<number>`sum(case when ${trips.featured} = true then 1 else 0 end)`.mapWith(Number),
        })
        .from(trips);
      return { total: row?.total ?? 0, published: row?.published ?? 0, featured: row?.featured ?? 0 };
    },

    async featuredTitles(): Promise<Set<string>> {
      const rows = await db.select({ title: trips.title }).from(trips).where(eq(trips.featured, true));
      return new Set(rows.map((r) => r.title));
    },
  };

  return { users: users_, trips: trips_ };
}

export type Repositories = ReturnType<typeof createRepositories>;
