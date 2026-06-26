"use client";

import { useRouter } from "next/navigation";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import type { DataTablePagination } from "@/components/ui/data-table";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DataTablePageSizeControl({
  pagination,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: {
  pagination: DataTablePagination;
  pageSizeOptions?: number[];
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-xs leading-4 text-muted-foreground">
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
          triggerClassName="h-8 w-20"
        />
      ) : (
        <span className="font-medium text-foreground">{pagination.pageSize}</span>
      )}
    </div>
  );
}

export function DataTablePaginationBar({
  pagination,
  showingStart,
  showingEnd,
}: {
  pagination: DataTablePagination;
  showingStart: number;
  showingEnd: number;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="text-xs leading-4 text-muted-foreground">
        <span className="whitespace-nowrap">
          {showingStart}-{showingEnd} of {pagination.total}
        </span>
      </div>
      <Pagination className="w-auto sm:ml-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={pagination.previousHref}
              disabled={pagination.page <= 1}
              className="h-8 gap-1 pl-2 pr-2.5 text-xs leading-4"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href={pagination.nextHref}
              disabled={pagination.totalPages <= pagination.page}
              className="h-8 gap-1 pl-2.5 pr-2 text-xs leading-4"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

