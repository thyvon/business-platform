import type { AssignUserRolesInput, UpdateUserInput, UserDetailResponse, UserListQuery } from "@business/contracts";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedPrincipal } from "../auth/auth.types.js";
import type { UserRepository } from "./user.repository.js";

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  list(principal: AuthenticatedPrincipal, query: UserListQuery) {
    return this.repository.listByOrganization(principal.organization.id, query);
  }

  async get(principal: AuthenticatedPrincipal, userId: string): Promise<UserDetailResponse> {
    const user = await this.repository.getById(principal.organization.id, userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user could not be found.");
    return user;
  }

  async update(
    principal: AuthenticatedPrincipal,
    userId: string,
    input: UpdateUserInput,
    requestId: string,
  ): Promise<void> {
    const user = await this.repository.getById(principal.organization.id, userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user could not be found.");

    if (input.displayName) {
      await this.repository.updateUser(userId, input.displayName);
    }

    await this.repository.createAuditEvent({
      organizationId: principal.organization.id,
      actorUserId: principal.user.id,
      action: "user.updated",
      targetType: "user",
      targetId: userId,
      requestId,
      metadata: { changes: input },
    });
  }

  async suspend(
    principal: AuthenticatedPrincipal,
    userId: string,
    requestId: string,
  ): Promise<void> {
    if (userId === principal.user.id) {
      throw new AppError(400, "SELF_SUSPENSION", "You cannot suspend yourself.");
    }

    const user = await this.repository.getById(principal.organization.id, userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user could not be found.");

    await this.repository.updateMembershipStatus(user.membershipId, "suspended");
    await this.repository.revokeUserSessions(userId, principal.organization.id);

    await this.repository.createAuditEvent({
      organizationId: principal.organization.id,
      actorUserId: principal.user.id,
      action: "user.suspended",
      targetType: "user",
      targetId: userId,
      requestId,
    });
  }

  async reactivate(
    principal: AuthenticatedPrincipal,
    userId: string,
    requestId: string,
  ): Promise<void> {
    if (userId === principal.user.id) {
      throw new AppError(400, "SELF_REACTIVATION", "You cannot reactivate yourself.");
    }

    const user = await this.repository.getById(principal.organization.id, userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user could not be found.");

    await this.repository.updateMembershipStatus(user.membershipId, "active");

    await this.repository.createAuditEvent({
      organizationId: principal.organization.id,
      actorUserId: principal.user.id,
      action: "user.reactivated",
      targetType: "user",
      targetId: userId,
      requestId,
    });
  }

  async assignRoles(
    principal: AuthenticatedPrincipal,
    userId: string,
    input: AssignUserRolesInput,
    requestId: string,
  ): Promise<void> {
    const user = await this.repository.getById(principal.organization.id, userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user could not be found.");

    const validRoleIds = await this.repository.findRoleIdsByOrganization(principal.organization.id, input.roleIds);
    if (validRoleIds.length !== input.roleIds.length) {
      throw new AppError(400, "INVALID_ROLE_IDS", "One or more roles do not belong to this organization.");
    }

    await this.repository.assignRoles(user.membershipId, input.roleIds);

    await this.repository.createAuditEvent({
      organizationId: principal.organization.id,
      actorUserId: principal.user.id,
      action: "user.roles.assigned",
      targetType: "user",
      targetId: userId,
      requestId,
      metadata: { roleIds: input.roleIds },
    });
  }

  async revokeSessions(
    principal: AuthenticatedPrincipal,
    userId: string,
    requestId: string,
  ): Promise<void> {
    const user = await this.repository.getById(principal.organization.id, userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user could not be found.");

    await this.repository.revokeUserSessions(userId, principal.organization.id);

    await this.repository.createAuditEvent({
      organizationId: principal.organization.id,
      actorUserId: principal.user.id,
      action: "user.sessions.revoked",
      targetType: "user",
      targetId: userId,
      requestId,
    });
  }
}





