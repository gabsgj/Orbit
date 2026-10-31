"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
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
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-[var(--radius-xs)] border border-[hsl(var(--border))] space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { newMRR, expansionMRR, contractionMRR, churnMRR, netMRRChange } = movement;
  const isNetPositive = netMRRChange >= 0;

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-2">
        <div>
          <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
            MRR Movement (Last 30 Days)
          </CardTitle>
          <CardDescription className="text-xs">
            Net changes across new subscriptions, expansions, contractions, and churn (FR-DASH-03)
          </CardDescription>
        </div>
        <Badge
          variant={isNetPositive ? "active" : "overdue"}
          className="text-xs px-2.5 py-0.5 font-semibold tabular-nums"
        >
          {isNetPositive ? "+ " : ""}{formatINR(netMRRChange)} Net
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. New MRR */}
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              New MRR
            </span>
            <div className="text-lg font-bold tabular-nums text-[hsl(var(--status-active-ink))] mt-0.5">
              +{formatINR(newMRR)}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              New acquisitions
            </span>
          </div>

          {/* 2. Expansion MRR */}
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Expansion MRR
            </span>
            <div className="text-lg font-bold tabular-nums text-[hsl(var(--chart-2))] mt-0.5">
              +{formatINR(expansionMRR)}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Tier upgrades
            </span>
          </div>

          {/* 3. Contraction MRR */}
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Contraction MRR
            </span>
            <div className="text-lg font-bold tabular-nums text-[hsl(var(--status-warning-ink))] mt-0.5">
              -{formatINR(contractionMRR)}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Tier downgrades
            </span>
          </div>

          {/* 4. Churn MRR */}
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Churn MRR
            </span>
            <div className="text-lg font-bold tabular-nums text-[hsl(var(--status-overdue-ink))] mt-0.5">
              -{formatINR(churnMRR)}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Closed accounts
            </span>
          </div>

          {/* 5. Net MRR Change */}
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
              Net MRR Velocity
            </span>
            <div
              className={`text-lg font-bold tabular-nums mt-0.5 ${
                isNetPositive
                  ? "text-[hsl(var(--status-active-ink))]"
                  : "text-[hsl(var(--status-overdue-ink))]"
              }`}
            >
              {isNetPositive ? "+" : ""}{formatINR(netMRRChange)}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Recurring run-rate
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

