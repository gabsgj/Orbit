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
  "31-60 Days": "#d97706",
  "61-90 Days": "#e11d48",
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
    <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 shadow-[var(--shadow-lift)] text-xs">
      <p className="font-semibold text-[hsl(var(--foreground))]">{item.bucket}</p>
      <div className="mt-1 space-y-0.5">
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
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const totalOutstanding = buckets.reduce(
    (sum, b) => sum + b.outstandingAmount,
    0
  );

  const getBucketPillClass = (bucket: string) => {
    switch (bucket) {
      case "Current":
        return "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]";
      case "1-30 Days":
        return "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-ink))]";
      case "31-60 Days":
      case "61-90 Days":
      case "90+ Days":
        return "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))]";
      default:
        return "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-ink))]";
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--foreground))] [text-wrap:balance]">
            Receivables Aging
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Overdue confirmed invoices grouped by calendar aging
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-[hsl(var(--muted-foreground))] block">
              Total Outstanding
            </span>
            <span className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
              {formatINR(totalOutstanding)}
            </span>
          </div>

          {/* Chart/Table toggle — rounded-full pills */}
          <div className="flex items-center rounded-full border border-[hsl(var(--border))] p-0.5 bg-[hsl(var(--card))]">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                viewMode === "chart"
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                viewMode === "table"
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {viewMode === "chart" ? (
        <div className="h-44 w-full">
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
                radius={[4, 4, 0, 0]}
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

      {/* Breakdown rows */}
      <div className="divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))] mt-4">
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
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getBucketPillClass(b.bucket)}`}
                >
                  {b.bucket}
                </span>
                <span className="text-[hsl(var(--muted-foreground))] tabular-nums text-xs">
                  {b.invoiceCount} {b.invoiceCount === 1 ? "invoice" : "invoices"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[hsl(var(--muted-foreground))] tabular-nums w-12 text-right text-xs">
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
    </div>
  );
}
