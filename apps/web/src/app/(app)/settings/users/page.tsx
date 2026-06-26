import { Suspense } from "react";
import type { Metadata } from "next";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UsersRound } from "@/components/ui/icons";
import Link from "next/link";
import { userListQuerySchema, userListResponseSchema, type UserListItem, type UserListQuery, type UserListResponse } from "@business/contracts/auth";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DataTablePageSizeControl } from "@/components/ui/data-table-pagination-bar";
import { DataTableToolbar, type DataTableToolbarFilter } from "@/components/ui/data-table-toolbar";
import { buildLoginPath } from "@/lib/auth-redirect";
import { getCurrentSession } from "@/lib/server-auth";
import { UserActions } from "@/features/users/components/user-actions";
import { InviteUserButton } from "@/features/users/components/invite-user-dialog";

export const metadata: Metadata = { title: "Users" };

const apiOrigin = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

type SearchParams = Promise<{
  search?: string | string[];
  status?: string | string[];
  roleId?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
}>;

type UserActionPermissions = {
  canUpdate: boolean;
  canSuspend: boolean;
  canAssignRoles: boolean;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuery(params: Awaited<SearchParams>): UserListQuery {
  const parsed = userListQuerySchema.safeParse({
    search: firstValue(params.search) || undefined,
    status: firstValue(params.status) || undefined,
    roleId: firstValue(params.roleId) || undefined,
    page: firstValue(params.page) || "1",
    pageSize: firstValue(params.pageSize) || "10",
    sort: firstValue(params.sort) || "displayName",
    direction: firstValue(params.direction) || "asc",
  });

  return parsed.success
    ? parsed.data
    : userListQuerySchema.parse({ pageSize: "10" });
}

function usersPath(query: UserListQuery, changes: Partial<UserListQuery>): Route {
  const nextQuery = { ...query, ...changes };
  const params = new URLSearchParams();

  if (nextQuery.search) params.set("search", nextQuery.search);
  if (nextQuery.status) params.set("status", nextQuery.status);
  if (nextQuery.roleId) params.set("roleId", nextQuery.roleId);
  if (nextQuery.page > 1) params.set("page", String(nextQuery.page));
  if (nextQuery.pageSize !== 10) params.set("pageSize", String(nextQuery.pageSize));
  if (nextQuery.sort !== "displayName") params.set("sort", nextQuery.sort);
  if (nextQuery.direction !== "asc") params.set("direction", nextQuery.direction);

  const queryString = params.toString();
  return (queryString ? `/settings/users?${queryString}` : "/settings/users") as Route;
}

function usersTableKey(query: UserListQuery) {
  return [
    query.search ?? "",
    query.status ?? "",
    query.roleId ?? "",
    query.page,
    query.pageSize,
    query.sort,
    query.direction,
  ].join(":");
}

async function fetchUsers(query: UserListQuery): Promise<UserListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
    direction: query.direction,
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.roleId) params.set("roleId", query.roleId);

  const response = await fetch(`${apiOrigin}/api/v1/users?${params}`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  if (response.status === 401) redirect(buildLoginPath("/settings/users", "expired") as Route);
  if (response.status === 403) redirect("/access-denied" as Route);
  if (!response.ok) throw new Error("The user list could not be loaded.");

  const payload = await response.json() as { data: unknown };
  return userListResponseSchema.parse(payload.data);
}

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getCurrentSession();
  if (!session) redirect(buildLoginPath("/settings/users", "expired") as Route);
  if (!session.permissions.includes("users.read")) redirect("/access-denied" as Route);

  const query = parseQuery(await searchParams);

  const rolesResponse = await fetch(`${apiOrigin}/api/v1/roles`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  if (rolesResponse.status === 401) redirect(buildLoginPath("/settings/users", "expired") as Route);
  if (rolesResponse.status === 403) redirect("/access-denied" as Route);
  if (!rolesResponse.ok) throw new Error("The role filter could not be loaded.");

  const rolesPayload = await rolesResponse.json() as { data: Array<{ id: string; name: string }> };
  const rolesData = rolesPayload.data;
  const roleOptions = rolesData.map((role) => ({ value: role.id, label: role.name }));

  const userActionPermissions: UserActionPermissions = {
    canUpdate: session.permissions.includes("users.update"),
    canSuspend: session.permissions.includes("users.suspend"),
    canAssignRoles: session.permissions.includes("users.roles.assign"),
  };
  const canInviteUsers = session.permissions.includes("users.invite");

  const userFilters: DataTableToolbarFilter[] = [
    {
      id: "status",
      label: "Membership",
      placeholder: "All memberships",
      options: [
        { value: "invited", label: "Invited" },
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
      ],
    },
    {
      id: "roleId",
      label: "Role",
      placeholder: "All roles",
      options: roleOptions,
      searchable: true,
    },
  ];

  const pageSizePagination = {
    page: query.page,
    pageSize: query.pageSize,
    total: 0,
    totalPages: 1,
    previousHref: usersPath(query, { page: Math.max(1, query.page - 1) }),
    nextHref: usersPath(query, { page: query.page + 1 }),
    pageSizeHrefs: {
      10: usersPath(query, { pageSize: 10, page: 1 }),
      20: usersPath(query, { pageSize: 20, page: 1 }),
      50: usersPath(query, { pageSize: 50, page: 1 }),
      100: usersPath(query, { pageSize: 100, page: 1 }),
    },
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href={"/" as Route} className="transition-colors hover:text-foreground">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={"/settings" as Route} className="transition-colors hover:text-foreground">Settings</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="mt-4 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <UsersRound className="size-6" />
              Users
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review organization members and their current access.
            </p>
          </div>
          {canInviteUsers ? <InviteUserButton roleOptions={rolesData} /> : null}
        </div>

        <div className="space-y-2">
          <DataTableToolbar searchPlaceholder="Name or email" filters={userFilters}>
            <DataTablePageSizeControl pagination={pageSizePagination} />
          </DataTableToolbar>

          <Suspense key={usersTableKey(query)} fallback={<UsersTableLoading roleOptions={rolesData} userActionPermissions={userActionPermissions} currentUserId={session.user.id} />}>
            <UsersTable query={query} roleOptions={rolesData} userActionPermissions={userActionPermissions} currentUserId={session.user.id} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function UsersTable({
  query,
  roleOptions,
  userActionPermissions,
  currentUserId,
}: {
  query: UserListQuery;
  roleOptions: Array<{ id: string; name: string }>;
  userActionPermissions: UserActionPermissions;
  currentUserId: string;
}) {
  const users = await fetchUsers(query);
  const columns = createUserColumns(roleOptions, userActionPermissions, currentUserId);

  return (
    <DataTable
      columns={columns}
      items={users.items}
      getItemKey={(user) => user.id}
      emptyTitle="No users found"
      emptyDescription="Adjust the search or membership filter to see more members."
      showPageSizeControl={false}
      pagination={{
        page: users.page,
        pageSize: users.pageSize,
        total: users.total,
        totalPages: users.totalPages,
        previousHref: users.page > 1 ? usersPath(query, { page: users.page - 1 }) : usersPath(query, { page: 1 }),
        nextHref: users.totalPages > users.page ? usersPath(query, { page: users.page + 1 }) : usersPath(query, { page: users.page }),
        pageSizeHrefs: {
          10: usersPath(query, { pageSize: 10, page: 1 }),
          20: usersPath(query, { pageSize: 20, page: 1 }),
          50: usersPath(query, { pageSize: 50, page: 1 }),
          100: usersPath(query, { pageSize: 100, page: 1 }),
        },
      }}
    />
  );
}

function UsersTableLoading({
  roleOptions,
  userActionPermissions,
  currentUserId,
}: {
  roleOptions: Array<{ id: string; name: string }>;
  userActionPermissions: UserActionPermissions;
  currentUserId: string;
}) {
  return (
    <DataTable<UserListItem>
      columns={createUserColumns(roleOptions, userActionPermissions, currentUserId)}
      items={[]}
      getItemKey={(user) => user.id}
      emptyTitle="No users found"
      emptyDescription="Adjust the search or membership filter to see more members."
      loading
      loadingLabel="Loading users"
    />
  );
}

function createUserColumns(
  roleOptions: Array<{ id: string; name: string }>,
  userActionPermissions: UserActionPermissions,
  currentUserId: string,
): Array<DataTableColumn<UserListItem>> {
  return [
    {
      id: "user",
      header: "User",
      cell: (user) => <UserIdentity user={user} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => <UserStatus user={user} />,
    },
    {
      id: "roles",
      header: "Roles",
      cell: (user) => <UserRoles user={user} />,
    },
    {
      id: "lastLogin",
      header: "Last login",
      className: "text-muted-foreground",
      cell: (user) => user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never",
    },
    {
      id: "created",
      header: "Created",
      className: "text-muted-foreground",
      cell: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      className: "w-0",
      cell: (user) => (
        <UserActions
          userId={user.id}
          displayName={user.displayName}
          membershipStatus={user.membershipStatus}
          roleIds={user.roles.map((role) => role.id)}
          roleOptions={roleOptions}
          canUpdate={userActionPermissions.canUpdate}
          canSuspend={userActionPermissions.canSuspend && user.id !== currentUserId}
          canAssignRoles={userActionPermissions.canAssignRoles}
        />
      ),
    },
  ];
}

function UserIdentity({ user }: { user: UserListItem }) {
  return (
    <div>
      <div className="font-medium text-foreground">{user.displayName}</div>
      <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
    </div>
  );
}

function UserStatus({ user }: { user: UserListItem }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Badge variant={user.membershipStatus === "active" ? "secondary" : "outline"}>{user.membershipStatus}</Badge>
      <span className="text-xs text-muted-foreground">Account: {user.status}</span>
    </div>
  );
}

function UserRoles({ user }: { user: UserListItem }) {
  return (
    <div className="flex max-w-xs flex-wrap gap-1.5">
      {user.roles.length === 0 ? (
        <span className="text-xs text-muted-foreground">No roles</span>
      ) : user.roles.map((role) => (
        <Badge key={role.id} variant={role.isSystem ? "secondary" : "outline"}>{role.name}</Badge>
      ))}
    </div>
  );
}
