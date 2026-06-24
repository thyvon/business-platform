"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CurrentSession } from "@business/contracts";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function LoginForm() {
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
      router.replace("/");
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-8"
    >
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          disabled={submitting}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-950"
          placeholder="you@company.com"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-11 pl-3.5 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-950"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={submitting}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-indigo-950"
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
      </button>
    </form>
  );
}