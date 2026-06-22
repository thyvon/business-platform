"use client";

import { PanelLeft, Settings } from "lucide-react";

export function Navbar({
  onToggleSidebar,
  onOpenDrawer,
}: {
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-5" />
      </button>

      <button
        type="button"
        onClick={onOpenDrawer}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Open layout settings"
      >
        <Settings className="size-5" />
      </button>
    </header>
  );
}
