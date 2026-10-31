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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
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
  "hsl(var(--kpi-primary))",
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
    <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 shadow-md text-xs">
      <p className="font-semibold text-[hsl(var(--foreground))]">{item.planName}</p>
      <div className="mt-1 space-y-0.5 text-[11px]">
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
          <span className="font-medium text-[hsl(var(--foreground))] uppercase text-[10px]">
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
      <Card className="border-[hsl(var(--border))]">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-2">
        <div>
          <CardTitle className="text-base font-semibold text-[hsl(var(--foreground))]">
            Revenue by Subscription Plan
          </CardTitle>
          <CardDescription className="text-xs">
            Normalized monthly recurring contribution categorized by tier (FR-DASH-04)
          </CardDescription>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
            Catalog MRR Sum
          </span>
          <span className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(totalRevenue)}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {plans.length === 0 ? (
          <div className="py-12 text-center text-xs text-[hsl(var(--muted-foreground))]">
            No active subscription revenue to report yet.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Horizontal Bar Chart */}
            <div className="h-36 w-full pt-1">
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
                  <Bar dataKey="revenue" radius={[0, 3, 3, 0]} maxBarSize={20}>
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

            {/* Plan List Breakdown */}
            <div className="space-y-2 border-t border-[hsl(var(--border))] pt-3">
              {plans.map((p, idx) => {
                const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
                const dotColor = PLAN_PALETTE[idx % PLAN_PALETTE.length];

                return (
                  <div key={p.planId} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-xs"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {p.planName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[hsl(var(--muted-foreground))] tabular-nums text-[11px]">
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
      </CardContent>
    </Card>
  );
}
