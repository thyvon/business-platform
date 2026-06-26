import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { ShieldAlert } from "@/components/ui/icons";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access denied" };

export default function AccessDeniedPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">Access denied</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Your account does not have permission to open this area. Ask an administrator if you need access for your work.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={"/" as Route} className={buttonVariants()}>
          Go to dashboard
        </Link>
        <Link href={"/profile" as Route} className={buttonVariants({ variant: "outline" })}>
          View profile
        </Link>
      </div>
    </section>
  );
}
