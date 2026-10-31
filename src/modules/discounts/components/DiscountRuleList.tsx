"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { Badge, EmptyState } from "@/shared/ui";
import { formatINR, formatDate } from "@/shared/lib/money";
import type { DiscountScope } from "@prisma/client";

interface DiscountRuleListProps {
  onSelectRule?: (id: string) => void;
  onCreateNew?: () => void;
}

export function DiscountRuleList({ onSelectRule, onCreateNew }: DiscountRuleListProps) {
  const [selectedScope, setSelectedScope] = useState<DiscountScope | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: rules, isLoading, isError, error, refetch } = trpc.discounts.list.useQuery({
    scope: selectedScope,
    search: search.trim() || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Discount Rules</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Automated pricing discounts evaluated during billing runs (FR-DISC-01…06).
          </p>
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 transition-colors"
          >
            + Create Discount Rule
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedScope(undefined)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedScope === undefined
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            All Scopes
          </button>
          <button
            type="button"
            onClick={() => setSelectedScope("SUBSCRIPTION")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedScope === "SUBSCRIPTION"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            Subscription
          </button>
          <button
            type="button"
            onClick={() => setSelectedScope("PRODUCT")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedScope === "PRODUCT"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            Product Specific
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search rule name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs placeholder:text-[hsl(var(--placeholder-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[hsl(var(--muted))] rounded" />
          <div className="h-20 bg-[hsl(var(--muted))]/60 rounded" />
          <div className="h-20 bg-[hsl(var(--muted))]/60 rounded" />
        </div>
      )}

      {isError && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-4 text-xs text-[hsl(var(--status-overdue-ink))]">
          Error: {error.message}{" "}
          <button type="button" onClick={() => refetch()} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && rules && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
          {rules.length === 0 ? (
            <EmptyState
              title="No discount rules found"
              description="Click &quot;+ Create Discount Rule&quot; to add one."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
                <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Rule Name</th>
                    <th className="px-4 py-3 font-semibold">Type & Value</th>
                    <th className="px-4 py-3 font-semibold">Scope</th>
                    <th className="px-4 py-3 font-semibold">Usage Ledger</th>
                    <th className="px-4 py-3 font-semibold">Validity Window</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
                  {rules.map((rule) => {
                    const usageCount = rule._count.usages;
                    const isExhausted = rule.usageLimit !== null && usageCount >= rule.usageLimit;
                    const valueStr =
                      rule.kind === "PERCENT"
                        ? `${Number(rule.value)}%`
                        : formatINR(rule.value);

                    return (
                      <tr
                        key={rule.id}
                        className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors"
                        onClick={() => onSelectRule?.(rule.id)}
                      >
                        <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{rule.name}</td>
                        <td className="px-4 py-3 font-semibold text-[hsl(var(--foreground))] tabular-nums">{valueStr}</td>
                        <td className="px-4 py-3">
                          <Badge tone="neutral">{rule.scope}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium tabular-nums ${
                              isExhausted ? "text-[hsl(var(--status-overdue-ink))]" : "text-[hsl(var(--foreground))]"
                            }`}
                          >
                            Used {usageCount}
                            {rule.usageLimit !== null ? ` / ${rule.usageLimit}` : " (unlimited)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                          {formatDate(rule.startDate)} – {formatDate(rule.endDate)}
                        </td>
                        <td className="px-4 py-3">
                          {isExhausted ? (
                            <Badge tone="danger">Exhausted</Badge>
                          ) : rule.isActive ? (
                            <Badge tone="success">Active</Badge>
                          ) : (
                            <Badge tone="neutral">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRule?.(rule.id);
                            }}
                            className="rounded-full px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--tint-blue))] transition-colors"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
