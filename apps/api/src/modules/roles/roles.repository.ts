import { randomUUID } from "node:crypto";
import type { Database } from "@business/database";
import { auditEvents, permissions, rolePermissions, roles } from "@business/database";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

export class RolesRepository {
  constructor(private readonly database: Database["db"]) {}

  async listByOrganization(organizationId: string) {
    return this.database
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        memberCount: sql<number>`CAST(COUNT(DISTINCT membership_roles.membership_id) AS UNSIGNED)`,
      })
      .from(roles)
      .leftJoin(
        sql`membership_roles`,
        sql`membership_roles.role_id = ${roles.id}`,
      )
      .where(eq(roles.organizationId, organizationId))
      .groupBy(roles.id, roles.name, roles.description, roles.isSystem)
      .orderBy(asc(roles.name));
  }

  async getById(organizationId: string, roleId: string) {
    const rows = await this.database
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
      })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async getPermissionsByRoleId(roleId: string) {
    return this.database
      .select({
        id: permissions.id,
        key: permissions.key,
        module: permissions.module,
        description: permissions.description,
      })
      .from(permissions)
      .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId))
      .orderBy(asc(permissions.key));
  }

  async listAllPermissions() {
    return this.database
      .select({
        id: permissions.id,
        key: permissions.key,
        module: permissions.module,
        description: permissions.description,
      })
      .from(permissions)
      .orderBy(asc(permissions.module), asc(permissions.key));
  }

  async getMemberCount(roleId: string): Promise<number> {
    const rows = await this.database
      .select({
        count: sql<number>`CAST(COUNT(*) AS UNSIGNED)`,
      })
      .from(sql`membership_roles`)
      .where(eq(sql`membership_roles.role_id`, roleId));

    return rows[0]?.count ?? 0;
  }

  async create(
    organizationId: string,
    data: { name: string; description: string; permissionIds: string[] },
  ): Promise<string> {
    const roleId = randomUUID();
    await this.database.transaction(async (transaction) => {
      await transaction.insert(roles).values({
        id: roleId,
        organizationId,
        name: data.name,
        description: data.description,
        isSystem: false,
      });

      if (data.permissionIds.length > 0) {
        await transaction.insert(rolePermissions).values(
          data.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        );
      }
    });
    return roleId;
  }

  async update(
    roleId: string,
    data: { name?: string; description?: string },
  ): Promise<void> {
    await this.database
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roles.id, roleId));
  }

  async delete(roleId: string): Promise<void> {
    await this.database
      .delete(roles)
      .where(eq(roles.id, roleId));
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      if (permissionIds.length > 0) {
        await transaction.insert(rolePermissions).values(
          permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        );
      }
    });
  }

  async resolvePermissionIds(keys: string[]): Promise<string[]> {
    const rows = await this.database
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.key, keys));

    return rows.map((r) => r.id);
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
