import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Database } from "@business/database";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createCsrfProtection } from "./modules/auth/csrf.middleware.js";
import { LoginRateLimiter } from "./modules/auth/login-rate-limiter.js";
import { AuthenticationService, LoginService } from "./modules/auth/auth.service.js";
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

  const authRepository = new AuthRepository(database);
  app.use("/api/v1/auth", createAuthRouter({
    authenticator: new AuthenticationService(authRepository),
    loginSessions: new LoginService(authRepository, env.sessionTtlMs),
    csrfProtection: createCsrfProtection(env.webOrigin),
    loginRateLimiter: new LoginRateLimiter(),
    secureCookies: env.isProduction,
    authRepository,
  }));

  const productService = new ProductService(new ProductRepository(database));
  app.use("/api/v1/products", createProductRouter(productService));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
