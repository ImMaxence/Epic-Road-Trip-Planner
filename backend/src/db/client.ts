import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";
import type { Logger } from "pino";
import * as schema from "./schema.ts";

export type Database = MySql2Database<typeof schema>;

export interface DbConnection {
  db: Database;
  pool: mysql.Pool;
}

export interface DbOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export function connect(options: DbOptions): DbConnection {
  const pool = mysql.createPool({
    ...options,
    connectionLimit: 10,
    waitForConnections: true,
    enableKeepAlive: true,
    timezone: "Z",
    dateStrings: ["DATE"],
    charset: "utf8mb4",
  });
  return { pool, db: drizzle({ client: pool, schema, mode: "default" }) };
}

/** MariaDB can take a few seconds to accept connections on first boot. */
export async function waitForDatabase(pool: mysql.Pool, log: Logger, attempts = 30): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (error) {
      if (i === attempts) throw error;
      log.warn({ attempt: i }, "database not ready yet, retrying");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
}
