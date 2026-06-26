"use client";

import { useState, type FormEvent } from "react";
import { Check, KeyRound, LoaderCircle, Pencil, X } from "@/components/ui/icons";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { CurrentSession } from "@business/contracts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { buildLoginPath } from "@/lib/auth-redirect";

export function ProfileForm({ session }: { session: CurrentSession }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(session.user.displayName);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  function redirectExpiredSession() {
    router.replace(buildLoginPath("/profile", "expired") as Route);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const newDisplayName = String(form.get("displayName") ?? "").trim();

    if (!newDisplayName) {
      toast.error("Display name is required.");
      setSubmitting(false);
      return;
    }

    try {
      await apiRequest<CurrentSession>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: newDisplayName }),
      });
      setDisplayName(newDisplayName);
      setEditing(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectExpiredSession();
        return;
      }
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      toast.error("The new password and confirmation do not match.");
      setChangingPassword(false);
      return;
    }

    try {
      await apiRequest<CurrentSession>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      formElement.reset();
      toast.success("Password changed. Your active session was refreshed.");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401 && error.code === "AUTHENTICATION_REQUIRED") {
        redirectExpiredSession();
        return;
      }
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Failed to change password. Please try again.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>{displayName}</CardTitle>
              <CardDescription>{session.user.email}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing((value) => !value)}
              aria-label={editing ? "Cancel editing" : "Edit profile"}
            >
              {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
              {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <><LoaderCircle className="size-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="size-4" /> Save changes</>
                )}
              </Button>
            </form>
          ) : (
            <>
              <InfoRow label="Status" value={session.user.status} />
              <InfoRow label="Organization" value={session.organization.name} />
              <InfoRow label="Membership" value={session.membershipStatus} />
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">Roles</span>
                <div className="flex flex-wrap justify-end gap-1.5">
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

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use a strong password with at least 12 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={changingPassword}
                className="mt-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  disabled={changingPassword}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  disabled={changingPassword}
                  className="mt-2"
                />
              </div>
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? (
                <><LoaderCircle className="size-4 animate-spin" /> Updating...</>
              ) : (
                <><KeyRound className="size-4" /> Change password</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

