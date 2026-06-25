import { randomUUID } from "node:crypto";
import type { UserDetailResponse, UserListQuery, UserListResponse } from "@business/contracts";
import type { Database } from "@business/database";
import {
  auditEvents,
  membershipRoles,
  organizationMemberships,
  roles,
  sessions,
  users,
} from "@business/database";
import { and, asc, countDistinct, desc, eq, inArray, like, or, sql } from "drizzle-orm";

type UserSort = UserListQuery["sort"];
type SortDirection = UserListQuery["direction"];

const sortableColumns = {
  displayName: users.displayName,
  email: users.email,
  status: organizationMemberships.status,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
} as const;

function orderBy(sort: UserSort, direction: SortDirection) {
  const column = sortableColumns[sort];
  return direction === "desc" ? desc(column) : asc(column);
}

function toIsoDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export class UserRepository {
  constructor(private readonly database: Database["db"]) {}

  async listByOrganization(organizationId: string, query: UserListQuery): Promise<UserListResponse> {
    const search = query.search?.trim().toLowerCase();
    const filters = [eq(organizationMemberships.organizationId, organizationId)];

    if (query.status) filters.push(eq(organizationMemberships.status, query.status));
    if (query.roleId) filters.push(eq(membershipRoles.roleId, query.roleId));
    if (search) {
      const pattern = `%${search}%`;
      filters.push(or(
        like(sql`lower(${users.displayName})`, pattern),
        like(sql`lower(${users.email})`, pattern),
      )!);
    }

    const where = and(...filters);
    const [{ total = 0 } = { total: 0 }] = await this.database
      .select({ total: countDistinct(users.id) })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .leftJoin(membershipRoles, eq(membershipRoles.membershipId, organizationMemberships.id))
      .where(where);

    const totalCount = Number(total);
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);
    const offset = (query.page - 1) * query.pageSize;

    const rows = await this.database
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        membershipStatus: organizationMemberships.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .leftJoin(membershipRoles, eq(membershipRoles.membershipId, organizationMemberships.id))
      .where(where)
      .groupBy(
        users.id,
        users.email,
        users.displayName,
        users.status,
        organizationMemberships.status,
        users.lastLoginAt,
        users.createdAt,
      )
      .orderBy(orderBy(query.sort, query.direction), asc(users.id))
      .limit(query.pageSize)
      .offset(offset);

    const userIds = rows.map((row) => row.id);
    const roleRows = userIds.length === 0
      ? []
      : await this.database
        .select({
          userId: organizationMemberships.userId,
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
        })
        .from(organizationMemberships)
        .innerJoin(membershipRoles, eq(membershipRoles.membershipId, organizationMemberships.id))
        .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
        .where(and(
          eq(organizationMemberships.organizationId, organizationId),
          inArray(organizationMemberships.userId, userIds),
        ))
        .orderBy(asc(roles.name));

    const rolesByUser = new Map<string, Array<{ id: string; name: string; description: string; isSystem: boolean }>>();
    for (const role of roleRows) {
      const current = rolesByUser.get(role.userId) ?? [];
      current.push({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      });
      rolesByUser.set(role.userId, current);
    }

    return {
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        status: row.status,
        membershipStatus: row.membershipStatus,
        roles: rolesByUser.get(row.id) ?? [],
        lastLoginAt: toIsoDate(row.lastLoginAt),
        createdAt: row.createdAt.toISOString(),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total: totalCount,
      totalPages,
    };
  }

  async getById(organizationId: string, userId: string): Promise<UserDetailResponse | null> {
    const rows = await this.database
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        membershipStatus: organizationMemberships.status,
        membershipId: organizationMemberships.id,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.userId, userId),
      ))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const roleRows = await this.database
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .where(eq(membershipRoles.membershipId, row.membershipId))
      .orderBy(asc(roles.name));

    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      status: row.status,
      membershipStatus: row.membershipStatus,
      membershipId: row.membershipId,
      roles: roleRows,
      lastLoginAt: toIsoDate(row.lastLoginAt),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateUser(userId: string, displayName: string): Promise<void> {
    await this.database
      .update(users)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateMembershipStatus(membershipId: string, status: "active" | "suspended"): Promise<void> {
    await this.database
      .update(organizationMemberships)
      .set({ status, updatedAt: new Date() })
      .where(eq(organizationMemberships.id, membershipId));
  }

  async updateUserStatus(userId: string, status: "active" | "suspended"): Promise<void> {
    await this.database
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async findRoleIdsByOrganization(organizationId: string, roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];

    const rows = await this.database
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.organizationId, organizationId), inArray(roles.id, roleIds)));

    return rows.map((row) => row.id);
  }

  async assignRoles(membershipId: string, roleIds: string[]): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .delete(membershipRoles)
        .where(eq(membershipRoles.membershipId, membershipId));

      if (roleIds.length > 0) {
        await transaction.insert(membershipRoles).values(
          roleIds.map((roleId) => ({
            membershipId,
            roleId,
          })),
        );
      }
    });
  }

  async revokeUserSessions(userId: string, organizationId: string): Promise<void> {
    await this.database
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.organizationId, organizationId),
        sql`${sessions.revokedAt} IS NULL`,
      ));
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




