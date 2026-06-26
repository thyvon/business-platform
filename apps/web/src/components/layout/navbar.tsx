"use client";

import { useState } from "react";
import type { CurrentSession } from "@business/contracts";
import { LoaderCircle, LogOut, Moon, PanelLeft, Settings, Sun } from "@/components/ui/icons";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { useTheme } from "@/lib/theme-context";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

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
  const { theme, toggleTheme } = useTheme();
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
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/50 bg-background/80 px-4 py-2 shadow-sm backdrop-blur-2xl dark:border-white/15 dark:bg-background/85">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {logoutError && (
          <span role="alert" className="hidden text-xs text-red-600 sm:inline dark:text-red-400">
            {logoutError}
          </span>
        )}
        <button type="button" onClick={() => router.push("/profile" as Route)} className="hidden min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl px-2 py-1 transition-colors hover:bg-muted/50 sm:flex">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(currentSession.user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors">
              {currentSession.user.displayName}
            </p>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenDrawer}
          aria-label="Open layout settings"
        >
          <Settings className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
          title="Sign out"
          className="hover:text-red-700 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-950/40"
        >
          {loggingOut ? <LoaderCircle className="size-5 animate-spin" /> : <LogOut className="size-5" />}
        </Button>
      </div>
    </header>
  );
}


