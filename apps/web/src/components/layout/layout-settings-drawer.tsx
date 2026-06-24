"use client";

import { Radius } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useCornerRadius } from "@/lib/corner-radius-context";

const radiusLabels = ["None", "0.5×", "1×", "1.5×", "2×"];

export function LayoutSettingsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { scheme, setScheme } = useColorScheme();
  const { value: radiusValue, setValue: setRadiusValue } = useCornerRadius();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" className="w-full sm:w-80">
        <SheetHeader>
          <SheetTitle>Layout settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-4">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Accent color
            </h3>
            <div className="flex gap-3">
              {([["emerald", "#059669"], ["indigo", "#4f46e5"], ["orange", "#f97316"], ["gray", "#6b7280"]] as const).map(([s, color]) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setScheme(s)}
                  aria-pressed={scheme === s}
                  aria-label={`Use ${s} accent color`}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium capitalize transition ${
                    scheme === s
                      ? "border-transparent outline-2 outline-offset-1"
                      : "border-border hover:bg-muted"
                  }`}
                  style={scheme === s ? { outlineColor: color } : undefined}
                >
                  <span
                    className="size-6 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Radius className="size-4" /> Corner radius
            </h3>
            <div className="space-y-3">
              <input
                type="range"
                min={0}
                max={20}
                value={radiusValue}
                onChange={(e) => setRadiusValue(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {radiusLabels.map((label, i) => (
                  <span key={label} className={i * 5 === radiusValue ? "font-semibold text-primary" : ""}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
