import type { NextFunction, Request, RequestHandler, Response } from "express";
import { describe, expect, it } from "vitest";
import { clearSessionCookie, createSessionCookie } from "./auth.cookie.js";
import { createCsrfProtection } from "./csrf.middleware.js";
import { LoginRateLimiter, RecoveryRateLimiter } from "./login-rate-limiter.js";

function request(method: string, headers: Record<string, string> = {}): Request {
  return {
    method,
    header: (name: string) => headers[name.toLowerCase()],
  } as Request;
}

async function invoke(middleware: RequestHandler, input: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    const next: NextFunction = (error?: unknown) => {
      if (error instanceof Error) reject(error);
      else if (error) reject(new Error("Middleware failed.", { cause: error }));
      else resolve();
    };
    Promise.resolve(middleware(input, {} as Response, next)).catch(reject);
  });
}

describe("session cookies", () => {
  it("sets the required production security attributes", () => {
    const cookie = createSessionCookie(
      "session-token",
      new Date("2030-01-01T00:00:00.000Z"),
      true,
    );

    expect(cookie).toContain("bp_session=session-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Expires=");
  });

  it("clears the cookie with the same scope", () => {
    const cookie = clearSessionCookie(true);

    expect(cookie).toContain("bp_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
  });
});

describe("CSRF origin validation", () => {
  const protect = createCsrfProtection("https://app.example.com");

  it("allows an exact configured origin", async () => {
    await expect(invoke(protect, request("POST", {
      origin: "https://app.example.com",
    }))).resolves.toBeUndefined();
  });

  it("allows safe methods without an origin header", async () => {
    await expect(invoke(protect, request("GET"))).resolves.toBeUndefined();
  });

  it("rejects missing and cross-site origins for mutations", async () => {
    await expect(invoke(protect, request("POST")))
      .rejects.toMatchObject({ statusCode: 403, code: "CSRF_VALIDATION_FAILED" });
    await expect(invoke(protect, request("POST", { origin: "https://evil.example" })))
      .rejects.toMatchObject({ statusCode: 403, code: "CSRF_VALIDATION_FAILED" });
  });
});

describe("login rate limiting", () => {
  it("blocks repeated failures for one network and account pair", () => {
    const limiter = new LoginRateLimiter();
    const now = new Date("2030-01-01T00:00:00.000Z");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.assertAllowed("127.0.0.1", "owner@example.com", now);
      limiter.recordFailure("127.0.0.1", "owner@example.com", now);
    }

    expect(() => limiter.assertAllowed("127.0.0.1", "owner@example.com", now))
      .toThrow(expect.objectContaining({ statusCode: 429, code: "LOGIN_RATE_LIMITED" }));
  });

  it("clears the account-pair throttle after a successful login", () => {
    const limiter = new LoginRateLimiter();
    const now = new Date("2030-01-01T00:00:00.000Z");

    limiter.recordFailure("127.0.0.1", "owner@example.com", now);
    limiter.recordSuccess("127.0.0.1", "owner@example.com");

    expect(() => limiter.assertAllowed("127.0.0.1", "owner@example.com", now)).not.toThrow();
  });
});
describe("password recovery rate limiting", () => {
  it("blocks repeated forgot-password requests for one account", () => {
    const limiter = new RecoveryRateLimiter();
    const now = new Date("2030-01-01T00:00:00.000Z");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      limiter.consumeForgotPassword("127.0.0.1", "owner@example.com", now);
    }

    expect(() => limiter.consumeForgotPassword("127.0.0.2", "owner@example.com", now))
      .toThrow(expect.objectContaining({ statusCode: 429, code: "PASSWORD_RECOVERY_RATE_LIMITED" }));
  });

  it("blocks repeated reset-password attempts for one token", () => {
    const limiter = new RecoveryRateLimiter();
    const now = new Date("2030-01-01T00:00:00.000Z");
    const token = "a-secure-password-reset-token-with-enough-entropy";

    for (let attempt = 0; attempt < 8; attempt += 1) {
      limiter.consumeResetPassword("127.0.0.1", token, now);
    }

    expect(() => limiter.consumeResetPassword("127.0.0.2", token, now))
      .toThrow(expect.objectContaining({ statusCode: 429, code: "PASSWORD_RECOVERY_RATE_LIMITED" }));
  });
});
