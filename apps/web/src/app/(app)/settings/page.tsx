import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Organization, users, permissions, and integration settings belong here.
      </p>
    </section>
  );
}
