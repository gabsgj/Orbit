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
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[hsl(var(--card))] shadow-[var(--shadow-lift)] ring-1 ring-[hsl(var(--border))]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Record Payment</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-sm font-medium text-[hsl(var(--status-active-ink))]">Payment recorded successfully!</p>
            {parsedAmount >= outstandingBalance && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Invoice has been marked as <strong>PAID</strong>.</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            {/* Outstanding balance info */}
            <div className="rounded-[var(--radius-lg)] bg-[hsl(var(--tint-amber))] border border-[hsl(var(--tint-amber-ink))]/20 px-4 py-3">
              <p className="text-xs text-[hsl(var(--tint-amber-ink))] font-medium">Outstanding Balance</p>
              <p className="text-xl font-bold text-[hsl(var(--tint-amber-ink))] tabular-nums">{formatINR(outstandingBalance)}</p>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label htmlFor="rp-amount" className="block text-xs font-medium text-[hsl(var(--foreground))]">
                Amount (₹) <span className="text-[hsl(var(--destructive))]">*</span>
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
                className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm shadow-[var(--shadow-soft)] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                placeholder="0.00"
              />
              {parsedAmount > outstandingBalance && (
                <p className="text-xs text-[hsl(var(--status-overdue-ink))]">Amount exceeds outstanding balance.</p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-1">
              <label htmlFor="rp-method" className="block text-xs font-medium text-[hsl(var(--foreground))]">
                Payment Method <span className="text-[hsl(var(--destructive))]">*</span>
              </label>
              <select
                id="rp-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm shadow-[var(--shadow-soft)] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
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
              <label htmlFor="rp-date" className="block text-xs font-medium text-[hsl(var(--foreground))]">
                Payment Date
              </label>
              <input
                id="rp-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm shadow-[var(--shadow-soft)] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label htmlFor="rp-note" className="block text-xs font-medium text-[hsl(var(--foreground))]">
                Note (optional)
              </label>
              <textarea
                id="rp-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm shadow-[var(--shadow-soft)] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-none"
                placeholder="Reference number, cheque no., etc."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-[var(--radius-lg)] bg-[hsl(var(--status-overdue-bg))] border border-[hsl(var(--status-overdue-ink))]/30 px-3 py-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amountValid || mutation.isPending}
                className="flex-1 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
