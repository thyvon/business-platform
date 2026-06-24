import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { errorHandler, requestContext } from "../../shared/http/middleware.js";
import { createAuthRouter } from "./auth.routes.js";
import { createCsrfProtection } from "./csrf.middleware.js";
import { LoginRateLimiter } from "./login-rate-limiter.js";
import type { AuthRepository } from "./auth.repository.js";
import type { AuthenticationService, LoginService } from "./auth.service.js";
import type { AuthenticatedPrincipal } from "./auth.types.js";

const principal: AuthenticatedPrincipal = {
  sessionId: "session-id",
  user: { id: "user-id", email: "owner@example.com", displayName: "Owner" },
  organization: { id: "organization-id", name: "Example Organization" },
  membershipId: "membership-id",
  roles: [{ id: "role-id", name: "Owner", description: "Owner", isSystem: true }],
  permissions: new Set(["dashboard.read"]),
  expiresAt: new Date("2030-01-01T12:00:00.000Z"),
};

describe("authentication routes", () => {
  it("supports login, current session, and logout with secure HTTP behavior", async () => {
    const authenticate = vi.fn<AuthenticationService["authenticate"]>().mockResolvedValue(principal);
    const login = vi.fn<LoginService["login"]>().mockResolvedValue({
      token: "a-secure-random-session-token-with-enough-entropy",
      principal,
    });
    const logout = vi.fn<LoginService["logout"]>().mockResolvedValue(undefined);

    const updateUserProfile = vi.fn<AuthRepository["updateUserProfile"]>();

    const app = express();
    app.use(requestContext);
    app.use(express.json());
    app.use("/auth", createAuthRouter({
      authenticator: { authenticate },
      loginSessions: { login, logout },
      csrfProtection: createCsrfProtection("https://app.example.com"),
      loginRateLimiter: new LoginRateLimiter(),
      secureCookies: true,
      authRepository: { updateUserProfile } as unknown as AuthRepository,
    }));
    app.use(errorHandler);

    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address() as AddressInfo;
    const baseUrl = "http://127.0.0.1:" + address.port;

    try {
      const loginResponse = await fetch(baseUrl + "/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.example.com",
        },
        body: JSON.stringify({ email: "owner@example.com", password: "valid-password" }),
      });

      expect(loginResponse.status).toBe(200);
      const sessionCookie = loginResponse.headers.get("set-cookie");
      expect(sessionCookie).toContain("bp_session=");
      expect(sessionCookie).toContain("HttpOnly");
      expect(sessionCookie).toContain("Secure");

      const meResponse = await fetch(baseUrl + "/auth/me", {
        headers: { cookie: sessionCookie?.split(";")[0] ?? "" },
      });
      expect(meResponse.status).toBe(200);

      const logoutResponse = await fetch(baseUrl + "/auth/logout", {
        method: "POST",
        headers: {
          cookie: sessionCookie?.split(";")[0] ?? "",
          origin: "https://app.example.com",
        },
      });
      expect(logoutResponse.status).toBe(204);
      expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");
      expect(logout).toHaveBeenCalledOnce();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("rejects login requests from an untrusted origin before checking credentials", async () => {
    const authenticate = vi.fn<AuthenticationService["authenticate"]>();
    const login = vi.fn<LoginService["login"]>();
    const logout = vi.fn<LoginService["logout"]>();

    const updateUserProfile = vi.fn<AuthRepository["updateUserProfile"]>();

    const app = express();
    app.use(requestContext);
    app.use(express.json());
    app.use("/auth", createAuthRouter({
      authenticator: { authenticate },
      loginSessions: { login, logout },
      csrfProtection: createCsrfProtection("https://app.example.com"),
      loginRateLimiter: new LoginRateLimiter(),
      secureCookies: true,
      authRepository: { updateUserProfile } as unknown as AuthRepository,
    }));
    app.use(errorHandler);

    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address() as AddressInfo;

    try {
      const response = await fetch("http://127.0.0.1:" + address.port + "/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ email: "owner@example.com", password: "password" }),
      });

      expect(response.status).toBe(403);
      expect(login).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });
});