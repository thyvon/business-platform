"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "@/components/ui/icons";
import { apiRequest } from "@/lib/api-client";

type Health = { status: string; database: string; timestamp: string };

export function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<Health>("/health")
      .then((result) => { if (active) setHealth(result); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  if (failed) {
    return <StatusCard icon={<TriangleAlert />} title="API unavailable" detail="Start the Express API on port 4000." tone="warning" />;
  }
  if (!health) {
    return <StatusCard icon={<LoaderCircle className="animate-spin" />} title="Checking services" detail="Contacting the application APIâ€¦" tone="neutral" />;
  }
  return <StatusCard icon={<CheckCircle2 />} title="Platform healthy" detail={`MySQL ${health.database}`} tone="success" />;
}

function StatusCard({ icon, title, detail, tone }: { icon: React.ReactNode; title: string; detail: string; tone: "success" | "warning" | "neutral" }) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    neutral: "border-border bg-card text-card-foreground",
  };
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${tones[tone]}`}>
      <span className="[&>svg]:size-5">{icon}</span>
      <div><p className="text-sm font-semibold">{title}</p><p className="text-xs opacity-75">{detail}</p></div>
    </div>
  );
}

