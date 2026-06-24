import type { PermissionKey } from "@business/contracts";

export interface AuthenticatedRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export interface AuthenticatedPrincipal {
  sessionId: string;
  user: { id: string; email: string; displayName: string };
  organization: { id: string; name: string };
  membershipId: string;
  roles: readonly AuthenticatedRole[];
  permissions: ReadonlySet<PermissionKey>;
  expiresAt: Date;
}

export interface LoginAccount {
  userId: string;
  email: string;
  displayName: string;
  passwordHash: string;
  organizationId: string;
  organizationName: string;
  membershipId: string;
}

export interface NewSession {
  id: string;
  userId: string;
  organizationId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string;
  createdAt: Date;
}

export interface SessionPrincipalStore {
  findByTokenHash(tokenHash: string, now: Date): Promise<AuthenticatedPrincipal | null>;
}

export interface LoginSessionStore extends SessionPrincipalStore {
  findLoginAccountByEmail(email: string): Promise<LoginAccount | null>;
  createSession(session: NewSession): Promise<void>;
  revokeSession(principal: AuthenticatedPrincipal, requestId: string, revokedAt: Date): Promise<void>;
}