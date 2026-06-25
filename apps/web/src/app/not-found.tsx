import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { FileSearch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 items-center justify-center px-4">
        <section className="mx-auto flex max-w-xl flex-col items-center py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileSearch className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">404</h1>
          <p className="mt-2 text-lg font-medium text-foreground">Page not found</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the URL or head back to the
            dashboard.
          </p>
          <div className="mt-8">
            <Link href={"/" as Route} className={buttonVariants({ size: "lg" })}>
              Go to dashboard
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
