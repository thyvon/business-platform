import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Database } from "@business/database";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { ProductRepository } from "./modules/products/product.repository.js";
import { createProductRouter } from "./modules/products/product.routes.js";
import { ProductService } from "./modules/products/product.service.js";
import { errorHandler, notFoundHandler, requestContext } from "./shared/http/middleware.js";

export function createApp(database: Database["db"]) {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(pinoHttp());
  app.use(helmet());
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/v1/health", async (_request, response) => {
    await database.execute(sql`SELECT 1`);
    response.json({ data: { status: "ok", database: "connected", timestamp: new Date().toISOString() } });
  });

  const productService = new ProductService(new ProductRepository(database));
  app.use("/api/v1/products", createProductRouter(productService));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
