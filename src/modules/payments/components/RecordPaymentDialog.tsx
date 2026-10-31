"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { formatINR } from "@/shared/lib/money";

interface RecordPaymentDialogProps {
  invoiceId: string;
  outstandingBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
] as const;

export function RecordPaymentDialog({
  invoiceId,
  outstandingBalance,
  onClose,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "CARD" | "UPI" | "CHEQUE">("UPI");
  const [amount, setAmount] = useState<string>(outstandingBalance.toFixed(2));
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const utils = trpc.useUtils();

  const mutation = trpc.payments.record.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      utils.invoices.list.invalidate();
      utils.invoices.get.invalidate({ id: invoiceId });
      onSuccess?.();
      setTimeout(onClose, 1800);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const parsedAmount = parseFloat(amount);
  const amountValid =
    !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= outstandingBalance;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountValid) {
      setError(`Amount must be between ₹0.01 and ${formatINR(outstandingBalance)}.`);
      return;
    }
    setError(null);
    mutation.mutate({
      invoiceId,
      method,
      amount: parsedAmount,
      paidAt: new Date(paidAt),
      note: note.trim() || undefined,
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Record Payment</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-sm font-medium text-green-700">Payment recorded successfully!</p>
            {parsedAmount >= outstandingBalance && (
              <p className="text-xs text-slate-500">Invoice has been marked as <strong>PAID</strong>.</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            {/* Outstanding balance info */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs text-amber-700 font-medium">Outstanding Balance</p>
              <p className="text-xl font-bold text-amber-900 tabular-nums">{formatINR(outstandingBalance)}</p>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label htmlFor="rp-amount" className="block text-xs font-medium text-slate-700">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="rp-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={outstandingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
              {parsedAmount > outstandingBalance && (
                <p className="text-xs text-red-600">Amount exceeds outstanding balance.</p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-1">
              <label htmlFor="rp-method" className="block text-xs font-medium text-slate-700">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="rp-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label htmlFor="rp-date" className="block text-xs font-medium text-slate-700">
                Payment Date
              </label>
              <input
                id="rp-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label htmlFor="rp-note" className="block text-xs font-medium text-slate-700">
                Note (optional)
              </label>
              <textarea
                id="rp-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Reference number, cheque no., etc."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amountValid || mutation.isPending}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mutation.isPending ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

