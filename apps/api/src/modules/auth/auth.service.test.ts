import { describe, expect, it, vi } from "vitest";
import { LoginService } from "./auth.service.js";
import type {
  AuthenticatedPrincipal,
  LoginAccount,
  LoginSessionStore,
  NewSession,
} from "./auth.types.js";

const password = "not-a-real-user-password";
const account: LoginAccount = {
  userId: "user-id",
  email: "owner@example.com",
  displayName: "Owner",
  passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$emaEWUFozqFE9TuaGeP5Fg$Gzx+SfokKyiZlgxqE1TWPgDvzKuEho0KH/7ymWJwLEs",
  organizationId: "organization-id",
  organizationName: "Example Organization",
  membershipId: "membership-id",
};
const principal: AuthenticatedPrincipal = {
  sessionId: "session-id",
  user: { id: account.userId, email: account.email, displayName: account.displayName },
  organization: { id: account.organizationId, name: account.organizationName },
  membershipId: account.membershipId,
  roles: [],
  permissions: new Set(["dashboard.read"]),
  expiresAt: new Date("2030-01-01T12:00:00.000Z"),
};

function createStore(loginAccount: LoginAccount | null, resolvedPrincipal: AuthenticatedPrincipal | null) {
  const findLoginAccountByEmail = vi.fn<LoginSessionStore["findLoginAccountByEmail"]>()
    .mockResolvedValue(loginAccount);
  const createSession = vi.fn<LoginSessionStore["createSession"]>().mockResolvedValue(undefined);
  const revokeSession = vi.fn<LoginSessionStore["revokeSession"]>().mockResolvedValue(undefined);
  const findByTokenHash = vi.fn<LoginSessionStore["findByTokenHash"]>()
    .mockResolvedValue(resolvedPrincipal);
  const store: LoginSessionStore = {
    findLoginAccountByEmail,
    createSession,
    revokeSession,
    findByTokenHash,
  };
  return {
    store,
    findLoginAccountByEmail,
    createSession,
    revokeSession,
    findByTokenHash,
  };
}

describe("LoginService", () => {
  it("creates a hashed server-side session for valid credentials", async () => {
    const fakes = createStore(account, principal);
    const now = new Date("2030-01-01T00:00:00.000Z");
    const service = new LoginService(fakes.store, 12 * 60 * 60 * 1_000);

    const result = await service.login(account.email, password, {
      ipAddress: "127.0.0.1",
      userAgent: "test",
      requestId: "request-id",
    }, now);

    expect(result.principal).toBe(principal);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(fakes.createSession).toHaveBeenCalledOnce();

    const stored = fakes.createSession.mock.calls[0]?.[0] as NewSession;
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.tokenHash).not.toContain(result.token);
    expect(stored.expiresAt.toISOString()).toBe("2030-01-01T12:00:00.000Z");
    expect(fakes.findByTokenHash).toHaveBeenCalledWith(stored.tokenHash, now);
  });

  it("uses the same generic error for a missing account", async () => {
    const fakes = createStore(null, null);
    const service = new LoginService(fakes.store, 12 * 60 * 60 * 1_000);

    await expect(service.login("missing@example.com", "wrong-password", {
      ipAddress: null,
      userAgent: null,
      requestId: "request-id",
    })).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });

    expect(fakes.createSession).not.toHaveBeenCalled();
  });

  it("records a failed attempt without exposing whether the account exists", async () => {
    const fakes = createStore(account, null);
    const service = new LoginService(fakes.store, 12 * 60 * 60 * 1_000);

    await expect(service.login(account.email, "wrong-password", {
      ipAddress: "127.0.0.1",
      userAgent: "test",
      requestId: "request-id",
    })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "The email or password is incorrect.",
    });

  });

  it("revokes the authenticated session on logout", async () => {
    const fakes = createStore(account, principal);
    const service = new LoginService(fakes.store, 12 * 60 * 60 * 1_000);
    const now = new Date("2030-01-01T00:00:00.000Z");

    await service.logout(principal, "request-id", now);

    expect(fakes.revokeSession).toHaveBeenCalledWith(principal, "request-id", now);
  });
});