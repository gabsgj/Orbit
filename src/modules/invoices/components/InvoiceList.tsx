"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { EmptyState } from "@/shared/ui";
import { formatINR, formatDate } from "@/shared/lib/money";
import { isPastDue } from "@/shared/lib/dates";
import type { InvoiceStatus } from "@prisma/client";

interface InvoiceListProps {
  onSelectInvoice?: (id: string) => void;
}

export function InvoiceList({ onSelectInvoice }: InvoiceListProps) {
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | undefined>(undefined);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = trpc.invoices.list.useQuery({
    status: overdueOnly ? undefined : selectedStatus,
    overdueOnly: overdueOnly ? true : undefined,
    search: search.trim() || undefined,
    limit: 50,
  });

  const invoices = data?.items;
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Invoices</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Generated billing invoices, collections, and settlement tracking (FR-INV-01…05).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(false);
              setSelectedStatus(undefined);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !overdueOnly && selectedStatus === undefined
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            All Invoices
          </button>
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(false);
              setSelectedStatus("DRAFT");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !overdueOnly && selectedStatus === "DRAFT"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(false);
              setSelectedStatus("CONFIRMED");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !overdueOnly && selectedStatus === "CONFIRMED"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            Confirmed
          </button>
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(false);
              setSelectedStatus("PAID");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !overdueOnly && selectedStatus === "PAID"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            Paid
          </button>
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(true);
              setSelectedStatus(undefined);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              overdueOnly
                ? "bg-[hsl(var(--status-overdue-ink))] text-white border-transparent"
                : "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))] border-[hsl(var(--status-overdue-ink))]/20 hover:opacity-80"
            }`}
          >
            ⚠ Overdue Only
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs placeholder:text-[hsl(var(--placeholder-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[hsl(var(--muted))] rounded" />
          <div className="h-20 bg-[hsl(var(--muted))]/60 rounded" />
        </div>
      )}

      {isError && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-4 text-xs text-[hsl(var(--status-overdue-ink))]">
          Error loading invoices: {error.message}{" "}
          <button type="button" onClick={() => refetch()} className="underline font-semibold ml-2">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && invoices && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices found"
              description="No invoices match the current filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
                <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Invoice #</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Subscription</th>
                    <th className="px-4 py-3 font-semibold">Issue Date</th>
                    <th className="px-4 py-3 font-semibold">Due Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Grand Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Outstanding</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
                  {invoices.map((inv) => {
                    const grandTotal = Number(inv.grandTotal);
                    const paid = Number(inv.amountPaid);
                    const outstanding = Math.max(0, grandTotal - paid);
                    const overdue = inv.status === "CONFIRMED" && isPastDue(inv.dueDate);

                    return (
                      <tr
                        key={inv.id}
                        className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors"
                        onClick={() => onSelectInvoice?.(inv.id)}
                      >
                        <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{inv.number}</td>
                        <td className="px-4 py-3">{inv.customer.companyName}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                          {inv.subscription?.number ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(inv.issueDate)}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={inv.status} isOverdue={overdue} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[hsl(var(--foreground))] tabular-nums">
                          {formatINR(grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--status-active-ink))] tabular-nums">
                          {formatINR(paid)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[hsl(var(--foreground))] tabular-nums">
                          {formatINR(outstanding)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInvoice?.(inv.id);
                            }}
                            className="rounded-full px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--tint-blue))] transition-colors"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totals Summary Footer (FR-INV-05) */}
                {totals && (
                  <tfoot className="bg-[hsl(var(--muted))] font-semibold text-[hsl(var(--foreground))] border-t-2 border-[hsl(var(--border))]">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right font-bold uppercase text-[11px]">
                        Totals Summary:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[hsl(var(--foreground))] tabular-nums">
                        {formatINR(totals.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[hsl(var(--status-active-ink))] tabular-nums">
                        {formatINR(totals.amountPaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[hsl(var(--status-overdue-ink))] tabular-nums">
                        {formatINR(totals.outstanding)}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
