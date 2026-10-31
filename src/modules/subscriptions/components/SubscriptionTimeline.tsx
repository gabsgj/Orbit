"use client";

import React from "react";
import { trpc } from "@/shared/trpc/react";
import { Badge, statusTone, EmptyState } from "@/shared/ui";
import { formatINR, formatDate } from "@/shared/lib/money";

interface SubscriptionTimelineProps {
  subscriptionId: string;
}

export function SubscriptionTimeline({ subscriptionId }: SubscriptionTimelineProps) {
  const { data, isLoading } = trpc.subscriptions.timeline.useQuery({
    id: subscriptionId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200 mt-1.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-32 rounded-lg bg-slate-100" />
      </div>
    );
  }

  const statusHistory = data?.statusHistory ?? [];
  const invoices = data?.invoices ?? [];
  const hasContent = statusHistory.length > 0 || invoices.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        title="No activity yet"
        description="Status changes and billing events will appear here as the subscription progresses."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Transitions */}
      {statusHistory.length > 0 && (
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Status History
          </h4>
          <div className="relative border-l border-slate-200 pl-5 space-y-5">
            {statusHistory.map((h) => (
              <div key={h.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[h.fromStatus] ?? "neutral"}>
                      {h.fromStatus}
                    </Badge>
                    <span className="text-xs text-slate-400">→</span>
                    <Badge tone={statusTone[h.toStatus] ?? "neutral"}>
                      {h.toStatus}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {formatDate(h.changedAt)} · by {h.changedByEmail}
                  </p>
                  {h.note && (
                    <p className="mt-1 text-xs text-slate-600 italic">
                      &ldquo;{h.note}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing History */}
      {invoices.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Billing History
          </h4>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Invoice #</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Issue Date</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{inv.number}</td>
                    <td className="px-4 py-2.5">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={statusTone[inv.status] ?? "neutral"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      {formatINR(inv.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
