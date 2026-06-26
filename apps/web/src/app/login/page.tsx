import Image from "next/image";
import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSafeReturnPath } from "@/lib/auth-redirect";
import { getCurrentSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnPath = getSafeReturnPath(params.next);
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const session = await getCurrentSession();
  if (session) redirect(returnPath as Route);

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-7/12 flex-col justify-between lg:flex" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop)" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div />
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-base text-white/70">
                Sign in with the account provided by your organization.
              </p>
            </div>
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
      <div className="flex min-h-dvh flex-1 items-center justify-center px-4 sm:py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Image
              src="https://sms.mjqeducation.edu.kh/assets/images/logo/logo-dark.png"
              alt="Logo"
              width={160}
              height={56}
              priority
              className="mx-auto h-14 w-auto"
            />

          </div>
          <LoginForm
            returnPath={returnPath}
            notice={reason === "expired" ? "Your session expired. Please sign in again to continue." : null}
          />
        </div>
      </div>
    </main>
  );
}
