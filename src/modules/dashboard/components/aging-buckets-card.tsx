"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { AgingBucketItem } from "../queries";

export interface AgingBucketsCardProps {
  buckets?: AgingBucketItem[];
  isLoading?: boolean;
}

export function AgingBucketsCard({
  buckets = [],
  isLoading = false,
}: AgingBucketsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalOutstanding = buckets.reduce(
    (sum, b) => sum + b.outstandingAmount,
    0
  );

  const getBucketBadgeVariant = (bucket: string) => {
    switch (bucket) {
      case "Current":
        return "active";
      case "1-30 Days":
        return "warning";
      case "31-60 Days":
      case "61-90 Days":
      case "90+ Days":
        return "overdue";
      default:
        return "neutral";
    }
  };

  const getBarColor = (bucket: string) => {
    switch (bucket) {
      case "Current":
        return "bg-[hsl(var(--status-active-ink))]";
      case "1-30 Days":
        return "bg-[hsl(var(--status-warning-ink))]";
      case "31-60 Days":
        return "bg-amber-600";
      case "61-90 Days":
        return "bg-rose-600";
      case "90+ Days":
        return "bg-[hsl(var(--status-overdue-ink))]";
      default:
        return "bg-[hsl(var(--muted-foreground))]";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">
            Receivables Aging Buckets
          </CardTitle>
          <CardDescription>
            Unpaid confirmed invoices grouped by due date (FR-PAY-05)
          </CardDescription>
        </div>
        <div className="text-right">
          <span className="text-xs text-[hsl(var(--muted-foreground))] block">
            Total Outstanding
          </span>
          <span className="text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(totalOutstanding)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visual Distribution Stack Bar */}
        {totalOutstanding > 0 ? (
          <div className="flex h-3 w-full overflow-hidden rounded-[var(--radius-xs)] bg-[hsl(var(--muted))]">
            {buckets.map((b) => {
              const pct = totalOutstanding > 0 ? (b.outstandingAmount / totalOutstanding) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={b.bucket}
                  className={`h-full ${getBarColor(b.bucket)} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${b.bucket}: ${formatINR(b.outstandingAmount)} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-2 w-full rounded bg-[hsl(var(--muted))]" />
        )}

        {/* Detailed Breakdown Table */}
        <div className="divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]">
          {buckets.map((b) => {
            const share =
              totalOutstanding > 0
                ? ((b.outstandingAmount / totalOutstanding) * 100).toFixed(1)
                : "0.0";

            return (
              <div
                key={b.bucket}
                className="flex items-center justify-between py-2.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-32">
                  <Badge variant={getBucketBadgeVariant(b.bucket)} className="text-[10px] py-0 px-2">
                    {b.bucket}
                  </Badge>
                  <span className="text-[hsl(var(--muted-foreground))] tabular-nums">
                    {b.invoiceCount} {b.invoiceCount === 1 ? "invoice" : "invoices"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[hsl(var(--muted-foreground))] tabular-nums w-12 text-right">
                    {share}%
                  </span>
                  <span className="font-semibold tabular-nums text-[hsl(var(--foreground))] w-24 text-right">
                    {formatINR(b.outstandingAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

