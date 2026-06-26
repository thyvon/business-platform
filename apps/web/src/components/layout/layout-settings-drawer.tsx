"use client";

import { Check, Radius } from "@/components/ui/icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useColorScheme, type ColorScheme } from "@/lib/color-scheme-context";
import { useCornerRadius } from "@/lib/corner-radius-context";

const colorOptions: Array<{ value: ColorScheme; label: string; color: string; soft: string }> = [
  { value: "indigo", label: "Indigo", color: "#4f46e5", soft: "#e0e7ff" },
  { value: "emerald", label: "Emerald", color: "#059669", soft: "#d1fae5" },
  { value: "orange", label: "Orange", color: "#f97316", soft: "#ffedd5" },
  { value: "gray", label: "Gray", color: "#6b7280", soft: "#f3f4f6" },
];

const radiusOptions = [
  { value: 0, label: "None" },
  { value: 5, label: "Compact" },
  { value: 10, label: "Default" },
  { value: 15, label: "Soft" },
  { value: 20, label: "Round" },
];

export function LayoutSettingsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { scheme, setScheme } = useColorScheme();
  const { value: radiusValue, setValue: setRadiusValue } = useCornerRadius();

  const selectedRadius = radiusOptions.reduce((closest, option) => (
    Math.abs(option.value - radiusValue) < Math.abs(closest.value - radiusValue) ? option : closest
  ), radiusOptions[0]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-white/40 bg-background/80 shadow-2xl supports-backdrop-filter:backdrop-blur-2xl sm:w-[25rem] dark:border-white/15 dark:bg-background/85"
      >
        <SheetHeader className="px-5 pb-2 pt-5">
          <SheetTitle className="text-lg font-semibold leading-7">Controls</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">
          <div className="grid gap-3">
            <section className="rounded-2xl border border-white/50 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.08]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold leading-5 text-foreground">Accent</h3>
                <span className="text-xs font-medium leading-4 text-muted-foreground">{scheme}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => {
                  const active = scheme === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setScheme(option.value)}
                      aria-pressed={active}
                      aria-label={`Use ${option.label} accent color`}
                      title={option.label}
                      className={cn(
                        "relative flex h-16 items-center justify-center rounded-2xl border transition hover:scale-[1.02] hover:bg-white/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] dark:hover:bg-white/[0.16]",
                        active ? "border-primary bg-white text-primary shadow-sm dark:bg-white/[0.14]" : "border-white/50 bg-white/45 dark:border-white/15 dark:bg-white/5",
                      )}
                    >
                      <span
                        className="flex size-9 items-center justify-center rounded-full shadow-inner ring-1 ring-black/5"
                        style={{ backgroundColor: option.soft }}
                      >
                        <span className="size-6 rounded-full shadow-sm" style={{ backgroundColor: option.color }} />
                      </span>
                      {active ? (
                        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="size-3" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/50 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.08]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold leading-5 text-foreground">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Radius className="size-4" />
                  </span>
                  Radius
                </h3>
                <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium leading-4 text-muted-foreground shadow-sm dark:bg-white/[0.08]">
                  {selectedRadius.label}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {radiusOptions.map((option) => {
                  const active = option.value === selectedRadius.value;
                  const radiusPx = option.value === 0 ? 0 : 4 + option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setRadiusValue(option.value)}
                      aria-pressed={active}
                      aria-label={`Use ${option.label.toLowerCase()} corner radius`}
                      title={option.label}
                      className={cn(
                        "flex h-14 items-center justify-center rounded-2xl border transition hover:scale-[1.02] hover:bg-white/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] dark:hover:bg-white/[0.16]",
                        active ? "border-primary bg-white shadow-sm dark:bg-white/[0.14]" : "border-white/50 bg-white/45 dark:border-white/15 dark:bg-white/5",
                      )}
                    >
                      <span
                        className={cn("block size-7 border-2", active ? "border-primary bg-primary/10" : "border-muted-foreground/40")}
                        style={{ borderRadius: `${radiusPx}px` }}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-background/70 px-3 py-3 shadow-inner dark:bg-black/15">
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={radiusValue}
                  onChange={(e) => setRadiusValue(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Corner radius"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium leading-4 text-muted-foreground">
                  <span>Sharp</span>
                  <span>Balanced</span>
                  <span>Round</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


