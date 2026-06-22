"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PagePreloader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setLoading(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setLoading(false);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_300ms_ease-out]">
      {children}
    </div>
  );
}
