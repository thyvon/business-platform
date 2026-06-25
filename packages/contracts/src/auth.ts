import { z } from "zod";

export const permissionDefinitions = [
  { key: "dashboard.read", module: "Dashboard", description: "View the organization dashboard." },
  { key: "products.read", module: "Products", description: "View products." },
  { key: "products.create", module: "Products", description: "Create products." },
  { key: "products.update", module: "Products", description: "Update products." },
  { key: "products.delete", module: "Products", description: "Delete products." },
  { key: "suppliers.read", module: "Suppliers", description: "View suppliers." },
  { key: "suppliers.create", module: "Suppliers", description: "Create suppliers." },
  { key: "suppliers.update", module: "Suppliers", description: "Update suppliers." },
  { key: "suppliers.delete", module: "Suppliers", description: "Delete suppliers." },
  { key: "users.read", module: "Users", description: "View organization users." },
  { key: "users.invite", module: "Users", description: "Invite organization users." },
  { key: "users.update", module: "Users", description: "Update organization users." },
  { key: "users.suspend", module: "Users", description: "Suspend and reactivate organization users." },
  { key: "users.roles.assign", module: "Users", description: "Assign roles to organization users." },
  { key: "roles.read", module: "Roles", description: "View roles and permissions." },
  { key: "roles.create", module: "Roles", description: "Create custom roles." },
  { key: "roles.update", module: "Roles", description: "Update roles and their permissions." },
  { key: "roles.delete", module: "Roles", description: "Delete eligible custom roles." },
  { key: "organization.read", module: "Organization", description: "View organization settings." },
  { key: "organization.update", module: "Organization", description: "Update organization settings." },
  { key: "organization.ownership.transfer", module: "Organization", description: "Transfer organization ownership." },
  { key: "audit.read", module: "Audit", description: "View security and business audit events." },
] as const;

export type PermissionKey = typeof permissionDefinitions[number]["key"];

export const permissionKeys = permissionDefinitions
  .map(({ key }) => key) as [PermissionKey, ...PermissionKey[]];

export const permissionKeySchema = z.enum(permissionKeys);
export const userStatusSchema = z.enum(["pending", "active", "suspended"]);
export const membershipStatusSchema = z.enum(["invited", "active", "suspended"]);
export const organizationStatusSchema = z.enum(["active", "suspended"]);

export const normalizedEmailSchema = z.string()
  .trim()
  .toLowerCase()
  .max(320)
  .pipe(z.email());

const loginPasswordSchema = z.string().min(1).max(1_024);
export const newPasswordSchema = z.string().min(12).max(128);
const tokenSchema = z.string().min(32).max(512);
const idSchema = z.uuid();

function hasUniqueValues(values: readonly string[]) {
  return new Set(values).size === values.length;
}

function hasUniqueIds(values: readonly { id: string }[]) {
  return new Set(values.map(({ id }) => id)).size === values.length;
}

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: loginPasswordSchema,
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: loginPasswordSchema,
  newPassword: newPasswordSchema,
}).strict().refine(
  ({ currentPassword, newPassword }) => currentPassword !== newPassword,
  { path: ["newPassword"], message: "New password must be different from the current password." },
);

export const forgotPasswordSchema = z.object({
  email: normalizedEmailSchema,
}).strict();

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  newPassword: newPasswordSchema,
}).strict();

export const organizationSummarySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(255),
  status: organizationStatusSchema,
}).strict();

export const permissionSchema = z.object({
  id: idSchema,
  key: permissionKeySchema,
  module: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
}).strict();

export const roleSummarySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  isSystem: z.boolean(),
}).strict();

export const currentUserSchema = z.object({
  id: idSchema,
  email: normalizedEmailSchema,
  displayName: z.string().min(1).max(255),
  status: userStatusSchema,
}).strict();

export const currentSessionSchema = z.object({
  user: currentUserSchema.extend({ status: z.literal("active") }).strict(),
  organization: organizationSummarySchema.extend({ status: z.literal("active") }).strict(),
  membershipId: idSchema,
  membershipStatus: z.literal("active"),
  roles: z.array(roleSummarySchema).min(1).refine(hasUniqueIds, "Roles must be unique."),
  permissions: z.array(permissionKeySchema).refine(hasUniqueValues, "Permissions must be unique."),
  expiresAt: z.iso.datetime(),
}).strict();

export const userListQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  status: membershipStatusSchema.optional(),
  roleId: idSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["displayName", "email", "status", "lastLoginAt", "createdAt"]).default("displayName"),
  direction: z.enum(["asc", "desc"]).default("asc"),
}).strict();

export const userListItemSchema = z.object({
  id: idSchema,
  email: normalizedEmailSchema,
  displayName: z.string().min(1).max(255),
  status: userStatusSchema,
  membershipStatus: membershipStatusSchema,
  roles: z.array(roleSummarySchema),
  lastLoginAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
}).strict();

export const userDetailResponseSchema = userListItemSchema.extend({
  membershipId: idSchema,
}).strict();

export const userListResponseSchema = z.object({
  items: z.array(userListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).strict();

export const inviteUserSchema = z.object({
  email: normalizedEmailSchema,
  roleIds: z.array(idSchema).min(1).max(20).refine(hasUniqueValues, "Role IDs must be unique."),
}).strict();

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(255).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field must be supplied.");

export const assignUserRolesSchema = z.object({
  roleIds: z.array(idSchema).min(1).max(20).refine(hasUniqueValues, "Role IDs must be unique."),
}).strict();

const roleFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(""),
  permissionKeys: z.array(permissionKeySchema).max(permissionKeys.length)
    .refine(hasUniqueValues, "Permission keys must be unique."),
};

export const createRoleSchema = z.object(roleFields).strict();

export const updateRoleSchema = z.object({
  name: roleFields.name.optional(),
  description: z.string().trim().max(500).optional(),
  permissionKeys: roleFields.permissionKeys.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field must be supplied.");

export const setRolePermissionsSchema = z.object({
  permissionKeys: roleFields.permissionKeys,
}).strict();

export const roleDetailSchema = roleSummarySchema.extend({
  permissions: z.array(permissionSchema),
  memberCount: z.number().int().nonnegative(),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CurrentSession = z.infer<typeof currentSessionSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserDetailResponse = z.infer<typeof userDetailResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignUserRolesInput = z.infer<typeof assignUserRolesSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;
export type RoleDetail = z.infer<typeof roleDetailSchema>;

