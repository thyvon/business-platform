import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createDatabase } from "./index.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const database = createDatabase(process.env.DATABASE_URL);
try {
  await migrate(database.db, { migrationsFolder: path.resolve(directory, "../drizzle") });
  console.log("Database migrations completed.");
} finally {
  await database.pool.end();
}
