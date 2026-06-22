import { randomUUID } from "node:crypto";
import path from "node:path";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import {
  newPasswordSchema,
  normalizedEmailSchema,
  permissionKeys,
  type PermissionKey,
} from "@business/contracts";
import dotenv from "dotenv";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "./auth-password.js";
import { builtInRoleDefinitions, seedPermissions } from "./auth-seed.js";
import { createDatabase } from "./index.js";
import {
  auditEvents,
  membershipRoles,
  organizationMemberships,
  organizations,
  permissions,
  rolePermissions,
  roles,
  users,
} from "./schema.js";

const bootstrapInputSchema = z.object({
  organizationName: z.string().trim().min(1).max(255),
  ownerEmail: normalizedEmailSchema,
  ownerDisplayName: z.string().trim().min(1).max(255),
  ownerPassword: newPasswordSchema,
}).strict();

async function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("A password must be supplied through BOOTSTRAP_OWNER_PASSWORD in non-interactive environments.");
  }

  emitKeypressEvents(stdin);
  stdout.write(prompt);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(Boolean(wasRaw));
      stdin.pause();
    };

    const onKeypress = (character: string, key: { name?: string; ctrl?: boolean; meta?: boolean }) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        stdout.write("\n");
        reject(new Error("Owner provisioning was cancelled."));
        return;
      }

      if (key.name === "return") {
        cleanup();
        stdout.write("\n");
        resolve(value);
        return;
      }

      if (key.name === "backspace") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write("\b \b");
        }
        return;
      }

      if (character && !key.ctrl && !key.meta) {
        value += character;
        stdout.write("*");
      }
    };

    stdin.on("keypress", onKeypress);
  });
}

async function collectInput() {
  const fromEnvironment = {
    organizationName: process.env.BOOTSTRAP_ORGANIZATION_NAME,
    ownerEmail: process.env.BOOTSTRAP_OWNER_EMAIL,
    ownerDisplayName: process.env.BOOTSTRAP_OWNER_NAME,
    ownerPassword: process.env.BOOTSTRAP_OWNER_PASSWORD,
  };

  const missingNonSecret = !fromEnvironment.organizationName
    || !fromEnvironment.ownerEmail
    || !fromEnvironment.ownerDisplayName;

  if (!stdin.isTTY && (missingNonSecret || !fromEnvironment.ownerPassword)) {
    throw new Error("Bootstrap values are required through environment variables in non-interactive environments.");
  }

  const terminal = createInterface({ input: stdin, output: stdout });
  let organizationName = fromEnvironment.organizationName;
  let ownerEmail = fromEnvironment.ownerEmail;
  let ownerDisplayName = fromEnvironment.ownerDisplayName;

  try {
    organizationName ||= await terminal.question("Organization name: ");
    ownerEmail ||= await terminal.question("Owner email: ");
    ownerDisplayName ||= await terminal.question("Owner display name: ");
  } finally {
    terminal.close();
  }

  let ownerPassword = fromEnvironment.ownerPassword;
  if (!ownerPassword) {
    ownerPassword = await readHidden("Owner password: ");
    const confirmation = await readHidden("Confirm owner password: ");
    if (ownerPassword !== confirmation) {
      throw new Error("Password confirmation does not match.");
    }
  }

  return bootstrapInputSchema.parse({
    organizationName,
    ownerEmail,
    ownerDisplayName,
    ownerPassword,
  });
}

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const database = createDatabase(process.env.DATABASE_URL);
try {
  const existingOrganization = await database.db
    .select({ id: organizations.id })
    .from(organizations)
    .limit(1);

  if (existingOrganization.length > 0) {
    throw new Error("Owner provisioning is disabled because an organization already exists.");
  }

  const input = await collectInput();
  delete process.env.BOOTSTRAP_OWNER_PASSWORD;
  const passwordHash = await hashPassword(input.ownerPassword);
  input.ownerPassword = "";

  await seedPermissions(database.db);
  const permissionRows = await database.db
    .select({ id: permissions.id, key: permissions.key })
    .from(permissions)
    .where(inArray(permissions.key, [...permissionKeys]));

  if (permissionRows.length !== permissionKeys.length) {
    throw new Error("Permission seed is incomplete.");
  }

  const permissionIds = new Map(
    permissionRows.map(({ id, key }) => [key as PermissionKey, id]),
  );

  const organizationId = randomUUID();
  const userId = randomUUID();
  const membershipId = randomUUID();
  const roleIds = new Map(
    builtInRoleDefinitions.map((definition) => [definition.name, randomUUID()]),
  );

  await database.db.transaction(async (transaction) => {
    await transaction.insert(organizations).values({
      id: organizationId,
      name: input.organizationName,
      status: "active",
    });

    await transaction.insert(users).values({
      id: userId,
      email: input.ownerEmail,
      displayName: input.ownerDisplayName,
      passwordHash,
      status: "active",
      passwordChangedAt: new Date(),
    });

    await transaction.insert(organizationMemberships).values({
      id: membershipId,
      organizationId,
      userId,
      status: "active",
    });

    await transaction.insert(roles).values(
      builtInRoleDefinitions.map((definition) => ({
        id: roleIds.get(definition.name)!,
        organizationId,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      })),
    );

    await transaction.insert(rolePermissions).values(
      builtInRoleDefinitions.flatMap((definition) =>
        definition.permissions.map((permissionKey) => ({
          roleId: roleIds.get(definition.name)!,
          permissionId: permissionIds.get(permissionKey)!,
        }))),
    );

    await transaction.insert(membershipRoles).values({
      membershipId,
      roleId: roleIds.get("Owner")!,
    });

    await transaction.insert(auditEvents).values({
      id: randomUUID(),
      organizationId,
      actorUserId: userId,
      action: "organization.owner.provisioned",
      targetType: "user",
      targetId: userId,
      metadata: { source: "db:provision-owner" },
    });
  });

  console.log("Owner provisioned for " + input.organizationName + " (" + input.ownerEmail + ").");
} catch (error) {
  const message = error instanceof z.ZodError
    ? z.prettifyError(error)
    : error instanceof Error
      ? error.message
      : "Unknown provisioning failure.";
  console.error("Owner provisioning failed: " + message);
  process.exitCode = 1;
} finally {
  await database.pool.end();
}
