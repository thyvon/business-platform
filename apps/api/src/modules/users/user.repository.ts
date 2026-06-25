import type { UserListQuery, UserListResponse } from "@business/contracts";
import type { Database } from "@business/database";
import {
  membershipRoles,
  organizationMemberships,
  roles,
  users,
} from "@business/database";
import { and, asc, countDistinct, desc, eq, inArray, like, or, sql } from "drizzle-orm";

type UserSort = UserListQuery["sort"];
type SortDirection = UserListQuery["direction"];

const sortableColumns = {
  displayName: users.displayName,
  email: users.email,
  status: users.status,
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

    if (query.status) filters.push(eq(users.status, query.status));
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
}