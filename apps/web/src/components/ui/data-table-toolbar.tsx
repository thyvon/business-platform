"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 350;

export interface DataTableToolbarFilter {
  id: string;
  label: string;
  placeholder?: string;
  options: SelectOption[];
}

export function DataTableToolbar({
  searchPlaceholder = "Search...",
  filters,
  children,
  className,
}: {
  searchPlaceholder?: string;
  filters?: DataTableToolbarFilter[];
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateUrl = useCallback(
    (changes: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(href as Route, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (search.trim() === (searchParams.get("search") ?? "")) return;
    const timeout = window.setTimeout(() => {
      updateUrl({ search: search.trim() || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [search, searchParams, updateUrl]);

  const hasAnyFilter =
    search ||
    (filters ?? []).some((f) => searchParams.get(f.id));

  return (
    <Card className={cn("py-0", className)}>
      <CardContent className="p-2 sm:p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="toolbar-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {filters?.map((filter) => {
            const currentValue = searchParams.get(filter.id) ?? "";
            return (
              <div key={filter.id}>
                <Select
                  id={`toolbar-filter-${filter.id}`}
                  value={currentValue || null}
                  onValueChange={(next) => updateUrl({ [filter.id]: next ?? undefined })}
                  placeholder={filter.placeholder ?? "All"}
                  options={filter.options}
                />
              </div>
            );
          })}

          {children}

          {hasAnyFilter && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                const params = new URLSearchParams(searchParams.toString());
                for (const key of params.keys()) {
                  if (key !== "page") params.delete(key);
                }
                const qs = params.toString();
                const href = qs ? `${pathname}?${qs}` : pathname;
                startTransition(() => {
                  router.replace(href as Route, { scroll: false });
                });
              }}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
