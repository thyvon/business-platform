import { cookies, headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { buildLoginPath } from "@/lib/auth-redirect";
import { getCurrentSession } from "@/lib/server-auth";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) {
    const currentPath = (await headers()).get("x-business-current-path");
    redirect(buildLoginPath(currentPath, "expired") as Route);
  }

  const sidebarCollapsed = (await cookies()).get("sidebar-collapsed")?.value === "true";

  return (
    <AppShell
      currentSession={session}
      initialSidebarCollapsed={sidebarCollapsed}
    >
      {children}
    </AppShell>
  );
}