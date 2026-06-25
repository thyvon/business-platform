"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { CurrentSession } from "@business/contracts";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { LayoutSettingsDrawer } from "./layout-settings-drawer";

export function AppShell({
  children,
  currentSession,
  initialSidebarCollapsed,
}: {
  children: React.ReactNode;
  currentSession: CurrentSession;
  initialSidebarCollapsed: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    document.cookie = "sidebar-collapsed=" + sidebarCollapsed + ";path=/;max-age=31536000;SameSite=Lax";
  }, [sidebarCollapsed]);

  const handleToggleSidebar = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((previous) => !previous);
      return;
    }
    setMobileSidebarOpen((previous) => !previous);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileClose}
        permissions={currentSession.permissions}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          currentSession={currentSession}
          onToggleSidebar={handleToggleSidebar}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="flex-1">
          <div key={pathname} className="w-full px-4 py-4 sm:px-5 sm:py-6 animate-[fadeIn_300ms_ease-out]">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      <LayoutSettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}