import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(connectionUri: string) {
  const pool = mysql.createPool({ uri: connectionUri, connectionLimit: 10, enableKeepAlive: true });
  return { db: drizzle(pool, { schema, mode: "default" }), pool };
}

export * from "./schema.js";
export { hashPassword, passwordHashOptions, verifyPassword } from "./auth-password.js";
