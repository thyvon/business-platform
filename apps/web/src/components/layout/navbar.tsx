"use client";

import { useState } from "react";
import type { CurrentSession } from "@business/contracts";
import { LoaderCircle, LogOut, PanelLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function Navbar({
  currentSession,
  onToggleSidebar,
  onOpenDrawer,
}: {
  currentSession: CurrentSession;
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);

    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setLogoutError("Sign out failed. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-5" />
      </button>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {logoutError && (
          <span role="alert" className="hidden text-xs text-red-600 sm:inline dark:text-red-400">
            {logoutError}
          </span>
        )}
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {currentSession.user.displayName}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {currentSession.organization.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDrawer}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Open layout settings"
        >
          <Settings className="size-5" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          aria-label="Sign out"
          title="Sign out"
        >
          {loggingOut ? <LoaderCircle className="size-5 animate-spin" /> : <LogOut className="size-5" />}
        </button>
      </div>
    </header>
  );
}