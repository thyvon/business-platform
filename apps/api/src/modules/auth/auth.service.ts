import { createHash, randomBytes, randomUUID } from "node:crypto";
import { verifyPassword } from "@business/database";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  AuthenticatedPrincipal,
  LoginAccount,
  LoginSessionStore,
  SessionPrincipalStore,
} from "./auth.types.js";

const MINIMUM_SESSION_TOKEN_LENGTH = 32;
const MAXIMUM_SESSION_TOKEN_LENGTH = 512;
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
    private readonly store: LoginSessionStore,
    private readonly sessionTtlMs: number,
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

  private async createSession(
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