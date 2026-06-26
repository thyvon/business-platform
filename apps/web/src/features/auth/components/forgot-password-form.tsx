"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, LoaderCircle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      await apiRequest<void>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
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
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            If an active account exists for that address, we sent a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={"/login" as Route} className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-white/55 px-2.5 text-sm font-medium shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]">
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
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            Enter your email and we will send a secure reset link if your account is active.
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
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              disabled={submitting}
              className="mt-2.5 h-12"
              placeholder="you@company.com"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full py-6 text-base">
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href={"/login" as Route} className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}



