"use client";

import * as React from "react";
import { formatINR } from "@/shared/lib/money";
import {
  SubscriptionIcon,
  PaymentIcon,
  CreditCardIcon,
  DashboardIcon,
} from "@/shared/ui/icons";
import type { DashboardKPIs } from "../queries";

export interface KPICardsProps {
  kpis?: DashboardKPIs;
  isLoading?: boolean;
  periodLabel?: string;
}

/* ── Icon dot: pastel tint bg + -ink foreground ─────────────────────────── */
function IconDot({
  tint,
  ink,
  children,
}: {
  tint: string;
  ink: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `hsl(var(${tint}))`, color: `hsl(var(${ink}))` }}
    >
      {children}
    </span>
  );
}

/* ── Delta chip: rounded-full pill, status pastel ───────────────────────── */
function DeltaChip({
  positive,
  label,
}: {
  positive: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        positive
          ? "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]"
          : "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))]"
      }`}
    >
      {positive ? "↑" : "↓"} {label}
    </span>
  );
}

export function KPICards({
  kpis,
  isLoading = false,
  periodLabel = "Last 30 Days",
}: KPICardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] animate-pulse space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-[hsl(var(--muted))]" />
              <div className="h-9 w-9 rounded-full bg-[hsl(var(--muted))]" />
            </div>
            <div className="h-9 w-32 rounded bg-[hsl(var(--muted))]" />
            <div className="h-3 w-40 rounded bg-[hsl(var(--muted))]" />
          </div>
        ))}
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

  // Delta computation: MRR-derived growth proxy.
  // We can compute a real ratio: ARR vs revenue received (annualised run-rate vs actual).
  // But per instructions: only compute deltas from real data; omit if no real source.
  // The MRR movement card already shows real deltas — KPI cards keep clean.

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ── 1. MRR ────────────────────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Monthly Recurring
          </span>
          <IconDot tint="--tint-blue" ink="--tint-blue-ink">
            <DashboardIcon size={16} />
          </IconDot>
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums text-[hsl(var(--foreground))]">
          {formatINR(mrr)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span>ARR</span>
          <span className="font-semibold tabular-nums text-[hsl(var(--foreground))]">
            {formatINR(arr)}
          </span>
        </div>
      </div>

      {/* ── 2. Active Subscriptions ───────────────────────────────────────── */}
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Active Subscriptions
          </span>
          <IconDot tint="--tint-green" ink="--tint-green-ink">
            <SubscriptionIcon size={16} />
          </IconDot>
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums text-[hsl(var(--foreground))]">
          {activeSubscriptionsCount.toLocaleString("en-IN")}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-[hsl(var(--status-active-bg))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--status-active-ink))]">
            Active
          </span>
        </div>
      </div>

      {/* ── 3. Revenue Collected ──────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Revenue Collected
          </span>
          <IconDot tint="--tint-teal" ink="--tint-teal-ink">
            <PaymentIcon size={16} />
          </IconDot>
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums text-[hsl(var(--foreground))]">
          {formatINR(totalRevenueReceived)}
        </div>
        <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          {periodLabel}
        </div>
      </div>

      {/* ── 4. Outstanding Receivables ────────────────────────────────────── */}
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Outstanding
          </span>
          <IconDot tint="--tint-rose" ink="--tint-rose-ink">
            <CreditCardIcon size={16} />
          </IconDot>
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums text-[hsl(var(--foreground))]">
          {formatINR(amountOwed)}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {overdueInvoicesCount > 0 ? (
            <DeltaChip
              positive={false}
              label={`${overdueInvoicesCount} overdue · ${formatINR(overdueAmount)}`}
            />
          ) : (
            <span className="inline-flex items-center rounded-full bg-[hsl(var(--status-active-bg))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--status-active-ink))]">
              All current
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
