"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Discount Rules</h2>
          <p className="text-sm text-slate-500">
            Automated pricing discounts evaluated during billing runs (FR-DISC-01…06).
          </p>
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            + Create Discount Rule
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedScope(undefined)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              selectedScope === undefined
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Scopes
          </button>
          <button
            type="button"
            onClick={() => setSelectedScope("SUBSCRIPTION")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              selectedScope === "SUBSCRIPTION"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Subscription
          </button>
          <button
            type="button"
            onClick={() => setSelectedScope("PRODUCT")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              selectedScope === "PRODUCT"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-20 bg-slate-100 rounded" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          Error: {error.message}{" "}
          <button type="button" onClick={() => refetch()} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && rules && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {rules.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No discount rules found. Click &quot;+ Create Discount Rule&quot; to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
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
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => onSelectRule?.(rule.id)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">{rule.name}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{valueStr}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {rule.scope}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              isExhausted ? "text-red-600" : "text-slate-800"
                            }`}
                          >
                            Used {usageCount}
                            {rule.usageLimit !== null ? ` / ${rule.usageLimit}` : " (unlimited)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(rule.startDate)} – {formatDate(rule.endDate)}
                        </td>
                        <td className="px-4 py-3">
                          {isExhausted ? (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                              Exhausted
                            </span>
                          ) : rule.isActive ? (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRule?.(rule.id);
                            }}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
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

