"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { formatINR, formatDate } from "@/shared/lib/money";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui";
import { RecordPaymentDialog } from "@/modules/payments/client";

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
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Payments & Collections</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Audit recorded payments, monitor overdue receivables, and settle invoices
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex gap-4">
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--tint-green))] px-4 py-3 shadow-[var(--shadow-soft)]">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[hsl(var(--tint-green-ink))]">Total Collected (Recent)</span>
            <p className="text-lg font-bold tabular-nums text-[hsl(var(--tint-green-ink))]">{formatINR(totalCollected)}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--tint-rose))] px-4 py-3 shadow-[var(--shadow-soft)]">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[hsl(var(--tint-rose-ink))]">Overdue Receivables</span>
            <p className="text-lg font-bold tabular-nums text-[hsl(var(--tint-rose-ink))]">{formatINR(totalOverdue)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))]">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "transactions"
              ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          Transactions Ledger ({payments?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "overdue"
              ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <span>Overdue Invoices</span>
          {overdueInvoices && overdueInvoices.length > 0 && (
            <span className="rounded-full bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-ink))] text-[10px] font-bold px-1.5 py-0.5">
              {overdueInvoices.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "transactions" ? (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">
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
            <tbody className="divide-y divide-[hsl(var(--border))]/50">
              {loadingPayments ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[hsl(var(--muted-foreground))]">Loading payment ledger…</td>
                </tr>
              ) : !payments || payments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No payment transactions found"
                      description="Recorded payments will appear here once invoices are settled."
                    />
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[hsl(var(--muted))]/50 transition-colors">
                    <td className="py-2.5 px-3 text-[hsl(var(--muted-foreground))]">{formatDate(new Date(p.paidAt))}</td>
                    <td className="py-2.5 px-3 font-medium text-[hsl(var(--foreground))]">{p.invoice.number}</td>
                    <td className="py-2.5 px-3 text-[hsl(var(--foreground))]">{p.invoice.customer.companyName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="draft">{p.method}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-[hsl(var(--muted-foreground))]">{p.recordedBy.email}</td>
                    <td className="py-2.5 px-3 text-[hsl(var(--muted-foreground))] italic">{p.note || "—"}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[hsl(var(--status-active-ink))]">
                      +{formatINR(Number(p.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">
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
            <tbody className="divide-y divide-[hsl(var(--border))]/50">
              {loadingOverdue ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[hsl(var(--muted-foreground))]">Checking overdue invoices…</td>
                </tr>
              ) : !overdueInvoices || overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="Zero overdue invoices"
                      description="All receivables are current. Excellent collections performance."
                    />
                  </td>
                </tr>
              ) : (
                overdueInvoices.map((inv) => {
                  const grandTotal = Number(inv.grandTotal);
                  const amountPaid = Number(inv.amountPaid);
                  const outstanding = Math.max(0, grandTotal - amountPaid);

                  return (
                    <tr key={inv.id} className="hover:bg-[hsl(var(--status-warning-bg))]/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[hsl(var(--foreground))]">{inv.number}</td>
                      <td className="py-2.5 px-3 text-[hsl(var(--foreground))]">{inv.customer.companyName}</td>
                      <td className="py-2.5 px-3 text-[hsl(var(--status-warning-ink))] font-semibold">
                        {formatDate(new Date(inv.dueDate))} (Overdue)
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{formatINR(grandTotal)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{formatINR(amountPaid)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[hsl(var(--status-warning-ink))]">
                        {formatINR(outstanding)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-7 rounded-full"
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
