"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatINR, formatDate } from "@/shared/lib/money";
import { isPastDue } from "@/shared/lib/dates";

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

  if (isLoading) {
    return <div className="h-64 rounded-lg bg-slate-100 animate-pulse" />;
  }

  if (isError || !inv) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-xs text-red-800">
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
  const overdue = inv.status === "CONFIRMED" && isPastDue(inv.dueDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header — hidden when printing */}
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              ← Back
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{inv.number}</h1>
              <InvoiceStatusBadge status={inv.status} isOverdue={overdue} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            🖨 Print Invoice
          </button>

          {/* Send Email Action */}
          <button
            type="button"
            onClick={() => sendMutation.mutate({ invoiceId: inv.id })}
            disabled={sendMutation.isPending}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
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
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                Confirm Invoice
              </button>
              <button
                type="button"
                onClick={() => cancelMutation.mutate({ invoiceId: inv.id })}
                disabled={cancelMutation.isPending}
                className="rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Cancel
              </button>
            </>
          )}

          {inv.status === "CONFIRMED" && (
            <>
              {outstanding > 0 && onRecordPayment && (
                <button
                  type="button"
                  onClick={() => onRecordPayment(inv.id, outstanding)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  💳 Record Payment
                </button>
              )}
              {amountPaid === 0 && (
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate({ invoiceId: inv.id })}
                  disabled={cancelMutation.isPending}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="print:hidden rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}

      {successMsg && (
        <div className="print:hidden rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Invoice Printable Sheet (FR-INV-02 Print Stylesheet) */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Company & Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">BRIGHTLOOP SOFTWARE</h2>
            <p className="text-xs text-slate-500 mt-1">Subscription & Recurring Billing Division</p>
            <p className="text-xs text-slate-500">Kochi, Kerala, India</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold font-mono text-slate-900">{inv.number}</h3>
            <p className="text-xs text-slate-500 mt-1">Issue Date: {formatDate(inv.issueDate)}</p>
            <p className="text-xs font-medium text-slate-700">Due Date: {formatDate(inv.dueDate)}</p>
            <div className="mt-2 inline-block">
              <InvoiceStatusBadge status={inv.status} isOverdue={overdue} />
            </div>
          </div>
        </div>

        {/* Customer & Period Info */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-slate-400">Billed To</h4>
            <p className="font-bold text-slate-900 mt-1 text-sm">{inv.customer.companyName}</p>
            <p className="text-slate-600 mt-0.5">{inv.customer.user.email}</p>
            {inv.customer.billingAddress && (
              <p className="text-slate-600 mt-0.5">{inv.customer.billingAddress}</p>
            )}
            {inv.customer.taxId && (
              <p className="text-slate-500 mt-0.5">Tax ID: {inv.customer.taxId}</p>
            )}
          </div>
          <div className="text-right">
            <h4 className="font-semibold uppercase tracking-wider text-slate-400">Billing Period</h4>
            <p className="font-medium text-slate-900 mt-1">
              {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
            </p>
            <p className="text-slate-500 mt-0.5">
              Subscription: {inv.subscription.number} ({inv.subscription.plan.product.name})
            </p>
          </div>
        </div>

        {/* Line Items Table (Frozen Snapshots) */}
        <div className="py-6 border-b border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Tax</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {inv.lines.map((line) => {
                const isDiscount = line.kind === "DISCOUNT";
                return (
                  <tr key={line.id} className={isDiscount ? "text-emerald-700 bg-emerald-50/50" : ""}>
                    <td className="py-3 font-medium">
                      {line.description}
                      {line.variant && (
                        <span className="text-slate-500 block text-[11px]">
                          Variant: {line.variant.attributeValue.value}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">{line.quantity}</td>
                    <td className="py-3 text-right">{formatINR(line.unitPrice)}</td>
                    <td className="py-3 text-right">{formatINR(line.taxAmount)}</td>
                    <td className="py-3 text-right font-semibold">
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
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatINR(inv.subtotal)}</span>
            </div>
            {Number(inv.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discounts:</span>
                <span>-{formatINR(inv.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxes:</span>
              <span className="font-medium">{formatINR(inv.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Grand Total:</span>
              <span>{formatINR(inv.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 border-t border-slate-100 pt-1">
              <span>Amount Paid:</span>
              <span className="font-semibold">{formatINR(inv.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-red-700 border-t border-slate-200 pt-1">
              <span>Balance Due:</span>
              <span>{formatINR(outstanding)}</span>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        {inv.payments.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Payment Transactions ({inv.payments.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-1.5">Date</th>
                    <th className="py-1.5">Method</th>
                    <th className="py-1.5">Recorded By</th>
                    <th className="py-1.5">Note</th>
                    <th className="py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {inv.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">{formatDate(p.paidAt)}</td>
                      <td className="py-2 font-medium">{p.method}</td>
                      <td className="py-2 text-slate-500">{p.recordedBy.email}</td>
                      <td className="py-2 text-slate-500">{p.note ?? "—"}</td>
                      <td className="py-2 text-right font-semibold text-emerald-600">
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

