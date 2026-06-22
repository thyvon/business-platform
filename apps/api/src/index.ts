import { createServer } from "node:http";
import { createDatabase } from "@business/database";
import { createApp } from "./create-app.js";
import { env } from "./config/env.js";

const database = createDatabase(env.databaseUrl);
const app = createApp(database.db);
const server = createServer(app);

server.listen(env.port, "0.0.0.0", () => {
  console.log(JSON.stringify({ level: "info", message: "API server started", port: env.port, environment: env.nodeEnv }));
});

function shutdown(signal: string) {
  console.log(JSON.stringify({ level: "info", message: "Graceful shutdown started", signal }));
  server.close(() => {
    void database.pool.end().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
