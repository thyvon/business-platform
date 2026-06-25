import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedPrincipal } from "../auth/auth.types.js";
import type { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";

const principal: AuthenticatedPrincipal = {
  sessionId: "session-id",
  user: { id: "actor-id", email: "owner@example.com", displayName: "Owner" },
  organization: { id: "organization-id", name: "Example Organization" },
  membershipId: "actor-membership-id",
  roles: [{ id: "owner-role-id", name: "Owner", description: "Owner", isSystem: true }],
  permissions: new Set(["users.roles.assign"]),
  expiresAt: new Date("2030-01-01T12:00:00.000Z"),
};

const userDetail = {
  id: "target-user-id",
  email: "member@example.com",
  displayName: "Member",
  status: "active" as const,
  membershipStatus: "active" as const,
  membershipId: "target-membership-id",
  roles: [],
  lastLoginAt: null,
  createdAt: "2030-01-01T12:00:00.000Z",
};

function createRepository(overrides: {
  findRoleIdsByOrganization?: ReturnType<typeof vi.fn>;
} = {}) {
  const getById = vi.fn().mockResolvedValue(userDetail);
  const findRoleIdsByOrganization = overrides.findRoleIdsByOrganization
    ?? vi.fn().mockResolvedValue(["role-a", "role-b"]);
  const assignRoles = vi.fn().mockResolvedValue(undefined);
  const updateUserStatus = vi.fn().mockResolvedValue(undefined);
  const updateMembershipStatus = vi.fn().mockResolvedValue(undefined);
  const revokeUserSessions = vi.fn().mockResolvedValue(undefined);
  const createAuditEvent = vi.fn().mockResolvedValue(undefined);

  const repository = {
    getById,
    findRoleIdsByOrganization,
    assignRoles,
    updateUserStatus,
    updateMembershipStatus,
    revokeUserSessions,
    createAuditEvent,
  } as unknown as UserRepository;

  return { repository, findRoleIdsByOrganization, assignRoles, updateUserStatus, updateMembershipStatus, revokeUserSessions, createAuditEvent };
}

describe("UserService", () => {
  it("rejects role assignment when any role is outside the organization", async () => {
    const { repository, assignRoles, createAuditEvent } = createRepository({
      findRoleIdsByOrganization: vi.fn().mockResolvedValue(["role-a"]),
    });
    const service = new UserService(repository);

    await expect(service.assignRoles(
      principal,
      "target-user-id",
      { roleIds: ["role-a", "foreign-role"] },
      "request-id",
    )).rejects.toMatchObject({ statusCode: 400, code: "INVALID_ROLE_IDS" });

    expect(assignRoles).not.toHaveBeenCalled();
    expect(createAuditEvent).not.toHaveBeenCalled();
  });

  it("assigns roles after validating every role belongs to the organization", async () => {
    const { repository, findRoleIdsByOrganization, assignRoles, createAuditEvent } = createRepository();
    const service = new UserService(repository);

    await service.assignRoles(
      principal,
      "target-user-id",
      { roleIds: ["role-a", "role-b"] },
      "request-id",
    );

    expect(findRoleIdsByOrganization).toHaveBeenCalledWith("organization-id", ["role-a", "role-b"]);
    expect(assignRoles).toHaveBeenCalledWith("target-membership-id", ["role-a", "role-b"]);
    expect(createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "organization-id",
      action: "user.roles.assigned",
      targetId: "target-user-id",
    }));
  });
  it("suspends only the organization membership", async () => {
    const { repository, updateUserStatus, updateMembershipStatus, revokeUserSessions } = createRepository();
    const service = new UserService(repository);

    await service.suspend(principal, "target-user-id", "request-id");

    expect(updateUserStatus).not.toHaveBeenCalled();
    expect(updateMembershipStatus).toHaveBeenCalledWith("target-membership-id", "suspended");
    expect(revokeUserSessions).toHaveBeenCalledWith("target-user-id", "organization-id");
  });

  it("reactivates only the organization membership", async () => {
    const { repository, updateUserStatus, updateMembershipStatus } = createRepository();
    const service = new UserService(repository);

    await service.reactivate(principal, "target-user-id", "request-id");

    expect(updateUserStatus).not.toHaveBeenCalled();
    expect(updateMembershipStatus).toHaveBeenCalledWith("target-membership-id", "active");
  });
});

