import type { Metadata } from "next";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { buildLoginPath } from "@/lib/auth-redirect";
import { getCurrentSession } from "@/lib/server-auth";
import { RolesList } from "@/features/roles/components/roles-list";

export const metadata: Metadata = { title: "Roles" };

const apiOrigin = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
}

interface Permission {
  id: string;
  key: string;
  module: string;
  description: string;
}

async function fetchRoles(): Promise<Role[]> {
  const response = await fetch(`${apiOrigin}/api/v1/roles`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  if (response.status === 401) redirect(buildLoginPath("/settings/roles", "expired") as Route);
  if (response.status === 403) redirect("/access-denied" as Route);
  if (!response.ok) throw new Error("The role list could not be loaded.");

  const payload = await response.json() as { data: Role[] };
  return payload.data;
}

async function fetchPermissions(): Promise<Permission[]> {
  const response = await fetch(`${apiOrigin}/api/v1/roles/permissions`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  if (response.status === 401) redirect(buildLoginPath("/settings/roles", "expired") as Route);
  if (response.status === 403) redirect("/access-denied" as Route);
  if (!response.ok) throw new Error("The permission list could not be loaded.");

  const payload = await response.json() as { data: Permission[] };
  return payload.data;
}

export default async function RolesPage() {
  const session = await getCurrentSession();
  if (!session) redirect(buildLoginPath("/settings/roles", "expired") as Route);
  if (!session.permissions.includes("roles.read")) redirect("/access-denied" as Route);

  const [roles, permissions] = await Promise.all([
    fetchRoles(),
    fetchPermissions(),
  ]);

  const canCreate = session.permissions.includes("roles.create");
  const canUpdate = session.permissions.includes("roles.update");
  const canDelete = session.permissions.includes("roles.delete");

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
            <BreadcrumbPage>Roles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="mt-4 space-y-6">
        <RolesList
          roles={roles}
          permissions={permissions}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </section>
    </>
  );
}


