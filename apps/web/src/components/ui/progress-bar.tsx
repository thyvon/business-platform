"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    setWidth(0);

    const raf = requestAnimationFrame(() => setWidth(80));
    const t1 = setTimeout(() => setWidth(100), 400);
    const t2 = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 700);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-1 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
