import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
  previousHref: string;
  nextHref: string;
}

export interface DataTableProps<TItem> {
  columns: Array<DataTableColumn<TItem>>;
  items: TItem[];
  getItemKey: (item: TItem) => string;
  emptyTitle: string;
  emptyDescription?: string;
  pagination?: DataTablePagination;
  minWidthClassName?: string;
  renderMobileItem?: (item: TItem) => ReactNode;
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
  minWidthClassName = "min-w-[760px]",
  renderMobileItem,
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
          {renderMobileItem && !loading && !hasRows && (
            <div className="px-6 py-12 text-center md:hidden">
              <h2 className="text-base font-semibold text-foreground">{emptyTitle}</h2>
              {emptyDescription && (
                <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
              )}
            </div>
          )}
          {loading && renderMobileItem && (
            <div className="md:hidden">
              <DataTablePreloader label={loadingLabel} />
            </div>
          )}
          {renderMobileItem && !loading && hasRows && (
            <div className="divide-y divide-border md:hidden">
              {items.map((item) => (
                <div key={getItemKey(item)} className="p-4">
                  {renderMobileItem(item)}
                </div>
              ))}
            </div>
          )}
          <div className={cn("overflow-x-auto", renderMobileItem && "hidden md:block")}>
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
      </Card>

      {pagination && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {showingStart}-{showingEnd} of {pagination.total} rows
          </span>
          <div className="flex gap-2">
            <Link
              href={pagination.previousHref as Route}
              aria-disabled={pagination.page <= 1}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: pagination.page <= 1 ? "pointer-events-none opacity-50" : "",
              })}
            >
              Previous
            </Link>
            <Link
              href={pagination.nextHref as Route}
              aria-disabled={pagination.totalPages <= pagination.page}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: pagination.totalPages <= pagination.page ? "pointer-events-none opacity-50" : "",
              })}
            >
              Next
            </Link>
          </div>
        </div>
      )}
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