"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, PackageSearch, Building2, Settings, X } from "lucide-react";

const navigation = [
  { href: "/", label: "Overview", icon: ChartNoAxesCombined },
  { href: "/products", label: "Products", icon: PackageSearch },
  { href: "/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 lg:static lg:z-auto ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "lg:w-16" : "lg:w-60"} w-60`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-700">
          <Link
            href="/"
            onClick={onMobileClose}
            className={`flex items-center gap-2 font-bold text-slate-900 dark:text-white ${
              collapsed ? "lg:mx-auto" : ""
            }`}
          >
            <span className="rounded-xl bg-indigo-600 p-2 text-white">
              <PackageSearch className="size-5" />
            </span>
            <span className={collapsed ? "lg:hidden" : ""}>
              Business Platform
            </span>
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
