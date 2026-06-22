"use client";

import { Sun, Moon, Radius } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useTheme } from "@/lib/theme-context";
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
  const { theme, toggleTheme } = useTheme();
  const { scheme, setScheme } = useColorScheme();
  const { value: radiusValue, setValue: setRadiusValue } = useCornerRadius();

  return (
    <Drawer open={open} onClose={onClose} title="Layout settings">
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Sun className="size-4" /> Theme
          </h3>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700"
          >
            <span className="text-slate-600 dark:text-slate-400">
              {theme === "light" ? "Light mode" : "Dark mode"}
            </span>
            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {theme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </span>
          </button>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Accent color
          </h3>
          <div className="flex gap-3">
            {([["indigo", "#4f46e5"], ["emerald", "#059669"], ["violet", "#7c3aed"]] as const).map(([s, color]) => (
              <button
                type="button"
                key={s}
                onClick={() => setScheme(s)}
                aria-pressed={scheme === s}
                aria-label={`Use ${s} accent color`}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium capitalize transition ${
                  scheme === s
                    ? "border-slate-900 dark:border-white"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
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
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Radius className="size-4" /> Corner radius
          </h3>
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={20}
              value={radiusValue}
              onChange={(e) => setRadiusValue(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              {radiusLabels.map((label, i) => (
                <span key={label} className={i * 5 === radiusValue ? "font-semibold text-indigo-600 dark:text-indigo-400" : ""}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
