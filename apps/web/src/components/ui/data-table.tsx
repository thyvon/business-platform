import type { ReactNode } from "react";
import type { Route } from "next";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePaginationBar } from "@/components/ui/data-table-pagination-bar";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface DataTableColumn<TItem> {
  id: string;
  header: ReactNode;
  cell: (item: TItem) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  previousHref: Route;
  nextHref: Route;
  pageSizeHrefs?: Record<number, Route>;
}

export interface DataTableProps<TItem> {
  columns: Array<DataTableColumn<TItem>>;
  items: TItem[];
  getItemKey: (item: TItem) => string;
  emptyTitle: string;
  emptyDescription?: string;
  pagination?: DataTablePagination;
  pageSizeOptions?: number[];
  minWidthClassName?: string;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
}

export function DataTable<TItem>({
  columns,
  items,
  getItemKey,
  emptyTitle,
  emptyDescription,
  pagination,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  minWidthClassName = "min-w-[760px]",
  loading = false,
  loadingLabel = "Loading rows",
  className,
}: DataTableProps<TItem>) {
  const showingStart = pagination && pagination.total > 0
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const showingEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : items.length;
  const hasRows = items.length > 0;

  return (
    <div className={cn("space-y-3", className)} aria-busy={loading || undefined}>
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className={minWidthClassName}>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.id} className={column.headerClassName}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <DataTablePreloader label={loadingLabel} />
                    </TableCell>
                  </TableRow>
                ) : hasRows ? (
                  items.map((item) => (
                    <TableRow key={getItemKey(item)}>
                      {columns.map((column) => (
                        <TableCell key={column.id} className={column.className}>
                          {column.cell(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="px-6 py-12 text-center">
                        <h2 className="text-base font-semibold text-foreground">{emptyTitle}</h2>
                        {emptyDescription && (
                          <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {pagination && (
          <CardFooter className="border-t-0 px-0 py-3">
            <DataTablePaginationBar
              pagination={pagination}
              pageSizeOptions={pageSizeOptions}
              showingStart={showingStart}
              showingEnd={showingEnd}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function DataTablePreloader({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-12 text-sm text-muted-foreground">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
