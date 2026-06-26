import type { ReactNode } from "react";
import type { Route } from "next";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePageSizeControl, DataTablePaginationBar } from "@/components/ui/data-table-pagination-bar";
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
  toolbar?: ReactNode;
  showPageSizeControl?: boolean;
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
  toolbar,
  showPageSizeControl = true,
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
  const shouldRenderTopControls = Boolean(toolbar || (pagination && showPageSizeControl));

  return (
    <div className={cn("space-y-2", className)} aria-busy={loading || undefined}>
      {shouldRenderTopControls && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {toolbar && <div className="min-w-0 flex-1">{toolbar}</div>}
          {pagination && showPageSizeControl && (
            <div className="flex shrink-0 items-center justify-end">
              <DataTablePageSizeControl pagination={pagination} pageSizeOptions={pageSizeOptions} />
            </div>
          )}
        </div>
      )}
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
                        <h2 className="text-base font-semibold leading-6 text-foreground">{emptyTitle}</h2>
                        {emptyDescription && (
                          <p className="mt-2 text-sm leading-5 text-muted-foreground">{emptyDescription}</p>
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
          <CardFooter className="border-t px-3 py-2 sm:px-4">
            <DataTablePaginationBar
              pagination={pagination}
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
    <div role="status" aria-label={label} className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-12 text-sm leading-5 text-muted-foreground">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
