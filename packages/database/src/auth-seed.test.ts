import { describe, expect, it } from "vitest";
import { permissionKeys } from "@business/contracts";
import { hashPassword, verifyPassword } from "./auth-password.js";
import { builtInRoleDefinitions } from "./auth-seed.js";

describe("built-in authorization policy", () => {
  const roles = new Map(
    builtInRoleDefinitions.map((role) => [role.name, new Set(role.permissions)]),
  );

  it("defines each built-in role once", () => {
    expect(roles.size).toBe(4);
    expect([...roles.keys()]).toEqual(["Owner", "Administrator", "Manager", "Viewer"]);
  });

  it("grants Owner every registered permission", () => {
    expect(roles.get("Owner")).toEqual(new Set(permissionKeys));
  });

  it("keeps ownership transfer exclusive to Owner", () => {
    expect(roles.get("Administrator")?.has("organization.ownership.transfer")).toBe(false);
    expect(roles.get("Manager")?.has("organization.ownership.transfer")).toBe(false);
    expect(roles.get("Viewer")?.has("organization.ownership.transfer")).toBe(false);
  });

  it("keeps Viewer read-only", () => {
    expect([...roles.get("Viewer") ?? []].every((key) => key.endsWith(".read"))).toBe(true);
  });
});

describe("password hashing", () => {
  it("uses Argon2id with the approved minimum settings", async () => {
    const password = "a-secure-test-password";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).toContain("$argon2id$v=19$m=19456,t=2,p=1$");
    await expect(verifyPassword(passwordHash, password)).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, "wrong-password")).resolves.toBe(false);
  });
});
