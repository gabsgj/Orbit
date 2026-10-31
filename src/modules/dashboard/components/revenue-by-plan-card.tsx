"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatINR } from "@/shared/lib/money";
import type { RevenueByPlanItem } from "../queries";

export interface RevenueByPlanCardProps {
  plans?: RevenueByPlanItem[];
  isLoading?: boolean;
}

export function RevenueByPlanCard({
  plans = [],
  isLoading = false,
}: RevenueByPlanCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Revenue by Subscription Plan
        </CardTitle>
        <CardDescription>
          Monthly recurring volume categorized by plan & period (FR-DASH-04)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <p className="py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
            No active subscription revenue to report yet.
          </p>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => {
              const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={p.planId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {p.planName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[hsl(var(--muted-foreground))] tabular-nums">
                        {p.activeCount} active
                      </span>
                      <span className="font-semibold tabular-nums text-[hsl(var(--foreground))]">
                        {formatINR(p.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <div
                      className="h-full bg-[hsl(var(--kpi-primary))] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

