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
}

export function KPICards({ kpis, isLoading = false }: KPICardsProps) {
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
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--kpi-primary))]" />
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Monthly Recurring Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(mrr)}
          </div>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-between">
            <span>ARR: <strong className="tabular-nums font-semibold text-[hsl(var(--foreground))]">{formatINR(arr)}</strong></span>
            <span className="text-[10px] text-[hsl(var(--kpi-primary))] font-medium">Active Normalized</span>
          </p>
        </CardContent>
      </Card>

      {/* 2. Active Subscriptions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {activeSubscriptionsCount.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-between">
            <span>Billing accounts</span>
            <Badge variant="active" className="text-[10px] py-0 px-1.5 font-normal">
              Live & Billed
            </Badge>
          </p>
        </CardContent>
      </Card>

      {/* 3. Revenue Received */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Revenue Collected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(totalRevenueReceived)}
          </div>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Total settled customer payments
          </p>
        </CardContent>
      </Card>

      {/* 4. Amount Owed & Overdue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Outstanding Receivables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(amountOwed)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            {overdueInvoicesCount > 0 ? (
              <Badge variant="overdue" className="text-[10px] py-0 px-1.5 font-medium">
                {overdueInvoicesCount} overdue ({formatINR(overdueAmount)})
              </Badge>
            ) : (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Zero overdue invoices
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

