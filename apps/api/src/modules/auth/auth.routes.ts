import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateUserSchema,
  type CurrentSession,
} from "@business/contracts";
import { Router } from "express";
import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { clearSessionCookie, createSessionCookie } from "./auth.cookie.js";
import { createAuthenticate, readSessionToken } from "./auth.middleware.js";
import type {
  LoginMetadata,
  LoginResult,
  SessionAuthenticator,
} from "./auth.service.js";
import type { AuthenticatedPrincipal } from "./auth.types.js";
import type { AuthRepository } from "./auth.repository.js";
import type { LoginRateLimiter, RecoveryRateLimiter } from "./login-rate-limiter.js";

interface LoginSessions {
  login(
    email: string,
    password: string,
    metadata: LoginMetadata,
    now?: Date,
  ): Promise<LoginResult>;
  changePassword(
    principal: AuthenticatedPrincipal,
    currentPassword: string,
    newPassword: string,
    metadata: LoginMetadata,
    now?: Date,
  ): Promise<LoginResult>;
  requestPasswordReset(email: string, metadata: LoginMetadata, now?: Date): Promise<void>;
  resetPassword(token: string, newPassword: string, metadata: LoginMetadata, now?: Date): Promise<void>;
  logout(principal: AuthenticatedPrincipal, requestId: string, now?: Date): Promise<void>;
}

interface AuthRouterDependencies {
  authenticator: SessionAuthenticator;
  loginSessions: LoginSessions;
  csrfProtection: RequestHandler;
  loginRateLimiter: LoginRateLimiter;
  recoveryRateLimiter: RecoveryRateLimiter;
  secureCookies: boolean;
  authRepository: AuthRepository;
}

function toCurrentSession(principal: AuthenticatedPrincipal): CurrentSession {
  return {
    user: { ...principal.user, status: "active" },
    organization: { ...principal.organization, status: "active" },
    membershipId: principal.membershipId,
    membershipStatus: "active",
    roles: principal.roles.map((role) => ({ ...role })),
    permissions: [...principal.permissions].sort(),
    expiresAt: principal.expiresAt.toISOString(),
  };
}

function getLoginMetadata(request: Parameters<RequestHandler>[0], requestId: string): LoginMetadata {
  return {
    ipAddress: request.ip || null,
    userAgent: request.header("user-agent")?.slice(0, 2_000) ?? null,
    requestId,
  };
}

export function createAuthRouter(dependencies: AuthRouterDependencies) {
  const router = Router();
  const authenticate = createAuthenticate(dependencies.authenticator);

  router.post("/login", dependencies.csrfProtection, async (request, response) => {
    const input = loginSchema.parse(request.body);
    const ipAddress = request.ip || "unknown";
    const now = new Date();

    dependencies.loginRateLimiter.assertAllowed(ipAddress, input.email, now);

    try {
      const result = await dependencies.loginSessions.login(
        input.email,
        input.password,
        getLoginMetadata(request, String(response.locals.requestId)),
        now,
      );

      dependencies.loginRateLimiter.recordSuccess(ipAddress, input.email);
      response.setHeader(
        "set-cookie",
        createSessionCookie(result.token, result.principal.expiresAt, dependencies.secureCookies),
      );
      response.json({ data: toCurrentSession(result.principal) });
    } catch (error) {
      if (error instanceof AppError && error.code === "INVALID_CREDENTIALS") {
        dependencies.loginRateLimiter.recordFailure(ipAddress, input.email, now);
        request.log.warn(
          { event: "auth.login.failed", requestId: String(response.locals.requestId) },
          "Login failed",
        );
      }
      throw error;
    }
  });

  router.post("/forgot-password", dependencies.csrfProtection, async (request, response) => {
    const input = forgotPasswordSchema.parse(request.body);
    dependencies.recoveryRateLimiter.consumeForgotPassword(request.ip || "unknown", input.email);
    await dependencies.loginSessions.requestPasswordReset(
      input.email,
      getLoginMetadata(request, String(response.locals.requestId)),
    );
    response.status(204).send();
  });

  router.post("/reset-password", dependencies.csrfProtection, async (request, response) => {
    const input = resetPasswordSchema.parse(request.body);
    dependencies.recoveryRateLimiter.consumeResetPassword(request.ip || "unknown", input.token);
    await dependencies.loginSessions.resetPassword(
      input.token,
      input.newPassword,
      getLoginMetadata(request, String(response.locals.requestId)),
    );
    response.status(204).send();
  });

  router.post("/logout", dependencies.csrfProtection, authenticate, async (request, response) => {
    await dependencies.loginSessions.logout(
      request.principal!,
      String(response.locals.requestId),
    );
    response.setHeader("set-cookie", clearSessionCookie(dependencies.secureCookies));
    response.status(204).send();
  });

  router.post("/change-password", dependencies.csrfProtection, authenticate, async (request, response) => {
    const input = changePasswordSchema.parse(request.body);
    const result = await dependencies.loginSessions.changePassword(
      request.principal!,
      input.currentPassword,
      input.newPassword,
      getLoginMetadata(request, String(response.locals.requestId)),
    );

    response.setHeader(
      "set-cookie",
      createSessionCookie(result.token, result.principal.expiresAt, dependencies.secureCookies),
    );
    response.json({ data: toCurrentSession(result.principal) });
  });

  router.get("/me", authenticate, (request, response) => {
    response.json({ data: toCurrentSession(request.principal!) });
  });

  router.patch("/profile", dependencies.csrfProtection, authenticate, async (request, response) => {
    const input = updateUserSchema.parse(request.body);
    const principal = request.principal!;

    if (input.displayName) {
      await dependencies.authRepository.updateUserProfile(principal.user.id, input.displayName);
    }

    const token = readSessionToken(request.headers.cookie);
    const updatedPrincipal = token ? await dependencies.authenticator.authenticate(token) : null;

    response.json({ data: updatedPrincipal ? toCurrentSession(updatedPrincipal) : toCurrentSession(principal) });
  });

  return router;
}

