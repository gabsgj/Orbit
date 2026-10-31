"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { AgingBucketItem } from "../queries";

export interface AgingBucketsCardProps {
  buckets?: AgingBucketItem[];
  isLoading?: boolean;
}

const BUCKET_COLORS: Record<string, string> = {
  Current: "hsl(var(--status-active-ink))",
  "1-30 Days": "hsl(var(--status-warning-ink))",
  "31-60 Days": "#d97706", // amber-600
  "61-90 Days": "#e11d48", // rose-600
  "90+ Days": "hsl(var(--status-overdue-ink))",
};

interface AgingTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AgingBucketItem;
  }>;
}

function CustomAgingTooltip({ active, payload }: AgingTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 shadow-md text-xs">
      <p className="font-semibold text-[hsl(var(--foreground))]">{item.bucket}</p>
      <div className="mt-1 space-y-0.5 text-[11px]">
        <div className="flex justify-between gap-3 text-[hsl(var(--muted-foreground))]">
          <span>Outstanding:</span>
          <span className="font-semibold text-[hsl(var(--foreground))] tabular-nums">
            {formatINR(item.outstandingAmount)}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-[hsl(var(--muted-foreground))]">
          <span>Invoices:</span>
          <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
            {item.invoiceCount} {item.invoiceCount === 1 ? "invoice" : "invoices"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AgingBucketsCard({
  buckets = [],
  isLoading = false,
}: AgingBucketsCardProps) {
  const [viewMode, setViewMode] = React.useState<"chart" | "table">("chart");

  if (isLoading) {
    return (
      <Card className="border-[hsl(var(--border))]">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-20 w-full" />
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

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-2">
        <div>
          <CardTitle className="text-base font-semibold text-[hsl(var(--foreground))]">
            Receivables Aging Buckets
          </CardTitle>
          <CardDescription className="text-xs">
            Overdue confirmed invoices grouped by calendar aging (FR-PAY-05)
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
              Total Outstanding
            </span>
            <span className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
              {formatINR(totalOutstanding)}
            </span>
          </div>

          <div className="flex items-center rounded-[var(--radius-xs)] border border-[hsl(var(--border))] p-0.5 bg-[hsl(var(--background))]">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-[calc(var(--radius-xs)-1px)] transition-colors ${
                viewMode === "chart"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs font-semibold"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-[calc(var(--radius-xs)-1px)] transition-colors ${
                viewMode === "table"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs font-semibold"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {viewMode === "chart" ? (
          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buckets}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={(val: number) => {
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }}
                />
                <Tooltip content={<CustomAgingTooltip />} />
                <Bar
                  dataKey="outstandingAmount"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                >
                  {buckets.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BUCKET_COLORS[entry.bucket] ?? "hsl(var(--muted-foreground))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* Detailed Breakdown Rows */}
        <div className="divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]">
          {buckets.map((b) => {
            const share =
              totalOutstanding > 0
                ? ((b.outstandingAmount / totalOutstanding) * 100).toFixed(1)
                : "0.0";

            return (
              <div
                key={b.bucket}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-32">
                  <Badge variant={getBucketBadgeVariant(b.bucket)} className="text-[10px] py-0 px-2">
                    {b.bucket}
                  </Badge>
                  <span className="text-[hsl(var(--muted-foreground))] tabular-nums text-[11px]">
                    {b.invoiceCount} {b.invoiceCount === 1 ? "invoice" : "invoices"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[hsl(var(--muted-foreground))] tabular-nums w-12 text-right text-[11px]">
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
