import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ShieldCheck, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage organization access and administration tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={"/settings/users" as Route}>
          <Card className="h-full transition hover:border-primary/40 hover:bg-muted/30">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UsersRound className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Users</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Search members, review statuses, and inspect assigned roles.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full opacity-70">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Roles</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Role management is scheduled for the next administration slice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}