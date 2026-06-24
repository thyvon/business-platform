import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-7/12 flex-col justify-between lg:flex" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop)" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div />
          <div>
            <blockquote className="space-y-2">
              <p className="text-lg leading-relaxed">
                &ldquo;A clean foundation for the business you are building.&rdquo;
              </p>
              <footer className="text-sm text-white/60">
                Operations workspace
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src="https://sms.mjqeducation.edu.kh/assets/images/logo/logo-dark.png" alt="Logo" className="mx-auto h-14" />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with the account provided by your organization.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}