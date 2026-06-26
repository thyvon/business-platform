"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterLines, Search, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 350;

export interface DataTableToolbarFilter {
  id: string;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  searchable?: boolean;
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
  const hasFilters = Boolean(filters?.length);
  const activeFilterCount = useMemo(
    () => filters?.filter((filter) => Boolean(searchParams.get(filter.id))).length ?? 0,
    [filters, searchParams],
  );
  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0);

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
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (search.trim() === (searchParams.get("search") ?? "")) return;
    const timeout = window.setTimeout(() => {
      updateUrl({ search: search.trim() || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [search, searchParams, updateUrl]);


  return (
    <div
      className={cn(
        "rounded-2xl border border-white/50 bg-white/55 p-2 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.08]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
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

        {hasFilters ? (
          <Button
            type="button"
            variant={filtersOpen ? "secondary" : "outline"}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="data-table-filter-pane"
            className="shrink-0"
          >
            <FilterLines className="size-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        ) : null}

        {children ? <div className="ml-auto flex shrink-0 items-center">{children}</div> : null}
      </div>

      {hasFilters ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
            filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div
              id="data-table-filter-pane"
              aria-hidden={!filtersOpen}
              className={cn(
                "grid gap-2 border-t border-border/70 pt-2 transition-transform duration-200 ease-out sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end motion-reduce:transition-none",
                filtersOpen ? "translate-y-0" : "-translate-y-1",
              )}
            >
              {filters?.map((filter) => {
                const currentValue = searchParams.get(filter.id) ?? "";
                return (
                  <div key={filter.id} className="min-w-44 lg:w-48">
                    <label htmlFor={`toolbar-filter-${filter.id}`} className="sr-only">
                      {filter.label}
                    </label>
                    {filter.searchable ? (
                      <Combobox
                        id={`toolbar-filter-${filter.id}`}
                        value={currentValue || null}
                        onValueChange={(next) => updateUrl({ [filter.id]: next ?? undefined })}
                        placeholder={filter.placeholder ?? "All"}
                        options={filter.options}
                        clearable
                      />
                    ) : (
                      <Select
                        id={`toolbar-filter-${filter.id}`}
                        value={currentValue || null}
                        onValueChange={(next) => updateUrl({ [filter.id]: next ?? undefined })}
                        placeholder={filter.placeholder ?? "All"}
                        options={filter.options}
                        clearable
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}









