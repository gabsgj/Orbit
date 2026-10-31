"use client";

import * as React from "react";
import { trpc } from "@/shared/trpc/react";
import { KPICards } from "./kpi-cards";
import { AgingBucketsCard } from "./aging-buckets-card";
import { RevenueByPlanCard } from "./revenue-by-plan-card";
import { RenewalsCard } from "./renewals-card";
import { Button } from "@/shared/ui/button";

export function FinanceDashboard() {
  const [daysAhead, setDaysAhead] = React.useState<"7" | "30" | "90">("30");

  // FR-DASH-07: Live-ish updates via TanStack Query polling (10s interval)
  const POLLING_INTERVAL = 10000;

  const {
    data: kpis,
    isLoading: isKpisLoading,
    refetch: refetchKpis,
    isFetching: isKpisFetching,
  } = trpc.dashboard.kpis.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: aging,
    isLoading: isAgingLoading,
  } = trpc.dashboard.aging.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: revenueByPlan,
    isLoading: isRevenueLoading,
  } = trpc.dashboard.revenueByPlan.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: renewals,
    isLoading: isRenewalsLoading,
  } = trpc.dashboard.renewals.useQuery(
    { daysAhead },
    { refetchInterval: POLLING_INTERVAL }
  );

  return (
    <div className="space-y-6">
      {/* Title & Live Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Finance & Revenue Dashboard
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Brightloop Software · Real-time subscription metrics & cashflow health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isKpisFetching ? "bg-amber-500 animate-pulse" : "bg-[hsl(var(--status-active-ink))]"
              }`}
              aria-hidden="true"
            />
            <span>{isKpisFetching ? "Updating..." : "Live polling (10s)"}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchKpis()}
            className="h-7 text-xs px-2.5"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. Top KPI Summary Strip (FR-DASH-01, FR-DASH-02, FR-DASH-03) */}
      <KPICards kpis={kpis} isLoading={isKpisLoading} />

      {/* 2. Middle Row: Receivables Aging & Revenue By Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgingBucketsCard buckets={aging} isLoading={isAgingLoading} />
        <RevenueByPlanCard plans={revenueByPlan} isLoading={isRevenueLoading} />
      </div>

      {/* 3. Bottom Row: Upcoming Renewal Forecast (FR-DASH-05) */}
      <RenewalsCard
        renewals={renewals}
        isLoading={isRenewalsLoading}
        daysAhead={daysAhead}
        onDaysAheadChange={setDaysAhead}
      />
    </div>
  );
}
