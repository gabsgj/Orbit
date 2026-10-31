"use client";

import * as React from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { MRRMovement } from "../queries";

export interface MRRMovementCardProps {
  movement?: MRRMovement;
  isLoading?: boolean;
}

export function MRRMovementCard({
  movement,
  isLoading = false,
}: MRRMovementCardProps) {
  if (isLoading || !movement) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 rounded-[var(--radius-sm)] border border-[hsl(var(--border))] space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { newMRR, expansionMRR, contractionMRR, churnMRR, netMRRChange } = movement;
  const isNetPositive = netMRRChange >= 0;

  const cells: Array<{
    label: string;
    value: string;
    colorClass: string;
    description: string;
  }> = [
    {
      label: "New MRR",
      value: `+${formatINR(newMRR)}`,
      colorClass: "text-[hsl(var(--status-active-ink))]",
      description: "New acquisitions",
    },
    {
      label: "Expansion",
      value: `+${formatINR(expansionMRR)}`,
      colorClass: "text-[hsl(var(--chart-2))]",
      description: "Tier upgrades",
    },
    {
      label: "Contraction",
      value: `-${formatINR(contractionMRR)}`,
      colorClass: "text-[hsl(var(--status-warning-ink))]",
      description: "Tier downgrades",
    },
    {
      label: "Churn",
      value: `-${formatINR(churnMRR)}`,
      colorClass: "text-[hsl(var(--status-overdue-ink))]",
      description: "Closed accounts",
    },
    {
      label: "Net Velocity",
      value: `${isNetPositive ? "+" : ""}${formatINR(netMRRChange)}`,
      colorClass: isNetPositive
        ? "text-[hsl(var(--status-active-ink))]"
        : "text-[hsl(var(--status-overdue-ink))]",
      description: "Recurring run-rate",
    },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--foreground))] [text-wrap:balance]">
            MRR Movement
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Net changes across new subscriptions, expansions, contractions, and churn · last 30 days
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
            isNetPositive
              ? "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]"
              : "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))]"
          }`}
        >
          {isNetPositive ? "↑" : "↓"} {formatINR(Math.abs(netMRRChange))} Net
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3"
          >
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] block">
              {cell.label}
            </span>
            <div className={`text-lg font-bold tabular-nums mt-0.5 ${cell.colorClass}`}>
              {cell.value}
            </div>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {cell.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
