"use client";

import React from "react";
import { trpc } from "@/shared/trpc/react";
import { Badge, EmptyState } from "@/shared/ui";
import { formatINR, formatDate } from "@/shared/lib/money";

interface DiscountRuleDetailProps {
  ruleId: string;
  onBack?: () => void;
}

export function DiscountRuleDetail({ ruleId, onBack }: DiscountRuleDetailProps) {
  const { data: rule, isLoading, isError, error } = trpc.discounts.get.useQuery({ id: ruleId });

  if (isLoading) {
    return <div className="h-64 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))] animate-pulse" />;
  }

  if (isError || !rule) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-6 text-xs text-[hsl(var(--status-overdue-ink))]">
        Error loading rule: {error?.message ?? "Not found"}{" "}
        {onBack && (
          <button type="button" onClick={onBack} className="underline font-semibold ml-2">
            ← Back
          </button>
        )}
      </div>
    );
  }

  const usageCount = rule._count.usages;
  const isExhausted = rule.usageLimit !== null && usageCount >= rule.usageLimit;
  const valueDisplay =
    rule.kind === "PERCENT" ? `${Number(rule.value)}%` : formatINR(rule.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{rule.name}</h1>
              {isExhausted ? (
                <Badge tone="danger">Exhausted</Badge>
              ) : rule.isActive ? (
                <Badge tone="success">Active</Badge>
              ) : (
                <Badge tone="neutral">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Scope: {rule.scope} · Created {formatDate(rule.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Discount Value</h3>
          <p className="mt-2 text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">{valueDisplay}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Kind: {rule.kind}</p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Usage Ledger (FR-DISC-06)</h3>
          <p className="mt-2 text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">
            {usageCount}
            <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
              {rule.usageLimit !== null ? ` / ${rule.usageLimit} max` : " (unlimited)"}
            </span>
          </p>
          {rule.usageLimit !== null && (
            <div className="mt-2 w-full bg-[hsl(var(--muted))] rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${isExhausted ? "bg-[hsl(var(--status-overdue-ink))]" : "bg-[hsl(var(--status-active-ink))]"}`}
                style={{
                  width: `${Math.min(100, (usageCount / rule.usageLimit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Validity Window</h3>
          <p className="mt-2 text-xs font-medium text-[hsl(var(--foreground))]">
            {formatDate(rule.startDate)} – {formatDate(rule.endDate)}
          </p>
          <div className="mt-2 text-[11px] text-[hsl(var(--muted-foreground))] space-y-0.5">
            {rule.minPurchase && <p>Min Purchase: {formatINR(rule.minPurchase)}</p>}
            {rule.minQuantity && <p>Min Quantity: {rule.minQuantity}</p>}
          </div>
        </div>
      </div>

      {/* Product Scoped items */}
      {rule.scope === "PRODUCT" && rule.products.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
            Applicable Products ({rule.products.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {rule.products.map((p) => (
              <span
                key={p.productId}
                className="rounded-full bg-[hsl(var(--tint-blue))] px-3 py-1 text-xs font-medium text-[hsl(var(--tint-blue-ink))]"
              >
                {p.product.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Usage History Table */}
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Usage Audit Trail</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Every transactional discount applied to an invoice.</p>
        </div>

        {rule.usages.length === 0 ? (
          <EmptyState
            title="No usage yet"
            description="No invoices have used this discount rule yet."
          />
        ) : (
          <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Applied At</th>
                <th className="px-4 py-2.5 font-semibold">Invoice #</th>
                <th className="px-4 py-2.5 font-semibold">Invoice Total</th>
                <th className="px-4 py-2.5 text-right font-semibold">Discount Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
              {rule.usages.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 text-[hsl(var(--muted-foreground))]">{formatDate(u.appliedAt)}</td>
                  <td className="px-4 py-2.5 font-medium text-[hsl(var(--foreground))]">{u.invoice.number}</td>
                  <td className="px-4 py-2.5 tabular-nums">{formatINR(u.invoice.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[hsl(var(--status-active-ink))] tabular-nums">
                    -{formatINR(u.appliedAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
