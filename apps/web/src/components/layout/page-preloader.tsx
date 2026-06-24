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
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_300ms_ease-out]">
      {children}
    </div>
  );
}
