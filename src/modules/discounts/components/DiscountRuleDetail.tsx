"use client";

import React from "react";
import { trpc } from "@/shared/trpc/react";
import { formatINR, formatDate } from "@/shared/lib/money";

interface DiscountRuleDetailProps {
  ruleId: string;
  onBack?: () => void;
}

export function DiscountRuleDetail({ ruleId, onBack }: DiscountRuleDetailProps) {
  const { data: rule, isLoading, isError, error } = trpc.discounts.get.useQuery({ id: ruleId });

  if (isLoading) {
    return <div className="h-64 rounded-lg bg-slate-100 animate-pulse" />;
  }

  if (isError || !rule) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-xs text-red-800">
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
              className="rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              ← Back
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{rule.name}</h1>
              {isExhausted ? (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                  Exhausted
                </span>
              ) : rule.isActive ? (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Active
                </span>
              ) : (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scope: {rule.scope} · Created {formatDate(rule.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase text-slate-400">Discount Value</h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">{valueDisplay}</p>
          <p className="text-xs text-slate-500 mt-1">Kind: {rule.kind}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase text-slate-400">Usage Ledger (FR-DISC-06)</h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {usageCount}
            <span className="text-sm font-normal text-slate-500">
              {rule.usageLimit !== null ? ` / ${rule.usageLimit} max` : " (unlimited)"}
            </span>
          </p>
          {rule.usageLimit !== null && (
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${isExhausted ? "bg-red-500" : "bg-emerald-500"}`}
                style={{
                  width: `${Math.min(100, (usageCount / rule.usageLimit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase text-slate-400">Validity Window</h3>
          <p className="mt-2 text-xs font-medium text-slate-800">
            {formatDate(rule.startDate)} – {formatDate(rule.endDate)}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
            {rule.minPurchase && <p>Min Purchase: {formatINR(rule.minPurchase)}</p>}
            {rule.minQuantity && <p>Min Quantity: {rule.minQuantity}</p>}
          </div>
        </div>
      </div>

      {/* Product Scoped items */}
      {rule.scope === "PRODUCT" && rule.products.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase text-slate-600 mb-2">
            Applicable Products ({rule.products.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {rule.products.map((p) => (
              <span
                key={p.productId}
                className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
              >
                {p.product.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Usage History Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Usage Audit Trail</h3>
          <p className="text-xs text-slate-500">Every transactional discount applied to an invoice.</p>
        </div>

        {rule.usages.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No invoices have used this discount rule yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Applied At</th>
                <th className="px-4 py-2.5 font-semibold">Invoice #</th>
                <th className="px-4 py-2.5 font-semibold">Invoice Total</th>
                <th className="px-4 py-2.5 text-right font-semibold">Discount Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rule.usages.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 text-slate-500">{formatDate(u.appliedAt)}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{u.invoice.number}</td>
                  <td className="px-4 py-2.5">{formatINR(u.invoice.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
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

