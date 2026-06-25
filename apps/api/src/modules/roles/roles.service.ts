import type { CreateRoleInput, UpdateRoleInput } from "@business/contracts";
import { AppError } from "../../shared/errors/app-error.js";
import type { RolesRepository } from "./roles.repository.js";

export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  list(organizationId: string) {
    return this.repository.listByOrganization(organizationId);
  }

  async get(organizationId: string, roleId: string) {
    const role = await this.repository.getById(organizationId, roleId);
    if (!role) return null;

    const [permissions, memberCount] = await Promise.all([
      this.repository.getPermissionsByRoleId(roleId),
      this.repository.getMemberCount(roleId),
    ]);

    return { ...role, permissions, memberCount };
  }

  listPermissions() {
    return this.repository.listAllPermissions();
  }

  async create(
    organizationId: string,
    actorUserId: string | null,
    requestId: string,
    input: CreateRoleInput,
  ) {
    const permissionIds = await this.repository.resolvePermissionIds(input.permissionKeys);
    if (permissionIds.length !== input.permissionKeys.length) {
      throw new AppError(400, "INVALID_PERMISSIONS", "One or more permission keys are invalid.");
    }

    const roleId = await this.repository.create(organizationId, {
      name: input.name,
      description: input.description,
      permissionIds,
    });

    await this.repository.createAuditEvent({
      organizationId,
      actorUserId,
      action: "role.created",
      targetType: "role",
      targetId: roleId,
      requestId,
      metadata: { name: input.name, permissionKeys: input.permissionKeys },
    });

    return roleId;
  }

  async update(
    organizationId: string,
    roleId: string,
    actorUserId: string | null,
    requestId: string,
    input: UpdateRoleInput,
  ) {
    const role = await this.repository.getById(organizationId, roleId);
    if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "The role could not be found.");
    if (role.isSystem) throw new AppError(403, "SYSTEM_ROLE", "System roles cannot be modified.");

    const updateData: { name?: string; description?: string } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(roleId, updateData);
    }

    if (input.permissionKeys !== undefined) {
      const permissionIds = await this.repository.resolvePermissionIds(input.permissionKeys);
      if (permissionIds.length !== input.permissionKeys.length) {
        throw new AppError(400, "INVALID_PERMISSIONS", "One or more permission keys are invalid.");
      }
      await this.repository.setPermissions(roleId, permissionIds);
    }

    await this.repository.createAuditEvent({
      organizationId,
      actorUserId,
      action: "role.updated",
      targetType: "role",
      targetId: roleId,
      requestId,
      metadata: { ...updateData, permissionKeys: input.permissionKeys },
    });
  }

  async delete(
    organizationId: string,
    roleId: string,
    actorUserId: string | null,
    requestId: string,
  ) {
    const role = await this.repository.getById(organizationId, roleId);
    if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "The role could not be found.");
    if (role.isSystem) throw new AppError(403, "SYSTEM_ROLE", "System roles cannot be deleted.");

    const memberCount = await this.repository.getMemberCount(roleId);
    if (memberCount > 0) throw new AppError(409, "ROLE_HAS_MEMBERS", `The role is assigned to ${memberCount} member(s) and cannot be deleted.`);

    await this.repository.delete(roleId);

    await this.repository.createAuditEvent({
      organizationId,
      actorUserId,
      action: "role.deleted",
      targetType: "role",
      targetId: roleId,
      requestId,
      metadata: { name: role.name },
    });
  }

  async setPermissions(
    organizationId: string,
    roleId: string,
    actorUserId: string | null,
    requestId: string,
    permissionKeys: string[],
  ) {
    const role = await this.repository.getById(organizationId, roleId);
    if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "The role could not be found.");
    if (role.isSystem) throw new AppError(403, "SYSTEM_ROLE", "System roles cannot be modified.");

    const permissionIds = await this.repository.resolvePermissionIds(permissionKeys);
    if (permissionIds.length !== permissionKeys.length) {
      throw new AppError(400, "INVALID_PERMISSIONS", "One or more permission keys are invalid.");
    }

    await this.repository.setPermissions(roleId, permissionIds);

    await this.repository.createAuditEvent({
      organizationId,
      actorUserId,
      action: "role.permissions.updated",
      targetType: "role",
      targetId: roleId,
      requestId,
      metadata: { permissionKeys },
    });
  }
}
