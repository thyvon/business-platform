"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { UserListQuery } from "@business/contracts/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SEARCH_DEBOUNCE_MS = 350;

export function UserListFilters({ query }: { query: UserListQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search ?? "");
  const [status, setStatus] = useState(query.status ?? "");

  const clearHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("status");
    params.delete("page");
    const queryString = params.toString();
    return (queryString ? `${pathname}?${queryString}` : pathname) as Route;
  }, [pathname, searchParams]);

  const updateUrl = useCallback((changes: { search?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (changes.search !== undefined) {
      const trimmed = changes.search.trim();
      if (trimmed) params.set("search", trimmed);
      else params.delete("search");
    }

    if (changes.status !== undefined) {
      if (changes.status) params.set("status", changes.status);
      else params.delete("status");
    }

    params.delete("page");
    const queryString = params.toString();
    const href = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.replace(href as Route, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (search.trim() === (query.search ?? "")) return;

    const timeout = window.setTimeout(() => {
      updateUrl({ search });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [query.search, search, updateUrl]);

  return (
    <Card className="py-0">
      <CardContent className="p-3 sm:p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
          <div>
            <Label htmlFor="search">Search users</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                name="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
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
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              value={status || null}
              onValueChange={(nextStatus) => {
                const statusValue = nextStatus ?? "";
                setStatus(statusValue);
                updateUrl({ status: statusValue });
              }}
              placeholder="All statuses"
              options={statusOptions}
              triggerClassName="mt-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link href={clearHref} className={buttonVariants({ variant: "outline" })}>
              Clear
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];