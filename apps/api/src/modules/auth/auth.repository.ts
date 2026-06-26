import { randomUUID } from "node:crypto";
import type { PermissionKey } from "@business/contracts";
import { permissionKeySchema } from "@business/contracts";
import type { Database } from "@business/database";
import {
  auditEvents,
  membershipRoles,
  organizationMemberships,
  organizations,
  passwordResetTokens,
  permissions,
  rolePermissions,
  roles,
  sessions,
  users,
} from "@business/database";
import { and, asc, eq, gt, isNull, lt, lte, or } from "drizzle-orm";
import type {
  AuthenticatedPrincipal,
  AuthenticatedRole,
  LoginAccount,
  NewPasswordResetToken,
  NewSession,
  PasswordResetAccount,
  PasswordResetRecord,
  PasswordResetStore,
} from "./auth.types.js";

export class AuthRepository implements PasswordResetStore {
  constructor(private readonly database: Database["db"]) {}

  async findLoginAccountByEmail(email: string): Promise<LoginAccount | null> {
    const rows = await this.database
      .select({
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
        passwordHash: users.passwordHash,
        organizationId: organizations.id,
        organizationName: organizations.name,
        membershipId: organizationMemberships.id,
      })
      .from(users)
      .innerJoin(
        organizationMemberships,
        and(
          eq(organizationMemberships.userId, users.id),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .innerJoin(
        organizations,
        and(
          eq(organizations.id, organizationMemberships.organizationId),
          eq(organizations.status, "active"),
        ),
      )
      .where(and(eq(users.email, email), eq(users.status, "active")))
      .orderBy(asc(organizationMemberships.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }

  async createSession(session: NewSession): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction.insert(sessions).values({
        id: session.id,
        userId: session.userId,
        organizationId: session.organizationId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        lastSeenAt: session.createdAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
      });

      await transaction
        .update(users)
        .set({ lastLoginAt: session.createdAt })
        .where(eq(users.id, session.userId));

      await transaction.insert(auditEvents).values({
        id: randomUUID(),
        organizationId: session.organizationId,
        actorUserId: session.userId,
        action: "auth.login.succeeded",
        targetType: "session",
        targetId: session.id,
        requestId: session.requestId,
        metadata: { source: "password" },
        createdAt: session.createdAt,
      });
    });
  }

  async revokeSession(
    principal: AuthenticatedPrincipal,
    requestId: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(sessions)
        .set({ revokedAt })
        .where(and(eq(sessions.id, principal.sessionId), isNull(sessions.revokedAt)));

      await transaction.insert(auditEvents).values({
        id: randomUUID(),
        organizationId: principal.organization.id,
        actorUserId: principal.user.id,
        action: "auth.logout",
        targetType: "session",
        targetId: principal.sessionId,
        requestId,
        createdAt: revokedAt,
      });
    });
  }

  async updateUserProfile(userId: string, displayName: string): Promise<void> {
    await this.database
      .update(users)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async findPasswordHashByUserId(userId: string): Promise<string | null> {
    const rows = await this.database
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.status, "active")))
      .limit(1);

    return rows[0]?.passwordHash ?? null;
  }

  async changePasswordAndRevokeSessions(
    principal: AuthenticatedPrincipal,
    passwordHash: string,
    requestId: string,
    changedAt: Date,
  ): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(users)
        .set({ passwordHash, passwordChangedAt: changedAt, updatedAt: changedAt })
        .where(eq(users.id, principal.user.id));

      await transaction
        .update(sessions)
        .set({ revokedAt: changedAt })
        .where(and(eq(sessions.userId, principal.user.id), isNull(sessions.revokedAt)));

      await transaction.insert(auditEvents).values({
        id: randomUUID(),
        organizationId: principal.organization.id,
        actorUserId: principal.user.id,
        action: "auth.password.changed",
        targetType: "user",
        targetId: principal.user.id,
        requestId,
        createdAt: changedAt,
      });
    });
  }

  async findPasswordResetAccountByEmail(email: string): Promise<PasswordResetAccount | null> {
    const rows = await this.database
      .select({
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
        organizationId: organizations.id,
        organizationName: organizations.name,
      })
      .from(users)
      .innerJoin(
        organizationMemberships,
        and(
          eq(organizationMemberships.userId, users.id),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .innerJoin(
        organizations,
        and(
          eq(organizations.id, organizationMemberships.organizationId),
          eq(organizations.status, "active"),
        ),
      )
      .where(and(eq(users.email, email), eq(users.status, "active")))
      .orderBy(asc(organizationMemberships.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }

  async createPasswordResetToken(token: NewPasswordResetToken): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction.insert(passwordResetTokens).values({
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      });

      await transaction.insert(auditEvents).values({
        id: randomUUID(),
        organizationId: token.organizationId,
        actorUserId: token.userId,
        action: "auth.password_reset.requested",
        targetType: "user",
        targetId: token.userId,
        requestId: token.requestId,
        createdAt: token.createdAt,
      });
    });
  }

  async findPasswordResetByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetRecord | null> {
    const rows = await this.database
      .select({
        id: passwordResetTokens.id,
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
        organizationId: organizations.id,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .innerJoin(
        organizationMemberships,
        and(
          eq(organizationMemberships.userId, users.id),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .innerJoin(
        organizations,
        and(
          eq(organizations.id, organizationMemberships.organizationId),
          eq(organizations.status, "active"),
        ),
      )
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
        eq(users.status, "active"),
      ))
      .orderBy(asc(organizationMemberships.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }

  async resetPasswordAndRevokeSessions(params: {
    tokenId: string;
    userId: string;
    organizationId: string;
    passwordHash: string;
    requestId: string;
    resetAt: Date;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(passwordResetTokens)
        .set({ usedAt: params.resetAt })
        .where(and(eq(passwordResetTokens.id, params.tokenId), isNull(passwordResetTokens.usedAt)));

      await transaction
        .update(users)
        .set({
          passwordHash: params.passwordHash,
          passwordChangedAt: params.resetAt,
          updatedAt: params.resetAt,
        })
        .where(eq(users.id, params.userId));

      await transaction
        .update(sessions)
        .set({ revokedAt: params.resetAt })
        .where(and(eq(sessions.userId, params.userId), isNull(sessions.revokedAt)));

      await transaction.insert(auditEvents).values({
        id: randomUUID(),
        organizationId: params.organizationId,
        actorUserId: params.userId,
        action: "auth.password_reset.completed",
        targetType: "user",
        targetId: params.userId,
        requestId: params.requestId,
        createdAt: params.resetAt,
      });
    });
  }

  async deleteExpiredSessions(now: Date): Promise<void> {
    await this.database
      .delete(sessions)
      .where(lt(sessions.expiresAt, now));
  }

  async findByTokenHash(tokenHash: string, now: Date): Promise<AuthenticatedPrincipal | null> {
    const rows = await this.database
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        userEmail: users.email,
        userDisplayName: users.displayName,
        organizationId: organizations.id,
        organizationName: organizations.name,
        membershipId: organizationMemberships.id,
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
        roleIsSystem: roles.isSystem,
        permissionKey: permissions.key,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .innerJoin(organizations, eq(organizations.id, sessions.organizationId))
      .innerJoin(
        organizationMemberships,
        and(
          eq(organizationMemberships.userId, sessions.userId),
          eq(organizationMemberships.organizationId, sessions.organizationId),
        ),
      )
      .leftJoin(membershipRoles, eq(membershipRoles.membershipId, organizationMemberships.id))
      .leftJoin(
        roles,
        and(eq(roles.id, membershipRoles.roleId), eq(roles.organizationId, sessions.organizationId)),
      )
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        eq(users.status, "active"),
        eq(organizations.status, "active"),
        eq(organizationMemberships.status, "active"),
        or(isNull(users.passwordChangedAt), lte(users.passwordChangedAt, sessions.createdAt)),
      ));

    const first = rows[0];
    if (!first) return null;

    const roleMap = new Map<string, AuthenticatedRole>();
    const effectivePermissions = new Set<PermissionKey>();

    for (const row of rows) {
      if (row.roleId && row.roleName !== null && row.roleDescription !== null && row.roleIsSystem !== null) {
        roleMap.set(row.roleId, {
          id: row.roleId,
          name: row.roleName,
          description: row.roleDescription,
          isSystem: row.roleIsSystem,
        });
      }

      const parsedPermission = permissionKeySchema.safeParse(row.permissionKey);
      if (parsedPermission.success) effectivePermissions.add(parsedPermission.data);
    }

    return {
      sessionId: first.sessionId,
      user: {
        id: first.userId,
        email: first.userEmail,
        displayName: first.userDisplayName,
      },
      organization: {
        id: first.organizationId,
        name: first.organizationName,
      },
      membershipId: first.membershipId,
      roles: [...roleMap.values()],
      permissions: effectivePermissions,
      expiresAt: first.expiresAt,
    };
  }
}
