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
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "./icons";
import { cn } from "@/shared/lib/utils";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  pageSize?: number;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching your current filter criteria.",
  emptyAction,
  toolbarActions,
  pageSize = 10,
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

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar: Search input + custom actions + summary count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-8 text-xs bg-[hsl(var(--card))]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {toolbarActions}
          <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
            {table.getFilteredRowModel().rows.length} total
          </span>
        </div>
      </div>

      {/* Table Frame */}
      <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns.length} />
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-11"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-48 text-center p-0"
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

        {/* Keyset / Page Navigation Footer */}
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))]">
          <div className="tabular-nums">
            Showing{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                (table.getFilteredRowModel().rows.length > 0 ? 1 : 0)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            results
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeftIcon size={12} className="mr-1" />
              Previous
            </Button>
            <span className="text-xs tabular-nums">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 px-2 text-xs"
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
