"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { MRRTrendItem } from "../queries";

export interface MRRTrendCardProps {
  trend?: MRRTrendItem[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTrendTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 shadow-[var(--shadow-lift)] text-xs">
      <p className="font-semibold text-[hsl(var(--foreground))] mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-[hsl(var(--foreground))]">
              {formatINR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MRRTrendCard({ trend = [], isLoading = false }: MRRTrendCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const latestMRR = trend.length > 0 ? trend[trend.length - 1]?.mrr ?? 0 : 0;
  const initialMRR = trend.length > 0 ? trend[0]?.mrr ?? 0 : 0;
  const growthRate = initialMRR > 0 ? ((latestMRR - initialMRR) / initialMRR) * 100 : 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--foreground))] [text-wrap:balance]">
            MRR & Revenue Trajectory
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            6-month historical trend of recurring subscription run-rate vs collected cashflow
          </p>
        </div>
        {trend.length > 1 && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
              growthRate >= 0
                ? "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]"
                : "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))]"
            }`}
          >
            {growthRate >= 0 ? "↑" : "↓"} {Math.abs(growthRate).toFixed(1)}% run-rate
          </span>
        )}
      </div>

      {trend.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
          No historical trend data available.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
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
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                name="Monthly Recurring Revenue (MRR)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#mrrGradient)"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Collected Revenue"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
