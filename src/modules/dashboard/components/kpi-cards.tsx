"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { KPISkeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { DashboardKPIs } from "../queries";

export interface KPICardsProps {
  kpis?: DashboardKPIs;
  isLoading?: boolean;
  periodLabel?: string;
}

export function KPICards({
  kpis,
  isLoading = false,
  periodLabel = "Last 30 Days",
}: KPICardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
      </div>
    );
  }

  const {
    activeSubscriptionsCount,
    totalRevenueReceived,
    amountOwed,
    overdueInvoicesCount,
    overdueAmount,
    mrr,
    arr,
  } = kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MRR & ARR */}
      <Card className="relative overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--kpi-primary))]" />
        <CardHeader className="pb-1 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Monthly Recurring
            </CardTitle>
            <span className="text-[10px] text-[hsl(var(--kpi-primary))] font-medium">
              Normalized
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(mrr)}
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>Annual Run-Rate (ARR)</span>
            <span className="font-semibold tabular-nums text-[hsl(var(--foreground))]">
              {formatINR(arr)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Subscriptions */}
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardHeader className="pb-1 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Active Subscriptions
            </CardTitle>
            <Badge variant="active" className="text-[10px] py-0 px-1.5 font-normal">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {activeSubscriptionsCount.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>Billed Customers</span>
            <span className="text-[11px] text-[hsl(var(--foreground))] font-medium">
              Brightloop Cloud
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Revenue Received */}
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardHeader className="pb-1 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Revenue Collected
            </CardTitle>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {periodLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(totalRevenueReceived)}
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>Settled Payments</span>
            <span className="text-[11px] text-[hsl(var(--status-active-ink))] font-medium">
              Cashflow In
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Amount Owed & Overdue */}
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardHeader className="pb-1 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Outstanding Receivables
            </CardTitle>
            {overdueInvoicesCount > 0 ? (
              <Badge variant="overdue" className="text-[10px] py-0 px-1.5 font-medium">
                {overdueInvoicesCount} Overdue
              </Badge>
            ) : (
              <Badge variant="paid" className="text-[10px] py-0 px-1.5 font-normal">
                All Current
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(amountOwed)}
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>Past Due Amount</span>
            <span
              className={`font-semibold tabular-nums ${
                overdueAmount > 0
                  ? "text-[hsl(var(--status-overdue-ink))]"
                  : "text-[hsl(var(--foreground))]"
              }`}
            >
              {formatINR(overdueAmount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
