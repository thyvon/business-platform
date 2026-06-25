import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href={"/" as Route} className="transition-colors hover:text-foreground">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Suppliers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="mt-4 rounded-xl border border-dashed border-border bg-card p-8">
        <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
        <p className="mt-2 text-sm text-muted-foreground">Supplier onboarding will migrate here as an isolated business module.</p>
      </section>
    </>
  );
}
