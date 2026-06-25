import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { AcceptInvitationForm } from "@/features/invitations/components/accept-invitation-form";
import { getCurrentSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Accept invitation" };

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  if (!token) redirect("/login" as Route);

  const session = await getCurrentSession();
  if (session) redirect("/" as Route);

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-7/12 flex-col justify-between lg:flex" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop)" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div />
          <div>
            <blockquote className="space-y-2">
              <p className="text-lg leading-relaxed">
                &ldquo;You&apos;ve been invited to join the team.&rdquo;
              </p>
              <footer className="text-sm text-white/60">
                Set up your account to get started.
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <AcceptInvitationForm token={token} />
        </div>
      </div>
    </main>
  );
}
