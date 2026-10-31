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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] [text-wrap:balance]">
            Finance & Recurring Revenue
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Brightloop Software · Executive SaaS recurring revenue, cashflow & receivables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector — rounded-full pills with orbit-blue active */}
          <div className="flex items-center rounded-full border border-[hsl(var(--border))] p-1 bg-[hsl(var(--card))]">
            {(["7", "30", "90", "365", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodDays(p)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  periodDays === p
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {p === "365" ? "1Y" : p === "all" ? "All" : `${p}d`}
              </button>
            ))}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs text-[hsl(var(--muted-foreground))]">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isKpisFetching ? "bg-amber-500 animate-pulse" : "bg-[hsl(var(--status-active-ink))]"
              }`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {isKpisFetching ? "Syncing..." : "Live"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
          >
            Refresh
          </button>

          <ExportButtons />
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {hasAnyError && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-4 flex items-center justify-between text-sm text-[hsl(var(--foreground))]">
          <span>Some metrics could not be refreshed. Check your database connection.</span>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 1. KPI strip ────────────────────────────────────────────────── */}
      <KPICards
        kpis={kpis}
        isLoading={isKpisLoading}
        periodLabel={periodLabels[periodDays]}
      />

      {/* ── 2. MRR Movement strip ───────────────────────────────────────── */}
      <MRRMovementCard movement={mrrMovement} isLoading={isMovementLoading} />

      {/* ── 3. Main grid: MRR trend (2fr) + Revenue by plan (1fr) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MRRTrendCard trend={mrrTrend} isLoading={isTrendLoading} />
        </div>
        <div className="lg:col-span-1">
          <RevenueByPlanCard plans={revenueByPlan} isLoading={isRevenueLoading} />
        </div>
      </div>

      {/* ── 4. Bottom row: Aging + Renewals ─────────────────────────────── */}
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
