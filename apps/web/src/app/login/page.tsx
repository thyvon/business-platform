import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            Business Platform
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in with the account provided by your organization.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}