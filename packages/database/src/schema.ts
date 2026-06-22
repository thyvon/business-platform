import {
  boolean,
  datetime,
  double,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productCode: varchar("product_code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  uom: varchar("uom", { length: 100 }).notNull(),
  category: varchar("category", { length: 150 }).notNull(),
  subCategory: varchar("sub_category", { length: 150 }).notNull(),
  status: mysqlEnum("status", ["Active", "Inactive", "Discontinued"]).notNull().default("Active"),
  price: double("price"),
  stock: int("stock"),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("products_product_code_unique").on(table.productCode),
  index("products_category_idx").on(table.category),
  index("products_status_idx").on(table.status),
]);

export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).notNull().default("active"),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("organizations_status_idx").on(table.status),
]);

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).notNull().default("pending"),
  passwordChangedAt: datetime("password_changed_at", { mode: "date", fsp: 3 }),
  lastLoginAt: datetime("last_login_at", { mode: "date", fsp: 3 }),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  index("users_status_idx").on(table.status),
]);

export const organizationMemberships = mysqlTable("organization_memberships", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 36 }).notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["invited", "active", "suspended"]).notNull().default("invited"),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("organization_memberships_org_user_unique").on(table.organizationId, table.userId),
  index("organization_memberships_user_idx").on(table.userId),
  index("organization_memberships_status_idx").on(table.organizationId, table.status),
]);

export const roles = mysqlTable("roles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 36 }).notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("roles_organization_name_unique").on(table.organizationId, table.name),
]);

export const permissions = mysqlTable("permissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 150 }).notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("permissions_key_unique").on(table.key),
  index("permissions_module_idx").on(table.module),
]);

export const rolePermissions = mysqlTable("role_permissions", {
  roleId: varchar("role_id", { length: 36 }).notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id", { length: 36 }).notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
  index("role_permissions_permission_idx").on(table.permissionId),
]);

export const membershipRoles = mysqlTable("membership_roles", {
  membershipId: varchar("membership_id", { length: 36 }).notNull()
    .references(() => organizationMemberships.id, { onDelete: "cascade" }),
  roleId: varchar("role_id", { length: 36 }).notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.membershipId, table.roleId] }),
  index("membership_roles_role_idx").on(table.roleId),
]);

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id", { length: 36 }).notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  revokedAt: datetime("revoked_at", { mode: "date", fsp: 3 }),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
  index("sessions_user_idx").on(table.userId),
  index("sessions_organization_idx").on(table.organizationId),
  index("sessions_expiry_idx").on(table.expiresAt),
]);

export const userInvitations = mysqlTable("user_invitations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 36 }).notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  invitedByUserId: varchar("invited_by_user_id", { length: 36 })
    .references(() => users.id, { onDelete: "set null" }),
  expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
  acceptedAt: datetime("accepted_at", { mode: "date", fsp: 3 }),
  revokedAt: datetime("revoked_at", { mode: "date", fsp: 3 }),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_invitations_token_hash_unique").on(table.tokenHash),
  index("user_invitations_org_email_idx").on(table.organizationId, table.email),
  index("user_invitations_expiry_idx").on(table.expiresAt),
]);

export const invitationRoles = mysqlTable("invitation_roles", {
  invitationId: varchar("invitation_id", { length: 36 }).notNull()
    .references(() => userInvitations.id, { onDelete: "cascade" }),
  roleId: varchar("role_id", { length: 36 }).notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.invitationId, table.roleId] }),
  index("invitation_roles_role_idx").on(table.roleId),
]);

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
  usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("password_reset_tokens_hash_unique").on(table.tokenHash),
  index("password_reset_tokens_user_idx").on(table.userId),
  index("password_reset_tokens_expiry_idx").on(table.expiresAt),
]);

export const auditEvents = mysqlTable("audit_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 36 }).notNull()
    .references(() => organizations.id),
  actorUserId: varchar("actor_user_id", { length: 36 })
    .references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 150 }).notNull(),
  targetType: varchar("target_type", { length: 100 }).notNull(),
  targetId: varchar("target_id", { length: 36 }),
  requestId: varchar("request_id", { length: 100 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
}, (table) => [
  index("audit_events_organization_created_idx").on(table.organizationId, table.createdAt),
  index("audit_events_actor_idx").on(table.actorUserId),
  index("audit_events_action_idx").on(table.action),
]);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type OrganizationRow = typeof organizations.$inferSelect;
export type NewOrganizationRow = typeof organizations.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type OrganizationMembershipRow = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembershipRow = typeof organizationMemberships.$inferInsert;
export type RoleRow = typeof roles.$inferSelect;
export type NewRoleRow = typeof roles.$inferInsert;
export type PermissionRow = typeof permissions.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
export type UserInvitationRow = typeof userInvitations.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
