import { describe, expect, it, vi } from "vitest";
import { LoginService, PasswordService } from "./auth.service.js";
import { EmailService } from "../../shared/email/email.service.js";
import type {
  AuthenticatedPrincipal,
  LoginAccount,
  LoginSessionStore,
  NewSession,
  PasswordResetStore,
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
describe("PasswordService", () => {
  function createPasswordStore(resolvedPrincipal: AuthenticatedPrincipal | null) {
    const fakes = createStore(account, resolvedPrincipal);
    const findPasswordHashByUserId = vi.fn<PasswordResetStore["findPasswordHashByUserId"]>()
      .mockResolvedValue(account.passwordHash);
    const changePasswordAndRevokeSessions = vi.fn<PasswordResetStore["changePasswordAndRevokeSessions"]>()
      .mockResolvedValue(undefined);
    const deleteExpiredSessions = vi.fn<PasswordResetStore["deleteExpiredSessions"]>()
      .mockResolvedValue(undefined);
    const findPasswordResetAccountByEmail = vi.fn<PasswordResetStore["findPasswordResetAccountByEmail"]>()
      .mockResolvedValue({
        userId: account.userId,
        email: account.email,
        displayName: account.displayName,
        organizationId: account.organizationId,
        organizationName: account.organizationName,
      });
    const createPasswordResetToken = vi.fn<PasswordResetStore["createPasswordResetToken"]>()
      .mockResolvedValue(undefined);
    const findPasswordResetByTokenHash = vi.fn<PasswordResetStore["findPasswordResetByTokenHash"]>()
      .mockResolvedValue({
        id: "reset-token-id",
        userId: account.userId,
        email: account.email,
        displayName: account.displayName,
        organizationId: account.organizationId,
      });
    const resetPasswordAndRevokeSessions = vi.fn<PasswordResetStore["resetPasswordAndRevokeSessions"]>()
      .mockResolvedValue(undefined);
    const store: PasswordResetStore = {
      ...fakes.store,
      findPasswordHashByUserId,
      changePasswordAndRevokeSessions,
      deleteExpiredSessions,
      findPasswordResetAccountByEmail,
      createPasswordResetToken,
      findPasswordResetByTokenHash,
      resetPasswordAndRevokeSessions,
    };
    return {
      ...fakes,
      store,
      findPasswordHashByUserId,
      changePasswordAndRevokeSessions,
      findPasswordResetAccountByEmail,
      createPasswordResetToken,
      findPasswordResetByTokenHash,
      resetPasswordAndRevokeSessions,
    };
  }

  it("changes the password, revokes existing sessions, and returns a rotated session", async () => {
    const fakes = createPasswordStore(principal);
    const service = new PasswordService(fakes.store, 12 * 60 * 60 * 1_000);
    const now = new Date("2030-01-01T00:00:00.000Z");

    const result = await service.changePassword(principal, password, "a-new-valid-password", {
      ipAddress: "127.0.0.1",
      userAgent: "test",
      requestId: "request-id",
    }, now);

    expect(result.principal).toBe(principal);
    expect(fakes.findPasswordHashByUserId).toHaveBeenCalledWith(principal.user.id);
    expect(fakes.changePasswordAndRevokeSessions).toHaveBeenCalledWith(
      principal,
      expect.stringContaining("$argon2id$"),
      "request-id",
      now,
    );
    expect(fakes.createSession).toHaveBeenCalledOnce();
  });

  it("rejects an incorrect current password without changing stored credentials", async () => {
    const fakes = createPasswordStore(principal);
    const service = new PasswordService(fakes.store, 12 * 60 * 60 * 1_000);

    await expect(service.changePassword(principal, "wrong-password", "a-new-valid-password", {
      ipAddress: null,
      userAgent: null,
      requestId: "request-id",
    })).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CURRENT_PASSWORD" });

    expect(fakes.changePasswordAndRevokeSessions).not.toHaveBeenCalled();
    expect(fakes.createSession).not.toHaveBeenCalled();
  });
  it("creates and emails a single-use password reset token", async () => {
    const fakes = createPasswordStore(principal);
    const emailService = new EmailService();
    const sendPasswordReset = vi.spyOn(emailService, "sendPasswordReset").mockResolvedValue(undefined);
    const service = new PasswordService(fakes.store, 12 * 60 * 60 * 1_000, emailService);
    const now = new Date("2030-01-01T00:00:00.000Z");

    await service.requestPasswordReset(account.email, {
      ipAddress: "127.0.0.1",
      userAgent: "test",
      requestId: "request-id",
    }, now);

    expect(fakes.createPasswordResetToken).toHaveBeenCalledOnce();
    const storedToken = fakes.createPasswordResetToken.mock.calls[0]?.[0];
    expect(storedToken?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedToken?.expiresAt.toISOString()).toBe("2030-01-01T01:00:00.000Z");
    const emailParams = sendPasswordReset.mock.calls[0]?.[0];
    expect(emailParams).toBeDefined();
    expect(emailParams?.email).toBe(account.email);
    expect(emailParams?.resetLink).toContain("/reset-password?token=");
    expect(emailParams?.expiresInMinutes).toBe(60);
  });

  it("does not reveal whether a password reset email exists", async () => {
    const fakes = createPasswordStore(principal);
    fakes.findPasswordResetAccountByEmail.mockResolvedValueOnce(null);
    const emailService = new EmailService();
    const sendPasswordReset = vi.spyOn(emailService, "sendPasswordReset").mockResolvedValue(undefined);
    const service = new PasswordService(fakes.store, 12 * 60 * 60 * 1_000, emailService);

    await expect(service.requestPasswordReset("missing@example.com", {
      ipAddress: null,
      userAgent: null,
      requestId: "request-id",
    })).resolves.toBeUndefined();

    expect(fakes.createPasswordResetToken).not.toHaveBeenCalled();
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it("resets a password with a valid reset token and revokes existing sessions", async () => {
    const fakes = createPasswordStore(principal);
    const service = new PasswordService(fakes.store, 12 * 60 * 60 * 1_000);
    const now = new Date("2030-01-01T00:00:00.000Z");

    await service.resetPassword("a-secure-password-reset-token-with-enough-entropy", "a-new-valid-password", {
      ipAddress: "127.0.0.1",
      userAgent: "test",
      requestId: "request-id",
    }, now);

    expect(fakes.findPasswordResetByTokenHash).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/), now);
    const resetParams = fakes.resetPasswordAndRevokeSessions.mock.calls[0]?.[0];
    expect(resetParams).toEqual(expect.objectContaining({
      tokenId: "reset-token-id",
      userId: account.userId,
      organizationId: account.organizationId,
      requestId: "request-id",
      resetAt: now,
    }));
    expect(resetParams?.passwordHash).toContain("$argon2id$");
  });

  it("rejects an invalid password reset token", async () => {
    const fakes = createPasswordStore(principal);
    fakes.findPasswordResetByTokenHash.mockResolvedValueOnce(null);
    const service = new PasswordService(fakes.store, 12 * 60 * 60 * 1_000);

    await expect(service.resetPassword("an-invalid-password-reset-token-with-enough-entropy", "a-new-valid-password", {
      ipAddress: null,
      userAgent: null,
      requestId: "request-id",
    })).rejects.toMatchObject({ statusCode: 400, code: "INVALID_PASSWORD_RESET_TOKEN" });

    expect(fakes.resetPasswordAndRevokeSessions).not.toHaveBeenCalled();
  });
});



