"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { CurrentSession } from "@business/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function LoginForm({
  returnPath,
  notice,
}: {
  returnPath: string;
  notice?: string | null;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      await apiRequest<CurrentSession>("/auth/login", {
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      router.replace(returnPath as Route);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Sign in is temporarily unavailable. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="shadow-xl ring-0">
      <form onSubmit={handleSubmit}>
      <CardContent className="p-8 sm:p-10">
      {notice && !errorMessage && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"
        >
          {notice}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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

      <div className="mt-7">
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-2.5">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={submitting}
            className="h-12 pr-12"
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

      <Button
        type="submit"
        disabled={submitting}
        className="mt-8 w-full py-6 text-base"
      >
        {submitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            Sign in
          </>
        )}
      </Button>
      </CardContent>
      </form>
    </Card>
  );
}