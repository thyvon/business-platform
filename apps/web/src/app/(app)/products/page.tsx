import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href={"/" as Route} className="transition-colors hover:text-foreground">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Products</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Placeholder title="Products" description="Catalog management will migrate here from the current application." />
    </>
  );
}

function Placeholder({ title, description }: { title: string; description: string }) {
  return <section className="mt-4 rounded-xl border border-dashed border-border bg-card p-8"><h1 className="text-xl font-bold text-foreground">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></section>;
}
