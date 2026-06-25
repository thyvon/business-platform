"use client";

import { useRouter } from "next/navigation";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import type { DataTablePagination } from "@/components/ui/data-table";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DataTablePaginationBar({
  pagination,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showingStart,
  showingEnd,
}: {
  pagination: DataTablePagination;
  pageSizeOptions?: number[];
  showingStart: number;
  showingEnd: number;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {pagination.pageSizeHrefs ? (
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              const href = pagination.pageSizeHrefs![Number(value)];
              if (href) router.push(href);
            }}
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            triggerClassName="h-8 w-16"
          />
        ) : (
          <span className="font-medium">{pagination.pageSize}</span>
        )}
        <span className="whitespace-nowrap">
          {showingStart}-{showingEnd} of {pagination.total}
        </span>
      </div>
      <Pagination className="ml-auto w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={pagination.previousHref}
              disabled={pagination.page <= 1}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href={pagination.nextHref}
              disabled={pagination.totalPages <= pagination.page}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
