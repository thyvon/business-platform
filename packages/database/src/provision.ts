import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const url = new URL(process.env.DATABASE_URL);
const databaseName = url.pathname.replace(/^\//, "");
if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) throw new Error("Invalid database name.");
url.pathname = "";

const connection = await mysql.createConnection(url.toString());
try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Database '${databaseName}' is ready.`);
} finally {
  await connection.end();
}
