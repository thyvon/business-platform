import type { Metadata } from "next";
export const metadata: Metadata = { title: "Products" };
export default function ProductsPage() { return <Placeholder title="Products" description="Catalog management will migrate here from the current application." />; }
function Placeholder({ title, description }: { title: string; description: string }) { return <section className="rounded-xl border border-dashed border-border bg-card p-8"><h1 className="text-xl font-bold text-foreground">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></section>; }
