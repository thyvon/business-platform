import { randomUUID } from "node:crypto";
import type { Database } from "@business/database";
import {
  auditEvents,
  invitationRoles,
  membershipRoles,
  organizationMemberships,
  userInvitations,
  users,
} from "@business/database";
import { and, asc, eq, gt, isNull } from "drizzle-orm";

export interface InvitationRow {
  id: string;
  organizationId: string;
  email: string;
  tokenHash: string;
  invitedByUserId: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export class InvitationRepository {
  constructor(private readonly database: Database["db"]) {}

  async create(params: {
    id: string;
    organizationId: string;
    email: string;
    tokenHash: string;
    invitedByUserId: string | null;
    expiresAt: Date;
    roleIds: string[];
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction.insert(userInvitations).values({
        id: params.id,
        organizationId: params.organizationId,
        email: params.email,
        tokenHash: params.tokenHash,
        invitedByUserId: params.invitedByUserId,
        expiresAt: params.expiresAt,
      });

      if (params.roleIds.length > 0) {
        await transaction.insert(invitationRoles).values(
          params.roleIds.map((roleId) => ({
            invitationId: params.id,
            roleId,
          })),
        );
      }
    });
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationRow | null> {
    const rows = await this.database
      .select()
      .from(userInvitations)
      .where(and(
        eq(userInvitations.tokenHash, tokenHash),
        isNull(userInvitations.acceptedAt),
        isNull(userInvitations.revokedAt),
        gt(userInvitations.expiresAt, new Date()),
      ))
      .limit(1);

    return rows[0] ?? null;
  }

  async getInvitationRoles(invitationId: string): Promise<string[]> {
    const rows = await this.database
      .select({ roleId: invitationRoles.roleId })
      .from(invitationRoles)
      .where(eq(invitationRoles.invitationId, invitationId));

    return rows.map((r) => r.roleId);
  }

  async markAccepted(invitationId: string, acceptedAt: Date): Promise<void> {
    await this.database
      .update(userInvitations)
      .set({ acceptedAt })
      .where(eq(userInvitations.id, invitationId));
  }

  async getOrganizationIdByInvitation(invitationId: string): Promise<string | null> {
    const rows = await this.database
      .select({ organizationId: userInvitations.organizationId })
      .from(userInvitations)
      .where(eq(userInvitations.id, invitationId))
      .limit(1);

    return rows[0]?.organizationId ?? null;
  }

  async createUser(email: string, displayName: string, passwordHash: string): Promise<string> {
    const userId = randomUUID();
    await this.database.insert(users).values({
      id: userId,
      email,
      displayName,
      passwordHash,
      status: "active",
    });
    return userId;
  }

  async findUserByEmail(email: string): Promise<string | null> {
    const rows = await this.database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return rows[0]?.id ?? null;
  }

  async createMembership(userId: string, organizationId: string): Promise<string> {
    const membershipId = randomUUID();
    await this.database.insert(organizationMemberships).values({
      id: membershipId,
      userId,
      organizationId,
      status: "active",
    });
    return membershipId;
  }

  async assignMembershipRoles(membershipId: string, roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) return;

    await this.database.insert(membershipRoles).values(
      roleIds.map((roleId) => ({
        membershipId,
        roleId,
      })),
    );
  }

  async listPendingByOrganization(organizationId: string): Promise<Array<{
    id: string;
    email: string;
    invitedByUserId: string | null;
    expiresAt: Date;
    createdAt: Date;
  }>> {
    return this.database
      .select({
        id: userInvitations.id,
        email: userInvitations.email,
        invitedByUserId: userInvitations.invitedByUserId,
        expiresAt: userInvitations.expiresAt,
        createdAt: userInvitations.createdAt,
      })
      .from(userInvitations)
      .where(and(
        eq(userInvitations.organizationId, organizationId),
        isNull(userInvitations.acceptedAt),
        isNull(userInvitations.revokedAt),
      ))
      .orderBy(asc(userInvitations.createdAt));
  }

  async createAuditEvent(params: {
    organizationId: string;
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId: string;
    requestId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.database.insert(auditEvents).values({
      id: randomUUID(),
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      requestId: params.requestId,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
    });
  }
}
