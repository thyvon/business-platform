import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "@business/database";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { EmailService } from "../../shared/email/email.service.js";
import type {
  AuthenticatedPrincipal,
  LoginAccount,
  LoginSessionStore,
  PasswordResetStore,
  SessionPrincipalStore,
} from "./auth.types.js";

const MINIMUM_SESSION_TOKEN_LENGTH = 32;
const MAXIMUM_SESSION_TOKEN_LENGTH = 512;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1_000;
const DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=19456,t=2,p=1$emaEWUFozqFE9TuaGeP5Fg$Gzx+SfokKyiZlgxqE1TWPgDvzKuEho0KH/7ymWJwLEs";

export interface SessionAuthenticator {
  authenticate(token: string, now?: Date): Promise<AuthenticatedPrincipal | null>;
}

export interface LoginMetadata {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string;
}

export interface LoginResult {
  token: string;
  principal: AuthenticatedPrincipal;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export class AuthenticationService implements SessionAuthenticator {
  constructor(private readonly store: SessionPrincipalStore) {}

  authenticate(token: string, now = new Date()): Promise<AuthenticatedPrincipal | null> {
    if (token.length < MINIMUM_SESSION_TOKEN_LENGTH || token.length > MAXIMUM_SESSION_TOKEN_LENGTH) {
      return Promise.resolve(null);
    }
    return this.store.findByTokenHash(hashSessionToken(token), now);
  }
}

export class LoginService {
  constructor(
    protected readonly store: LoginSessionStore,
    protected readonly sessionTtlMs: number,
  ) {}

  async login(
    email: string,
    password: string,
    metadata: LoginMetadata,
    now = new Date(),
  ): Promise<LoginResult> {
    const account = await this.store.findLoginAccountByEmail(email);
    const passwordHash = account?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await verifyPassword(passwordHash, password).catch(() => false);

    if (!account || !passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
    }

    return this.createSession(account, metadata, now);
  }

  logout(principal: AuthenticatedPrincipal, requestId: string, now = new Date()): Promise<void> {
    return this.store.revokeSession(principal, requestId, now);
  }

  protected async createSession(
    account: LoginAccount,
    metadata: LoginMetadata,
    now: Date,
  ): Promise<LoginResult> {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashSessionToken(token);

    await this.store.createSession({
      id: randomUUID(),
      userId: account.userId,
      organizationId: account.organizationId,
      tokenHash,
      expiresAt: new Date(now.getTime() + this.sessionTtlMs),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      requestId: metadata.requestId,
      createdAt: now,
    });

    const principal = await this.store.findByTokenHash(tokenHash, now);
    if (!principal) {
      throw new AppError(500, "SESSION_CREATION_FAILED", "The session could not be created.");
    }

    return { token, principal };
  }
}

export class PasswordService extends LoginService {
  constructor(
    protected readonly store: PasswordResetStore,
    sessionTtlMs: number,
    private readonly emailService?: EmailService,
  ) {
    super(store, sessionTtlMs);
  }

  async changePassword(
    principal: AuthenticatedPrincipal,
    currentPassword: string,
    newPassword: string,
    metadata: LoginMetadata,
    now = new Date(),
  ): Promise<LoginResult> {
    const passwordHash = await this.store.findPasswordHashByUserId(principal.user.id);
    const passwordMatches = passwordHash
      ? await verifyPassword(passwordHash, currentPassword).catch(() => false)
      : false;

    if (!passwordHash || !passwordMatches) {
      throw new AppError(401, "INVALID_CURRENT_PASSWORD", "The current password is incorrect.");
    }

    const newPasswordHash = await hashPassword(newPassword);
    await this.store.changePasswordAndRevokeSessions(
      principal,
      newPasswordHash,
      metadata.requestId,
      now,
    );

    return this.createSession({
      userId: principal.user.id,
      email: principal.user.email,
      displayName: principal.user.displayName,
      passwordHash: newPasswordHash,
      organizationId: principal.organization.id,
      organizationName: principal.organization.name,
      membershipId: principal.membershipId,
    }, metadata, now);
  }

  async requestPasswordReset(email: string, metadata: LoginMetadata, now = new Date()): Promise<void> {
    const account = await this.store.findPasswordResetAccountByEmail(email);
    if (!account) return;

    if (!this.emailService) {
      throw new AppError(500, "EMAIL_SERVICE_UNAVAILABLE", "Password reset email is not configured.");
    }

    const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);

    await this.store.createPasswordResetToken({
      id: randomUUID(),
      userId: account.userId,
      organizationId: account.organizationId,
      tokenHash,
      expiresAt,
      requestId: metadata.requestId,
      createdAt: now,
    });

    await this.emailService.sendPasswordReset({
      email: account.email,
      displayName: account.displayName,
      organizationName: account.organizationName,
      resetLink: `${env.webOrigin}/reset-password?token=${token}`,
      expiresInMinutes: Math.round(PASSWORD_RESET_TTL_MS / 60_000),
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
    metadata: LoginMetadata,
    now = new Date(),
  ): Promise<void> {
    const reset = await this.store.findPasswordResetByTokenHash(hashSessionToken(token), now);

    if (!reset) {
      throw new AppError(400, "INVALID_PASSWORD_RESET_TOKEN", "The password reset link is invalid or expired.");
    }

    const passwordHash = await hashPassword(newPassword);
    await this.store.resetPasswordAndRevokeSessions({
      tokenId: reset.id,
      userId: reset.userId,
      organizationId: reset.organizationId,
      passwordHash,
      requestId: metadata.requestId,
      resetAt: now,
    });
  }
}


