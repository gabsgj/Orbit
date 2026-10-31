"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";
import { EmptyState } from "@/shared/ui";
import { formatINR, formatDate } from "@/shared/lib/money";
import type { SubscriptionStatus } from "@prisma/client";

interface SubscriptionListProps {
  onSelectSubscription?: (id: string) => void;
  onCreateNew?: () => void;
}

const statusFilters: Array<{ label: string; value?: SubscriptionStatus }> = [
  { label: "All Statuses", value: undefined },
  { label: "Draft", value: "DRAFT" },
  { label: "Quotation", value: "QUOTATION" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Active", value: "ACTIVE" },
  { label: "Paused", value: "PAUSED" },
  { label: "Closed", value: "CLOSED" },
];

export function SubscriptionList({ onSelectSubscription, onCreateNew }: SubscriptionListProps) {
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: subscriptions, isLoading, isError, error, refetch } = trpc.subscriptions.list.useQuery({
    status: selectedStatus,
    search: searchTerm.trim() || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Subscriptions</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage recurring subscriptions, quotations, and active contracts.
          </p>
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 transition-colors"
          >
            + New Subscription
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((tab) => {
            const isSelected = selectedStatus === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs placeholder:text-[hsl(var(--placeholder-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          />
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
          <div className="divide-y divide-[hsl(var(--border))]/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between p-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-[hsl(var(--muted))]" />
                  <div className="h-3 w-48 rounded bg-[hsl(var(--muted))]/60" />
                </div>
                <div className="h-6 w-20 rounded bg-[hsl(var(--muted))]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-4 text-center">
          <p className="text-sm font-medium text-[hsl(var(--status-overdue-ink))]">
            Failed to load subscriptions: {error.message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-[hsl(var(--status-overdue-ink))] underline hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Subscriptions Table */}
      {!isLoading && !isError && subscriptions && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
          {subscriptions.length === 0 ? (
            <EmptyState
              title="No subscriptions found"
              description={
                searchTerm || selectedStatus
                  ? "Try clearing your filters or search query."
                  : "Create your first subscription or generate one from a template."
              }
              action={
                onCreateNew ? (
                  <button
                    type="button"
                    onClick={onCreateNew}
                    className="inline-flex items-center rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 transition-colors"
                  >
                    Create Subscription
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
                <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Subscription</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Plan & Period</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Next Billing</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Base Price</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
                  {subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors"
                      onClick={() => onSelectSubscription?.(sub.id)}
                    >
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                        {sub.number}
                      </td>
                      <td className="px-4 py-3">
                        {sub.customer?.companyName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {sub.plan.product.name}
                        </span>{" "}
                        <span className="text-[hsl(var(--muted-foreground))] capitalize">
                          ({sub.plan.period.toLowerCase()})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SubscriptionStatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        {formatDate(sub.nextBillingDate)}
                      </td>
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))] tabular-nums">
                        {formatINR(sub.plan.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubscription?.(sub.id);
                          }}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--tint-blue))] transition-colors"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
