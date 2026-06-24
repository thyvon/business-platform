import { ArrowRight, Boxes, Building2, PackageSearch, ShoppingCart } from "lucide-react";
import { SystemStatus } from "@/features/dashboard/components/system-status";

const modules = [
  { title: "Product Catalog", description: "Govern SKUs, categories, units, pricing, and lifecycle status.", icon: PackageSearch },
  { title: "Supplier Management", description: "Onboard vendors and maintain commercial and banking details.", icon: Building2 },
  { title: "Procurement", description: "Plan purchase requests, approvals, orders, and receiving.", icon: ShoppingCart },
  { title: "Inventory", description: "Track stock movement, warehouses, transfers, and adjustments.", icon: Boxes },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 px-7 py-9 text-white shadow-xl shadow-slate-200 dark:shadow-none">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Operations workspace</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">A clean foundation for the business you are building.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">The platform is separated into focused modules so products, suppliers, procurement, and inventory can grow without becoming one giant code file.</p>
      </section>
      <SystemStatus />
      <section>
        <div className="mb-4"><h2 className="text-lg font-bold">Business modules</h2><p className="text-sm text-slate-500 dark:text-slate-400">Add workflows one domain at a time.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map(({ title, description, icon: Icon }) => (
            <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              <div className="flex items-start justify-between"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Icon className="size-5" /></span><ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" /></div>
              <h3 className="mt-5 font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
