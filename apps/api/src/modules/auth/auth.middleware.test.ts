import type { NextFunction, Request, RequestHandler, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { authorize, createAuthenticate, readSessionToken } from "./auth.middleware.js";
import { AuthenticationService, hashSessionToken } from "./auth.service.js";
import type { AuthenticatedPrincipal, SessionPrincipalStore } from "./auth.types.js";

const validToken = "a-secure-random-session-token-with-enough-entropy";
const principal: AuthenticatedPrincipal = {
  sessionId: "session-id",
  user: { id: "user-id", email: "owner@example.com", displayName: "Owner" },
  organization: { id: "organization-id", name: "Example Organization" },
  membershipId: "membership-id",
  roles: [],
  permissions: new Set(["dashboard.read"]),
  expiresAt: new Date("2030-01-01T00:00:00.000Z"),
};

function requestWithCookie(cookie?: string): Request {
  return { headers: cookie === undefined ? {} : { cookie } } as Request;
}

async function invoke(middleware: RequestHandler, request: Request): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const next: NextFunction = (error?: unknown) => {
      if (error instanceof Error) reject(error);
      else if (error) reject(new Error("Middleware failed.", { cause: error }));
      else resolve(undefined);
    };
    Promise.resolve(middleware(request, {} as Response, next)).catch(reject);
  });
}

describe("session authentication", () => {
  it("reads only the configured session cookie", () => {
    expect(readSessionToken("theme=dark; bp_session=" + validToken + "; locale=en")).toBe(validToken);
    expect(readSessionToken("theme=dark")).toBeNull();
    expect(readSessionToken(undefined)).toBeNull();
  });

  it("hashes a valid token before querying the session store", async () => {
    const findByTokenHash = vi.fn<SessionPrincipalStore["findByTokenHash"]>().mockResolvedValue(principal);
    const store: SessionPrincipalStore = { findByTokenHash };
    const now = new Date("2029-01-01T00:00:00.000Z");

    await expect(new AuthenticationService(store).authenticate(validToken, now)).resolves.toBe(principal);
    expect(findByTokenHash).toHaveBeenCalledWith(hashSessionToken(validToken), now);
  });

  it("rejects malformed short tokens without querying the store", async () => {
    const findByTokenHash = vi.fn<SessionPrincipalStore["findByTokenHash"]>();
    const store: SessionPrincipalStore = { findByTokenHash };

    await expect(new AuthenticationService(store).authenticate("too-short")).resolves.toBeNull();
    expect(findByTokenHash).not.toHaveBeenCalled();
  });

  it("attaches the principal for a valid active session", async () => {
    const findByTokenHash = vi.fn<SessionPrincipalStore["findByTokenHash"]>().mockResolvedValue(principal);
    const store: SessionPrincipalStore = { findByTokenHash };
    const request = requestWithCookie("bp_session=" + validToken);

    await invoke(createAuthenticate(new AuthenticationService(store)), request);

    expect(request.principal).toBe(principal);
  });

  it("returns the generic authentication error for a missing session", async () => {
    const findByTokenHash = vi.fn<SessionPrincipalStore["findByTokenHash"]>();
    const store: SessionPrincipalStore = { findByTokenHash };

    await expect(invoke(createAuthenticate(new AuthenticationService(store)), requestWithCookie()))
      .rejects.toMatchObject({ statusCode: 401, code: "AUTHENTICATION_REQUIRED" });
    expect(findByTokenHash).not.toHaveBeenCalled();
  });
});

describe("permission authorization", () => {
  it("allows a principal with the required permission", async () => {
    const request = requestWithCookie();
    request.principal = principal;

    await expect(invoke(authorize("dashboard.read"), request)).resolves.toBeUndefined();
  });

  it("denies a principal without the required permission", async () => {
    const request = requestWithCookie();
    request.principal = principal;

    await expect(invoke(authorize("users.read"), request))
      .rejects.toMatchObject({ statusCode: 403, code: "PERMISSION_DENIED" });
  });

  it("denies by default when authentication was not run", async () => {
    await expect(invoke(authorize("dashboard.read"), requestWithCookie()))
      .rejects.toMatchObject({ statusCode: 401, code: "AUTHENTICATION_REQUIRED" });
  });
});