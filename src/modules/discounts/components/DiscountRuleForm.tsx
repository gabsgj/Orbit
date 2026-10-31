"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { toISODate } from "@/shared/lib/dates";
import type { DiscountKind, DiscountScope } from "@prisma/client";

interface DiscountRuleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DiscountRuleForm({ onSuccess, onCancel }: DiscountRuleFormProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<DiscountKind>("PERCENT");
  const [value, setValue] = useState(10);
  const [scope, setScope] = useState<DiscountScope>("SUBSCRIPTION");
  const [minPurchase, setMinPurchase] = useState<number | "">("");
  const [minQuantity, setMinQuantity] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toISODate(d);
  });
  const [productIdsInput, setProductIdsInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const createMutation = trpc.discounts.create.useMutation({
    onSuccess: () => {
      utils.discounts.list.invalidate();
      onSuccess?.();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const productIds =
      scope === "PRODUCT"
        ? productIdsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (scope === "PRODUCT" && (!productIds || productIds.length === 0)) {
      setErrorMsg("Please specify at least one product UUID for product-scoped discount.");
      return;
    }

    createMutation.mutate({
      name,
      kind,
      value: Number(value),
      scope,
      minPurchase: minPurchase !== "" ? Number(minPurchase) : null,
      minQuantity: minQuantity !== "" ? Number(minQuantity) : null,
      usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      productIds,
    });
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
      <div className="pb-4 border-b border-[hsl(var(--border))]">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">New Discount Rule</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Admin rule automatically applied during billing generation without human intervention.
        </p>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-3 text-xs text-[hsl(var(--status-overdue-ink))]">
          <strong>Validation Error:</strong> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
        <div>
          <label className="block font-medium text-[hsl(var(--foreground))]">Rule Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Sale 20%, Early Bird ₹500"
            className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Discount Kind</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DiscountKind)}
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            >
              <option value="PERCENT">PERCENT (%)</option>
              <option value="FIXED">FIXED (₹)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">
              Value {kind === "PERCENT" ? "(1–100 %)" : "(₹ Amount)"}
            </label>
            <input
              type="number"
              required
              min="0.01"
              max={kind === "PERCENT" ? 100 : undefined}
              step="0.01"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as DiscountScope)}
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            >
              <option value="SUBSCRIPTION">Whole Subscription</option>
              <option value="PRODUCT">Specific Products</option>
            </select>
          </div>
        </div>

        {scope === "PRODUCT" && (
          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Product UUIDs (comma-separated)</label>
            <input
              type="text"
              required
              value={productIdsInput}
              onChange={(e) => setProductIdsInput(e.target.value)}
              placeholder="e.g. b54d4f6c-8519-4824-a28a-1311026ea9e1"
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 font-mono text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Min Purchase (₹ optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minPurchase}
              onChange={(e) =>
                setMinPurchase(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder="None"
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Min Quantity (optional)</label>
            <input
              type="number"
              min="1"
              value={minQuantity}
              onChange={(e) =>
                setMinQuantity(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              placeholder="None"
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Usage Limit (optional)</label>
            <input
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) =>
                setUsageLimit(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              placeholder="Unlimited"
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-medium text-[hsl(var(--foreground))]">End Date</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Creating..." : "Save Discount Rule"}
          </button>
        </div>
      </form>
    </div>
  );
}
