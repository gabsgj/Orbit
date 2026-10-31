"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500">
            Generated billing invoices, collections, and settlement tracking (FR-INV-01…05).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(false);
              setSelectedStatus(undefined);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              !overdueOnly && selectedStatus === undefined
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              !overdueOnly && selectedStatus === "DRAFT"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              !overdueOnly && selectedStatus === "CONFIRMED"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              !overdueOnly && selectedStatus === "PAID"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className={`rounded-md px-3 py-1.5 text-xs font-medium border ${
              overdueOnly
                ? "bg-red-600 text-white border-red-700"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
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
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          Error loading invoices: {error.message}{" "}
          <button type="button" onClick={() => refetch()} className="underline font-semibold ml-2">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && invoices && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No invoices found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map((inv) => {
                    const grandTotal = Number(inv.grandTotal);
                    const paid = Number(inv.amountPaid);
                    const outstanding = Math.max(0, grandTotal - paid);
                    const overdue = inv.status === "CONFIRMED" && isPastDue(inv.dueDate);

                    return (
                      <tr
                        key={inv.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => onSelectInvoice?.(inv.id)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.number}</td>
                        <td className="px-4 py-3">{inv.customer.companyName}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {inv.subscription?.number ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={inv.status} isOverdue={overdue} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatINR(grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          {formatINR(paid)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatINR(outstanding)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInvoice?.(inv.id);
                            }}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
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
                  <tfoot className="bg-slate-100 font-semibold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right font-bold uppercase text-[11px]">
                        Totals Summary:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatINR(totals.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800">
                        {formatINR(totals.amountPaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-800">
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

