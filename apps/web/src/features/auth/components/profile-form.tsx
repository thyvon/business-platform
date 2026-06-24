"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CurrentSession } from "@business/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function ProfileForm({ session }: { session: CurrentSession }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "").trim();

    if (!displayName) {
      setErrorMessage("Display name is required.");
      setSubmitting(false);
      return;
    }

    try {
      await apiRequest<CurrentSession>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName }),
      });
      setEditing(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{session.user.displayName}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditing((e) => !e); setErrorMessage(null); }}
            aria-label={editing ? "Cancel editing" : "Edit profile"}
          >
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                required
                autoFocus
                disabled={submitting}
                defaultValue={session.user.displayName}
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><LoaderCircle className="mr-2 size-4 animate-spin" /> Saving…</>
              ) : (
                <><Check className="mr-2 size-4" /> Save changes</>
              )}
            </Button>
          </form>
        ) : (
          <>
            <InfoRow label="Status" value={session.user.status} />
            <InfoRow label="Organization" value={session.organization.name} />
            <InfoRow label="Membership" value={session.membershipStatus} />
            <div className="flex items-baseline justify-between border-b border-border pb-3 last:border-0 last:pb-0">
              <span className="text-sm text-muted-foreground">Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {session.roles.map((role) => (
                  <Badge key={role.id} variant="secondary">{role.name}</Badge>
                ))}
              </div>
            </div>
            <InfoRow label="Session expires" value={new Date(session.expiresAt).toLocaleString()} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
