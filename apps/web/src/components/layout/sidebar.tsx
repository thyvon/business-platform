"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, PackageSearch, Building2, Settings, X, ShieldCheck, UsersRound } from "lucide-react";
import type { PermissionKey } from "@business/contracts/auth";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: PermissionKey;
}

const navigation: NavItem[] = [
  { href: "/" as Route, label: "Overview", icon: ChartNoAxesCombined },
  { href: "/products" as Route, label: "Products", icon: PackageSearch },
  { href: "/suppliers" as Route, label: "Suppliers", icon: Building2 },
  { href: "/settings" as Route, label: "Settings", icon: Settings, requiredPermission: "organization.read" },
  { href: "/settings/users" as Route, label: "Users", icon: UsersRound, requiredPermission: "users.read" },
  { href: "/settings/roles" as Route, label: "Roles", icon: ShieldCheck, requiredPermission: "roles.read" },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  permissions,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  permissions: PermissionKey[];
}) {
  const pathname = usePathname();

  const visibleNavigation = navigation.filter((item) => {
    if (!item.requiredPermission) return true;
    return permissions.includes(item.requiredPermission);
  });

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-300 lg:static lg:z-auto ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "lg:w-16" : "lg:w-60"} w-60`}
      >
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link
            href="/"
            onClick={onMobileClose}
            className={`flex items-center gap-2 font-bold text-sidebar-foreground ${
              collapsed ? "lg:mx-auto" : ""
            }`}
          >
            <span className="rounded-xl bg-primary p-2 text-primary-foreground">
              <PackageSearch className="size-5" />
            </span>
            <span className={collapsed ? "lg:hidden" : ""}>
              Business Platform
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleNavigation.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
