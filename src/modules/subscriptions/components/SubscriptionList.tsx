"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";
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
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Subscriptions</h2>
          <p className="text-sm text-slate-500">
            Manage recurring subscriptions, quotations, and active contracts.
          </p>
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between p-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 w-48 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-medium text-red-800">
            Failed to load subscriptions: {error.message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Subscriptions Table */}
      {!isLoading && !isError && subscriptions && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No subscriptions found</p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm || selectedStatus
                  ? "Try clearing your filters or search query."
                  : "Create your first subscription or generate one from a template."}
              </p>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="mt-4 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Create Subscription
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => onSelectSubscription?.(sub.id)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {sub.number}
                      </td>
                      <td className="px-4 py-3">
                        {sub.customer?.companyName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {sub.plan.product.name}
                        </span>{" "}
                        <span className="text-slate-500 capitalize">
                          ({sub.plan.period.toLowerCase()})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SubscriptionStatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(sub.nextBillingDate)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatINR(sub.plan.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubscription?.(sub.id);
                          }}
                          className="rounded px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
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

