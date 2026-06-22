import { describe, expect, it } from "vitest";
import {
  assignUserRolesSchema,
  changePasswordSchema,
  createRoleSchema,
  currentUserSchema,
  inviteUserSchema,
  loginSchema,
  permissionDefinitions,
  permissionKeys,
  updateRoleSchema,
  userListQuerySchema,
} from "./auth.js";

const roleId = "60df5cd7-8ca6-4f33-88a6-f4486f9b159c";

describe("authentication contracts", () => {
  it("normalizes an email without modifying the password", () => {
    const result = loginSchema.parse({
      email: "  Owner@Example.COM ",
      password: " password with spaces ",
    });

    expect(result.email).toBe("owner@example.com");
    expect(result.password).toBe(" password with spaces ");
  });

  it("requires a different password with at least 12 characters", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "existing-password",
      newPassword: "short",
    }).success).toBe(false);

    expect(changePasswordSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
    }).success).toBe(false);
  });

  it("rejects private fields in public current-user responses", () => {
    const result = currentUserSchema.safeParse({
      id: "ae87aa5c-7ea5-4c41-b130-a62f2f0ca2d7",
      email: "owner@example.com",
      displayName: "Owner",
      status: "active",
      passwordHash: "must-never-leave-the-api",
    });

    expect(result.success).toBe(false);
  });
});

describe("user administration contracts", () => {
  it("coerces pagination and supplies stable defaults", () => {
    expect(userListQuerySchema.parse({ page: "2", pageSize: "50" })).toEqual({
      page: 2,
      pageSize: 50,
      sort: "displayName",
      direction: "asc",
    });
  });

  it("normalizes invitations and rejects duplicate role IDs", () => {
    expect(inviteUserSchema.parse({
      email: " NEW.USER@EXAMPLE.COM ",
      roleIds: [roleId],
    }).email).toBe("new.user@example.com");

    const result = inviteUserSchema.safeParse({
      email: " NEW.USER@EXAMPLE.COM ",
      roleIds: [roleId, roleId],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate role assignments", () => {
    expect(assignUserRolesSchema.safeParse({ roleIds: [roleId, roleId] }).success).toBe(false);
  });
});

describe("role contracts", () => {
  it("keeps permission metadata complete and unique", () => {
    expect(permissionDefinitions).toHaveLength(permissionKeys.length);
    expect(new Set(permissionKeys).size).toBe(permissionKeys.length);
    expect(permissionDefinitions.every(({ module, description }) => module && description)).toBe(true);
  });

  it("accepts only registered permission keys", () => {
    expect(createRoleSchema.safeParse({
      name: "Catalog manager",
      permissionKeys: ["products.read", "products.update"],
    }).success).toBe(true);

    expect(createRoleSchema.safeParse({
      name: "Unsafe role",
      permissionKeys: ["everything.allow"],
    }).success).toBe(false);
  });

  it("rejects an empty role update", () => {
    expect(updateRoleSchema.safeParse({}).success).toBe(false);
  });
});
