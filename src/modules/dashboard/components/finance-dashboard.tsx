"use client";

import * as React from "react";
import { trpc } from "@/shared/trpc/react";
import { KPICards } from "./kpi-cards";
import { MRRMovementCard } from "./mrr-movement-card";
import { MRRTrendCard } from "./mrr-trend-card";
import { AgingBucketsCard } from "./aging-buckets-card";
import { RevenueByPlanCard } from "./revenue-by-plan-card";
import { RenewalsCard } from "./renewals-card";
import { ExportButtons } from "./ExportButtons";
import { Button } from "@/shared/ui/button";

export function FinanceDashboard() {
  const [periodDays, setPeriodDays] = React.useState<"7" | "30" | "90" | "365" | "all">("30");
  const [daysAhead, setDaysAhead] = React.useState<"7" | "30" | "90">("30");

  // FR-DASH-07: Live-ish updates via TanStack Query polling (10s interval)
  const POLLING_INTERVAL = 10000;

  const {
    data: kpis,
    isLoading: isKpisLoading,
    isError: isKpisError,
    refetch: refetchKpis,
    isFetching: isKpisFetching,
  } = trpc.dashboard.kpis.useQuery(
    { periodDays },
    { refetchInterval: POLLING_INTERVAL }
  );

  const {
    data: mrrMovement,
    isLoading: isMovementLoading,
    isError: isMovementError,
    refetch: refetchMovement,
  } = trpc.dashboard.mrrMovement.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: mrrTrend,
    isLoading: isTrendLoading,
    isError: isTrendError,
    refetch: refetchTrend,
  } = trpc.dashboard.mrrTrend.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: aging,
    isLoading: isAgingLoading,
    isError: isAgingError,
    refetch: refetchAging,
  } = trpc.dashboard.aging.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: revenueByPlan,
    isLoading: isRevenueLoading,
    isError: isRevenueError,
    refetch: refetchRevenue,
  } = trpc.dashboard.revenueByPlan.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: renewals,
    isLoading: isRenewalsLoading,
    isError: isRenewalsError,
    refetch: refetchRenewals,
  } = trpc.dashboard.renewals.useQuery(
    { daysAhead },
    { refetchInterval: POLLING_INTERVAL }
  );

  const handleRefreshAll = () => {
    refetchKpis();
    refetchMovement();
    refetchTrend();
    refetchAging();
    refetchRevenue();
    refetchRenewals();
  };

  const hasAnyError =
    isKpisError ||
    isMovementError ||
    isTrendError ||
    isAgingError ||
    isRevenueError ||
    isRenewalsError;

  const periodLabels: Record<string, string> = {
    "7": "Last 7 Days",
    "30": "Last 30 Days",
    "90": "Last 90 Days",
    "365": "This Year",
    all: "All Time",
  };

  return (
    <div className="space-y-6">
      {/* ── Dashboard Header & Filter Controls ──────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[hsl(var(--border))]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Finance & Recurring Revenue
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Brightloop Software · Executive SaaS recurring revenue, cashflow & receivables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center rounded-[var(--radius-xs)] border border-[hsl(var(--border))] p-0.5 bg-[hsl(var(--card))]">
            {(["7", "30", "90", "365", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodDays(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded-[calc(var(--radius-xs)-1px)] transition-colors ${
                  periodDays === p
                    ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {p === "365" ? "1Y" : p === "all" ? "All" : `${p}d`}
              </button>
            ))}
          </div>

          {/* Live Polling Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[11px] text-[hsl(var(--muted-foreground))]">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isKpisFetching ? "bg-amber-500 animate-pulse" : "bg-[hsl(var(--status-active-ink))]"
              }`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {isKpisFetching ? "Syncing..." : "Live (10s)"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="h-7 text-xs px-2.5"
          >
            Refresh
          </Button>

          <ExportButtons />
        </div>
      </div>

      {/* ── Error Banner if any query failed ────────────────────────────── */}
      {hasAnyError && (
        <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-ink))]/10 p-3 flex items-center justify-between text-xs text-[hsl(var(--foreground))]">
          <span>Some metrics could not be refreshed. Check your database connection.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="h-6 text-[11px] px-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── 1. Top KPI Summary Strip (FR-DASH-01, FR-DASH-02, FR-DASH-03) ── */}
      <KPICards
        kpis={kpis}
        isLoading={isKpisLoading}
        periodLabel={periodLabels[periodDays]}
      />

      {/* ── 2. MRR Movement Velocity Strip (FR-DASH-03) ──────────────────── */}
      <MRRMovementCard movement={mrrMovement} isLoading={isMovementLoading} />

      {/* ── 3. Middle Row: MRR Trend Chart & Revenue By Plan ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MRRTrendCard trend={mrrTrend} isLoading={isTrendLoading} />
        <RevenueByPlanCard plans={revenueByPlan} isLoading={isRevenueLoading} />
      </div>

      {/* ── 4. Bottom Row: Receivables Aging & Upcoming Renewals ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgingBucketsCard buckets={aging} isLoading={isAgingLoading} />
        <RenewalsCard
          renewals={renewals}
          isLoading={isRenewalsLoading}
          daysAhead={daysAhead}
          onDaysAheadChange={setDaysAhead}
        />
      </div>
    </div>
  );
}
