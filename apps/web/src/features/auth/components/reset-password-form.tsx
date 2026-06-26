"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 12) {
      setErrorMessage("Password must be at least 12 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest<void>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Password reset is temporarily unavailable. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="ring-0">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-5" />
          </div>
          <CardTitle className="text-2xl">Password updated</CardTitle>
          <CardDescription>
            You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={"/login" as Route} className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/85">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-0">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <CardTitle className="text-2xl">Create new password</CardTitle>
          <CardDescription>
            Use at least 12 characters. After reset, existing sessions will be signed out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <Label htmlFor="new-password">New password</Label>
            <div className="relative mt-2.5">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={submitting}
                className="h-12 pr-12"
                placeholder="At least 12 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={submitting}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={submitting}
              className="mt-2.5 h-12"
              placeholder="Repeat your password"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full py-6 text-base">
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

