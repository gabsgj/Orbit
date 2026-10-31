"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { RevenueByPlanItem } from "../queries";

export interface RevenueByPlanCardProps {
  plans?: RevenueByPlanItem[];
  isLoading?: boolean;
}

const PLAN_PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--tint-lavender-ink))",
];

interface RevenueTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RevenueByPlanItem;
  }>;
}

function CustomPlanTooltip({ active, payload }: RevenueTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 shadow-[var(--shadow-lift)] text-xs">
      <p className="font-semibold text-[hsl(var(--foreground))]">{item.planName}</p>
      <div className="mt-1 space-y-0.5">
        <div className="flex justify-between gap-4 text-[hsl(var(--muted-foreground))]">
          <span>Monthly Revenue:</span>
          <span className="font-semibold text-[hsl(var(--foreground))] tabular-nums">
            {formatINR(item.revenue)}
          </span>
        </div>
        <div className="flex justify-between gap-4 text-[hsl(var(--muted-foreground))]">
          <span>Active Subscriptions:</span>
          <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
            {item.activeCount}
          </span>
        </div>
        <div className="flex justify-between gap-4 text-[hsl(var(--muted-foreground))]">
          <span>Billing Cadence:</span>
          <span className="font-medium text-[hsl(var(--foreground))] text-xs">
            {item.period}
          </span>
        </div>
      </div>
    </div>
  );
}

export function RevenueByPlanCard({
  plans = [],
  isLoading = false,
}: RevenueByPlanCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const totalRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--foreground))] [text-wrap:balance]">
            Revenue by Plan
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Normalized monthly recurring contribution by tier
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-[hsl(var(--muted-foreground))] block">
            Catalog MRR
          </span>
          <span className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(totalRevenue)}
          </span>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No active subscription revenue to report yet.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Horizontal bar chart */}
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={plans}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={(val: number) => {
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  width={90}
                />
                <Tooltip content={<CustomPlanTooltip />} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {plans.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PLAN_PALETTE[index % PLAN_PALETTE.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Plan list breakdown */}
          <div className="space-y-2 border-t border-[hsl(var(--border))] pt-3">
            {plans.map((p, idx) => {
              const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
              const dotColor = PLAN_PALETTE[idx % PLAN_PALETTE.length];

              return (
                <div key={p.planId} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {p.planName}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[hsl(var(--muted-foreground))] tabular-nums">
                      {p.activeCount} active ({pct.toFixed(1)}%)
                    </span>
                    <span className="font-semibold tabular-nums text-[hsl(var(--foreground))] w-24 text-right">
                      {formatINR(p.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
