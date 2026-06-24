import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/server-auth";
import { ProfileForm } from "@/features/auth/components/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and organization information.
        </p>
      </div>

      <ProfileForm session={session} />
    </section>
  );
}
