import { randomUUID } from "node:crypto";
import {
  permissionDefinitions,
  permissionKeys,
  type PermissionKey,
} from "@business/contracts";
import { eq, inArray } from "drizzle-orm";
import type { Database } from "./index.js";
import {
  organizations,
  permissions,
  rolePermissions,
  roles,
} from "./schema.js";

type BuiltInRoleDefinition = {
  name: "Owner" | "Administrator" | "Manager" | "Viewer";
  description: string;
  permissions: readonly PermissionKey[];
};

const administratorPermissions = permissionKeys
  .filter((key) => key !== "organization.ownership.transfer");

const managerPermissions = permissionKeys.filter((key) =>
  key === "dashboard.read"
  || key.startsWith("products.")
  || key.startsWith("suppliers."));

const viewerPermissions: readonly PermissionKey[] = [
  "dashboard.read",
  "products.read",
  "suppliers.read",
  "organization.read",
];

export const builtInRoleDefinitions = [
  {
    name: "Owner",
    description: "Full organization access, including ownership transfer.",
    permissions: permissionKeys,
  },
  {
    name: "Administrator",
    description: "Operational and security administration without ownership transfer.",
    permissions: administratorPermissions,
  },
  {
    name: "Manager",
    description: "Manage product and supplier operations without security administration.",
    permissions: managerPermissions,
  },
  {
    name: "Viewer",
    description: "Read-only access to core organization information.",
    permissions: viewerPermissions,
  },
] as const satisfies readonly BuiltInRoleDefinition[];

export async function seedPermissions(database: Database["db"]) {
  for (const definition of permissionDefinitions) {
    await database.insert(permissions).values({
      id: randomUUID(),
      key: definition.key,
      module: definition.module,
      description: definition.description,
    }).onDuplicateKeyUpdate({
      set: {
        module: definition.module,
        description: definition.description,
      },
    });
  }

  return permissionDefinitions.length;
}

export async function seedBuiltInRoles(database: Database["db"], organizationId: string) {
  for (const definition of builtInRoleDefinitions) {
    await database.insert(roles).values({
      id: randomUUID(),
      organizationId,
      name: definition.name,
      description: definition.description,
      isSystem: true,
    }).onDuplicateKeyUpdate({
      set: {
        description: definition.description,
        isSystem: true,
      },
    });
  }

  const roleRows = await database
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.organizationId, organizationId));
  const systemRoleNames = new Set(builtInRoleDefinitions.map(({ name }) => name));
  const roleIds = new Map(
    roleRows
      .filter(({ name }) => systemRoleNames.has(name as BuiltInRoleDefinition["name"]))
      .map(({ id, name }) => [name as BuiltInRoleDefinition["name"], id]),
  );

  const permissionRows = await database
    .select({ id: permissions.id, key: permissions.key })
    .from(permissions)
    .where(inArray(permissions.key, [...permissionKeys]));
  const permissionIds = new Map(
    permissionRows.map(({ id, key }) => [key as PermissionKey, id]),
  );

  if (roleIds.size !== builtInRoleDefinitions.length || permissionIds.size !== permissionKeys.length) {
    throw new Error("Authorization seed prerequisites are incomplete.");
  }

  await database.transaction(async (transaction) => {
    for (const definition of builtInRoleDefinitions) {
      const roleId = roleIds.get(definition.name)!;
      await transaction.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      await transaction.insert(rolePermissions).values(
        definition.permissions.map((permissionKey) => ({
          roleId,
          permissionId: permissionIds.get(permissionKey)!,
        })),
      );
    }
  });

  return builtInRoleDefinitions.length;
}

export async function seedAuthorization(database: Database["db"]) {
  const permissionCount = await seedPermissions(database);
  const organizationRows = await database
    .select({ id: organizations.id })
    .from(organizations);

  for (const organization of organizationRows) {
    await seedBuiltInRoles(database, organization.id);
  }

  return { permissionCount, organizationCount: organizationRows.length };
}
