import Image from "next/image";
import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getCurrentSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();
  if (session) redirect("/" as Route);

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-7/12 flex-col justify-between bg-cover bg-center lg:flex" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop)" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div />
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Secure account recovery
              </h1>
              <p className="mt-3 text-base text-white/70">
                Request a one-time link to safely reset your password.
              </p>
            </div>
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
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
