"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { formatINR, formatDate } from "@/shared/lib/money";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { RecordPaymentDialog } from "@/modules/payments";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "overdue">("transactions");
  const [paymentTarget, setPaymentTarget] = useState<{ id: string; outstanding: number } | null>(null);

  const { data: payments, isLoading: loadingPayments } = trpc.payments.list.useQuery({ limit: 50 });
  const { data: overdueInvoices, isLoading: loadingOverdue } = trpc.payments.overdue.useQuery();

  const totalCollected = (payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
  const totalOverdue = (overdueInvoices ?? []).reduce((acc, inv) => {
    const outstanding = Number(inv.grandTotal) - Number(inv.amountPaid);
    return acc + Math.max(0, outstanding);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payments & Collections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit recorded payments, monitor overdue receivables, and settle invoices
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex gap-4">
          <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total Collected (Recent)</span>
            <p className="text-base font-bold text-green-700 tabular-nums">{formatINR(totalCollected)}</p>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Overdue Receivables</span>
            <p className="text-base font-bold text-amber-700 tabular-nums">{formatINR(totalOverdue)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "transactions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Transactions Ledger ({payments?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "overdue"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Overdue Invoices</span>
          {overdueInvoices && overdueInvoices.length > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2">
              {overdueInvoices.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "transactions" ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3">Note</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingPayments ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">Loading payment ledger…</td>
                </tr>
              ) : !payments || payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No payment transactions found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(new Date(p.paidAt))}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{p.invoice.number}</td>
                    <td className="py-2.5 px-3 text-slate-700">{p.invoice.customer.companyName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="draft">{p.method}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{p.recordedBy.email}</td>
                    <td className="py-2.5 px-3 text-slate-500 italic">{p.note || "—"}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-green-700">
                      +{formatINR(Number(p.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Grand Total</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingOverdue ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">Checking overdue invoices…</td>
                </tr>
              ) : !overdueInvoices || overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-green-600 font-medium">
                    🎉 Excellent! Zero overdue invoices.
                  </td>
                </tr>
              ) : (
                overdueInvoices.map((inv) => {
                  const grandTotal = Number(inv.grandTotal);
                  const amountPaid = Number(inv.amountPaid);
                  const outstanding = Math.max(0, grandTotal - amountPaid);

                  return (
                    <tr key={inv.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{inv.number}</td>
                      <td className="py-2.5 px-3 text-slate-700">{inv.customer.companyName}</td>
                      <td className="py-2.5 px-3 text-amber-700 font-semibold">
                        {formatDate(new Date(inv.dueDate))} (Overdue)
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{formatINR(grandTotal)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{formatINR(amountPaid)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-amber-800">
                        {formatINR(outstanding)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-7"
                          onClick={() => setPaymentTarget({ id: inv.id, outstanding })}
                        >
                          Record Payment
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Dialog */}
      {paymentTarget && (
        <RecordPaymentDialog
          invoiceId={paymentTarget.id}
          outstandingBalance={paymentTarget.outstanding}
          onClose={() => setPaymentTarget(null)}
        />
      )}
    </div>
  );
}
