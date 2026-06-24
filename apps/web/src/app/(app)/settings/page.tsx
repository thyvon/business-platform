import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-8">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Organization, users, permissions, and integration settings belong here.
      </p>
    </section>
  );
}
