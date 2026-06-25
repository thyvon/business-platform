import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Database } from "@business/database";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createAuthenticate } from "./modules/auth/auth.middleware.js";
import { createCsrfProtection } from "./modules/auth/csrf.middleware.js";
import { LoginRateLimiter } from "./modules/auth/login-rate-limiter.js";
import { AuthenticationService, PasswordService } from "./modules/auth/auth.service.js";
import { ProductRepository } from "./modules/products/product.repository.js";
import { RolesRepository } from "./modules/roles/roles.repository.js";
import { createRolesRouter } from "./modules/roles/roles.routes.js";
import { RolesService } from "./modules/roles/roles.service.js";
import { UserRepository } from "./modules/users/user.repository.js";
import { createProductRouter } from "./modules/products/product.routes.js";
import { ProductService } from "./modules/products/product.service.js";
import { createUserRouter } from "./modules/users/user.routes.js";
import { UserService } from "./modules/users/user.service.js";
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
  const authenticator = new AuthenticationService(authRepository);
  const authenticate = createAuthenticate(authenticator);
  const authSessions = new PasswordService(authRepository, env.sessionTtlMs);
  const csrfProtection = createCsrfProtection(env.webOrigin);
  void authRepository.deleteExpiredSessions(new Date()).catch(() => undefined);

  app.use("/api/v1/auth", createAuthRouter({
    authenticator,
    loginSessions: authSessions,
    csrfProtection,
    loginRateLimiter: new LoginRateLimiter(),
    secureCookies: env.isProduction,
    authRepository,
  }));

  const userService = new UserService(new UserRepository(database));
  app.use("/api/v1/users", createUserRouter(userService, authenticate, csrfProtection));

  const rolesService = new RolesService(new RolesRepository(database));
  app.use("/api/v1/roles", createRolesRouter(rolesService, authenticate, csrfProtection));

  const productService = new ProductService(new ProductRepository(database));
  app.use("/api/v1/products", createProductRouter(productService));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}


