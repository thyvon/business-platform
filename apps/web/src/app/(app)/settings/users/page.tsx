import { Suspense } from "react";
import type { Metadata } from "next";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRoundPlus, UsersRound } from "lucide-react";
import { userListQuerySchema, userListResponseSchema, type UserListItem, type UserListQuery, type UserListResponse } from "@business/contracts/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { buildLoginPath } from "@/lib/auth-redirect";
import { getCurrentSession } from "@/lib/server-auth";
import { UserListFilters } from "@/features/users/components/user-list-filters";

export const metadata: Metadata = { title: "Users" };

const apiOrigin = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

type SearchParams = Promise<{
  search?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
}>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuery(params: Awaited<SearchParams>): UserListQuery {
  const parsed = userListQuerySchema.safeParse({
    search: firstValue(params.search) || undefined,
    status: firstValue(params.status) || undefined,
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

  return (
    <section className="space-y-6">
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
        <Button disabled title="Invitation flow is scheduled for the next user-admin slice">
          <UserRoundPlus className="size-4" />
          Invite user
        </Button>
      </div>

      <UserListFilters key={query.status ?? ""} query={query} />

      <Suspense key={usersTableKey(query)} fallback={<UsersTableLoading />}>
        <UsersTable query={query} />
      </Suspense>
    </section>
  );
}

async function UsersTable({ query }: { query: UserListQuery }) {
  const users = await fetchUsers(query);

  return (
    <DataTable
      columns={userColumns}
      items={users.items}
      getItemKey={(user) => user.id}
      emptyTitle="No users found"
      emptyDescription="Adjust the search or status filter to see more members."
      renderMobileItem={renderMobileUser}
      pagination={{
        page: users.page,
        pageSize: users.pageSize,
        total: users.total,
        totalPages: users.totalPages,
        previousHref: users.page > 1 ? usersPath(query, { page: users.page - 1 }) : usersPath(query, { page: 1 }),
        nextHref: users.totalPages > users.page ? usersPath(query, { page: users.page + 1 }) : usersPath(query, { page: users.page }),
      }}
    />
  );
}

function UsersTableLoading() {
  return (
    <DataTable<UserListItem>
      columns={userColumns}
      items={[]}
      getItemKey={(user) => user.id}
      emptyTitle="No users found"
      emptyDescription="Adjust the search or status filter to see more members."
      renderMobileItem={renderMobileUser}
      loading
      loadingLabel="Loading users"
    />
  );
}

const userColumns: Array<DataTableColumn<UserListItem>> = [
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
];

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
      <Badge variant={user.status === "active" ? "secondary" : "outline"}>{user.status}</Badge>
      <span className="text-xs text-muted-foreground">Membership: {user.membershipStatus}</span>
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

function renderMobileUser(user: UserListItem) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <UserIdentity user={user} />
        <Badge variant={user.status === "active" ? "secondary" : "outline"}>{user.status}</Badge>
      </div>
      <UserRoles user={user} />
      <div className="grid gap-1 text-xs text-muted-foreground">
        <span>Membership: {user.membershipStatus}</span>
        <span>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</span>
        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}