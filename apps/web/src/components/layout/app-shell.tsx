"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { LayoutSettingsDrawer } from "./layout-settings-drawer";

export function AppShell({ children, initialSidebarCollapsed }: { children: React.ReactNode; initialSidebarCollapsed: boolean }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    document.cookie = `sidebar-collapsed=${sidebarCollapsed};path=/;max-age=31536000;SameSite=Lax`;
  }, [sidebarCollapsed]);

  const handleToggleSidebar = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((prev) => !prev);
      return;
    }

    setMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileClose}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="flex-1">
          <div className="w-full px-4 py-4 sm:px-5 sm:py-6">
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
