import type { Metadata } from "next";
export const metadata: Metadata = { title: "Products" };
export default function ProductsPage() { return <Placeholder title="Products" description="Catalog management will migrate here from the current application." />; }
function Placeholder({ title, description }: { title: string; description: string }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 dark:border-slate-700 dark:bg-slate-900"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p></section>; }
