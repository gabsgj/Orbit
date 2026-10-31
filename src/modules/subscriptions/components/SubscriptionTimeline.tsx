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
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--muted))] mt-1.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-[hsl(var(--muted))]" />
                <div className="h-3 w-32 rounded bg-[hsl(var(--muted))]/60" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-32 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))]" />
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
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Status History
          </h4>
          <div className="relative border-l border-[hsl(var(--border))] pl-5 space-y-5">
            {statusHistory.map((h) => (
              <div key={h.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))] ring-4 ring-[hsl(var(--card))]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[h.fromStatus] ?? "neutral"}>
                      {h.fromStatus}
                    </Badge>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">→</span>
                    <Badge tone={statusTone[h.toStatus] ?? "neutral"}>
                      {h.toStatus}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDate(h.changedAt)} · by {h.changedByEmail}
                  </p>
                  {h.note && (
                    <p className="mt-1 text-xs text-[hsl(var(--foreground))] italic">
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
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Billing History
          </h4>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))]">
            <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
              <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Invoice #</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Issue Date</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2.5 font-medium text-[hsl(var(--foreground))]">{inv.number}</td>
                    <td className="px-4 py-2.5">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={statusTone[inv.status] ?? "neutral"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[hsl(var(--foreground))] tabular-nums">
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
