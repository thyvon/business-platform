import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createDatabase } from "./index.js";
import { seedAuthorization } from "./auth-seed.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const database = createDatabase(process.env.DATABASE_URL);
try {
  const result = await seedAuthorization(database.db);
  console.log(
    "Authorization seed completed: "
    + result.permissionCount
    + " permissions and built-in roles for "
    + result.organizationCount
    + " organizations synchronized.",
  );
} finally {
  await database.pool.end();
}
