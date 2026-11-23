import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

export function createBusinessDatabase(connectionString) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = mysql.createPool({ uri: connectionString, timezone: "Z" });
  return {
    db: drizzle(pool, { schema, mode: "default" }),
    close: () => pool.end(),
  };
}
