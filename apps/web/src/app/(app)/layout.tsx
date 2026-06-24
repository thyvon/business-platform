import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentSession } from "@/lib/server-auth";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

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