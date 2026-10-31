"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatINR, formatDate } from "@/shared/lib/money";
import { isPastDue } from "@/shared/lib/dates";
import { Button } from "@/shared/ui";

interface InvoiceDetailProps {
  invoiceId: string;
  onBack?: () => void;
  onRecordPayment?: (invoiceId: string, outstanding: number) => void;
}

export function InvoiceDetail({ invoiceId, onBack, onRecordPayment }: InvoiceDetailProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: inv, isLoading, isError, error } = trpc.invoices.get.useQuery({ id: invoiceId });

  const confirmMutation = trpc.invoices.confirm.useMutation({
    onSuccess: () => {
      setSuccessMsg("Invoice confirmed successfully.");
      setActionError(null);
      utils.invoices.get.invalidate({ id: invoiceId });
      utils.invoices.list.invalidate();
    },
    onError: (err) => setActionError(err.message),
  });

  const cancelMutation = trpc.invoices.cancel.useMutation({
    onSuccess: () => {
      setSuccessMsg("Invoice cancelled.");
      setActionError(null);
      utils.invoices.get.invalidate({ id: invoiceId });
      utils.invoices.list.invalidate();
    },
    onError: (err) => setActionError(err.message),
  });

  const sendMutation = trpc.invoices.send.useMutation({
    onSuccess: (data) => {
      setSuccessMsg(`Invoice staged in email outbox for ${data.toEmail}`);
      setActionError(null);
      utils.invoices.get.invalidate({ id: invoiceId });
    },
    onError: (err) => setActionError(err.message),
  });

  const reminderMutation = trpc.invoices.sendReminder.useMutation({
    onSuccess: () => {
      setSuccessMsg("Reminder staged in mail outbox.");
      setActionError(null);
      utils.invoices.get.invalidate({ id: invoiceId });
      utils.invoices.list.invalidate();
    },
    onError: (err) => setActionError(err.message),
  });

  if (isLoading) {
    return <div className="h-64 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))] animate-pulse" />;
  }

  if (isError || !inv) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-6 text-xs text-[hsl(var(--status-overdue-ink))]">
        Error loading invoice: {error?.message ?? "Not found"}{" "}
        {onBack && (
          <button type="button" onClick={onBack} className="underline font-semibold ml-2">
            ← Back
          </button>
        )}
      </div>
    );
  }

  const grandTotal = Number(inv.grandTotal);
  const amountPaid = Number(inv.amountPaid);
  const outstanding = Math.max(0, grandTotal - amountPaid);
  // SRS §6 rule 6: CONFIRMED ∧ due_date < today ∧ outstanding > 0
  const overdue = inv.status === "CONFIRMED" && isPastDue(inv.dueDate) && outstanding > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header — hidden when printing */}
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[hsl(var(--border))] pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              ← Back
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{inv.number}</h1>
              <InvoiceStatusBadge status={inv.status} isOverdue={overdue} />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            🖨 Print Invoice
          </button>

          {/* Send Email Action */}
          <button
            type="button"
            onClick={() => sendMutation.mutate({ invoiceId: inv.id })}
            disabled={sendMutation.isPending}
            className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            {sendMutation.isPending ? "Staging..." : "✉ Send Invoice"}
          </button>

          {/* State Machine Transition Actions */}
          {inv.status === "DRAFT" && (
            <>
              <button
                type="button"
                onClick={() => confirmMutation.mutate({ invoiceId: inv.id })}
                disabled={confirmMutation.isPending}
                className="rounded-full bg-[hsl(var(--status-active-ink))] px-4 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 transition-colors"
              >
                Confirm Invoice
              </button>
              <button
                type="button"
                onClick={() => cancelMutation.mutate({ invoiceId: inv.id })}
                disabled={cancelMutation.isPending}
                className="rounded-full ring-1 ring-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--status-overdue-ink))] hover:bg-[hsl(var(--status-overdue-bg))] transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {inv.status === "CONFIRMED" && (
            <>
              {/* FR-PAY-06: dunning reminder — visible only when overdue (rule 6) */}
              {overdue && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => reminderMutation.mutate({ invoiceId: inv.id })}
                  isLoading={reminderMutation.isPending}
                  className="rounded-full"
                >
                  ⚠ Send reminder
                </Button>
              )}
              {outstanding > 0 && onRecordPayment && (
                <button
                  type="button"
                  onClick={() => onRecordPayment(inv.id, outstanding)}
                  className="rounded-full bg-[hsl(var(--status-active-ink))] px-4 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-soft)] hover:opacity-90 transition-colors"
                >
                  💳 Record Payment
                </button>
              )}
              {amountPaid === 0 && (
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate({ invoiceId: inv.id })}
                  disabled={cancelMutation.isPending}
                  className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="print:hidden rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-3 text-xs text-[hsl(var(--status-overdue-ink))]">
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}

      {successMsg && (
        <div className="print:hidden rounded-[var(--radius-lg)] border border-[hsl(var(--status-active-ink))]/30 bg-[hsl(var(--status-active-bg))] p-3 text-xs text-[hsl(var(--status-active-ink))]">
          {successMsg}
        </div>
      )}

      {/* Invoice Printable Sheet (FR-INV-02 Print Stylesheet) */}
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-[var(--shadow-soft)] print:border-none print:shadow-none print:p-0">
        {/* Company & Invoice Header */}
        <div className="flex justify-between items-start border-b border-[hsl(var(--border))] pb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[hsl(var(--foreground))]">BRIGHTLOOP SOFTWARE</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Subscription & Recurring Billing Division</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Kochi, Kerala, India</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold font-mono text-[hsl(var(--foreground))]">{inv.number}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Issue Date: {formatDate(inv.issueDate)}</p>
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">Due Date: {formatDate(inv.dueDate)}</p>
            <div className="mt-2 inline-block">
              <InvoiceStatusBadge status={inv.status} isOverdue={overdue} />
            </div>
          </div>
        </div>

        {/* Customer & Period Info */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-[hsl(var(--border))] text-xs">
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Billed To</h4>
            <p className="font-bold text-[hsl(var(--foreground))] mt-1 text-sm">{inv.customer.companyName}</p>
            <p className="text-[hsl(var(--muted-foreground))] mt-0.5">{inv.customer.user.email}</p>
            {inv.customer.billingAddress && (
              <p className="text-[hsl(var(--muted-foreground))] mt-0.5">{inv.customer.billingAddress}</p>
            )}
            {inv.customer.taxId && (
              <p className="text-[hsl(var(--muted-foreground))] mt-0.5">Tax ID: {inv.customer.taxId}</p>
            )}
          </div>
          <div className="text-right">
            <h4 className="font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Billing Period</h4>
            <p className="font-medium text-[hsl(var(--foreground))] mt-1">
              {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
            </p>
            <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
              Subscription: {inv.subscription.number} ({inv.subscription.plan.product.name})
            </p>
          </div>
        </div>

        {/* Line Items Table (Frozen Snapshots) */}
        <div className="py-6 border-b border-[hsl(var(--border))]">
          <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
            <thead className="text-[hsl(var(--muted-foreground))] font-semibold uppercase">
              <tr>
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Tax</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
              {inv.lines.map((line) => {
                const isDiscount = line.kind === "DISCOUNT";
                return (
                  <tr key={line.id} className={isDiscount ? "text-[hsl(var(--status-active-ink))] bg-[hsl(var(--status-active-bg))]/50" : ""}>
                    <td className="py-3 font-medium">
                      {line.description}
                      {line.variant && (
                        <span className="text-[hsl(var(--muted-foreground))] block text-[11px]">
                          Variant: {line.variant.attributeValue.value}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">{line.quantity}</td>
                    <td className="py-3 text-right tabular-nums">{formatINR(line.unitPrice)}</td>
                    <td className="py-3 text-right tabular-nums">{formatINR(line.taxAmount)}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">
                      {formatINR(line.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-6">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
              <span>Subtotal:</span>
              <span className="font-medium tabular-nums">{formatINR(inv.subtotal)}</span>
            </div>
            {Number(inv.discountTotal) > 0 && (
              <div className="flex justify-between text-[hsl(var(--status-active-ink))] font-medium">
                <span>Discounts:</span>
                <span className="tabular-nums">-{formatINR(inv.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
              <span>Taxes:</span>
              <span className="font-medium tabular-nums">{formatINR(inv.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[hsl(var(--foreground))] border-t border-[hsl(var(--border))] pt-2">
              <span>Grand Total:</span>
              <span className="tabular-nums">{formatINR(inv.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[hsl(var(--status-active-ink))] border-t border-[hsl(var(--border))]/50 pt-1">
              <span>Amount Paid:</span>
              <span className="font-semibold tabular-nums">{formatINR(inv.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[hsl(var(--status-overdue-ink))] border-t border-[hsl(var(--border))] pt-1">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatINR(outstanding)}</span>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        {inv.payments.length > 0 && (
          <div className="mt-8 border-t border-[hsl(var(--border))] pt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
              Payment Transactions ({inv.payments.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs divide-y divide-[hsl(var(--border))]/50">
                <thead className="text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="py-1.5">Date</th>
                    <th className="py-1.5">Method</th>
                    <th className="py-1.5">Recorded By</th>
                    <th className="py-1.5">Note</th>
                    <th className="py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]/30 text-[hsl(var(--foreground))]">
                  {inv.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">{formatDate(p.paidAt)}</td>
                      <td className="py-2 font-medium">{p.method}</td>
                      <td className="py-2 text-[hsl(var(--muted-foreground))]">{p.recordedBy.email}</td>
                      <td className="py-2 text-[hsl(var(--muted-foreground))]">{p.note ?? "—"}</td>
                      <td className="py-2 text-right font-semibold text-[hsl(var(--status-active-ink))] tabular-nums">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
