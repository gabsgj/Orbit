"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Input } from "./input";
import { Button } from "./button";
import { TableRowSkeleton } from "./skeleton";
import { EmptyState } from "./empty-state";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  SortAscIcon,
  SortDescIcon,
  SortNeutralIcon,
} from "./icons";
import { cn } from "@/shared/lib/utils";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search records...",
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load records. Please try again.",
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching your current filter criteria.",
  emptyAction,
  toolbarActions,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  className,
}: DataTableProps<TData, TValue>) {
  void searchKey;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPageSize = table.getState().pagination.pageSize;
  const totalPages = Math.max(1, table.getPageCount());

  return (
    <div className={cn("space-y-3", className)}>
      {/* ── Toolbar: Search, Filters & Summary ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none"
              aria-hidden="true"
            />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs bg-[hsl(var(--card))]"
              aria-label={searchPlaceholder}
            />
            {globalFilter ? (
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xs p-0.5 rounded-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {toolbarActions}
          <div className="flex items-center gap-2">
            <label htmlFor="page-size-select" className="text-[11px] text-[hsl(var(--muted-foreground))] sr-only sm:not-sr-only">
              Show:
            </label>
            <select
              id="page-size-select"
              value={currentPageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-8 rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 text-xs text-[hsl(var(--foreground))] focus:outline-hidden focus:ring-1 focus:ring-[hsl(var(--ring))]"
              aria-label="Select number of records per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
            <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums ml-1">
              {filteredCount} {filteredCount === 1 ? "record" : "records"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Table Container with Sticky Header ──────────────────────────── */}
      <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-xs">
        <div className="max-h-[560px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-[hsl(var(--muted))]/80 backdrop-blur-xs z-10 border-b border-[hsl(var(--border))]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();

                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={
                          sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                            ? "descending"
                            : "none"
                        }
                        className={cn(
                          "whitespace-nowrap text-xs font-semibold select-none",
                          canSort && "cursor-pointer transition-colors hover:text-[hsl(var(--foreground))]"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort ? (
                            <span className="inline-flex text-[hsl(var(--muted-foreground))]">
                              {sortDirection === "asc" ? (
                                <SortAscIcon size={12} className="text-[hsl(var(--foreground))]" />
                              ) : sortDirection === "desc" ? (
                                <SortDescIcon size={12} className="text-[hsl(var(--foreground))]" />
                              ) : (
                                <SortNeutralIcon size={12} className="opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          ) : null}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: Math.min(5, currentPageSize) }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={columns.length} />
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-44 text-center p-0"
                  >
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <p className="text-sm font-semibold text-[hsl(var(--status-overdue-ink))]">
                        Unable to load data
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm">
                        {errorMessage}
                      </p>
                      {onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRetry}
                          className="mt-2 text-xs h-7 px-3"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="h-10 transition-colors hover:bg-[hsl(var(--muted))]/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-44 text-center p-0"
                  >
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      action={emptyAction}
                      className="border-0 bg-transparent py-8"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Keyset / Page Navigation Footer ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[hsl(var(--border))] px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))] gap-2">
          <div className="tabular-nums text-center sm:text-left">
            Showing{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {filteredCount > 0 ? pageIndex * currentPageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {Math.min((pageIndex + 1) * currentPageSize, filteredCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {filteredCount}
            </span>{" "}
            results
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 px-2.5 text-xs"
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon size={12} className="mr-1" />
              Previous
            </Button>
            <span className="text-xs tabular-nums px-1 font-medium text-[hsl(var(--foreground))]">
              Page {pageIndex + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 px-2.5 text-xs"
              aria-label="Go to next page"
            >
              Next
              <ChevronRightIcon size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
