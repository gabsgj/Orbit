"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { DataTable } from "@/shared/ui/data-table";
import { formatINR, formatDate } from "@/shared/lib/money";
import type { RenewalForecastItem } from "../queries";

export interface RenewalsCardProps {
  renewals?: RenewalForecastItem[];
  isLoading?: boolean;
  daysAhead: "7" | "30" | "90";
  onDaysAheadChange: (days: "7" | "30" | "90") => void;
}

export function RenewalsCard({
  renewals = [],
  isLoading = false,
  daysAhead,
  onDaysAheadChange,
}: RenewalsCardProps) {
  const columns: ColumnDef<RenewalForecastItem>[] = [
    {
      accessorKey: "subscriptionNumber",
      header: "Subscription",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-[hsl(var(--foreground))]">
          {row.original.subscriptionNumber}
        </span>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Customer",
      cell: ({ row }) => (
        <span className="font-medium text-xs text-[hsl(var(--foreground))]">
          {row.original.companyName}
        </span>
      ),
    },
    {
      accessorKey: "planName",
      header: "Plan",
      cell: ({ row }) => (
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {row.original.planName}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry Date",
      cell: ({ row }) => (
        <span className="text-xs text-[hsl(var(--foreground))] tabular-nums">
          {formatDate(row.original.expiryDate)}
        </span>
      ),
    },
    {
      accessorKey: "daysRemaining",
      header: "Renewal Horizon",
      cell: ({ row }) => {
        const days = row.original.daysRemaining;
        const variant = days <= 7 ? "warning" : "neutral";
        return (
          <Badge variant={variant} className="text-[10px] py-0 px-2 font-medium">
            {days === 0 ? "Expires today" : `in ${days} ${days === 1 ? "day" : "days"}`}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estimatedRenewalAmount",
      header: () => <div className="text-right">Estimated Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold tabular-nums text-xs text-[hsl(var(--foreground))]">
          {formatINR(row.original.estimatedRenewalAmount)}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Upcoming Renewal Forecast
          </CardTitle>
          <CardDescription>
            Active subscriptions expiring in the next window (FR-DASH-05)
          </CardDescription>
        </div>

        {/* Horizon selector buttons */}
        <div className="flex items-center gap-1 rounded-[var(--radius-xs)] border border-[hsl(var(--border))] p-0.5 bg-[hsl(var(--background))]">
          {(["7", "30", "90"] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onDaysAheadChange(days)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[calc(var(--radius-xs)-1px)] transition-colors ${
                daysAhead === days
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs font-semibold"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <DataTable
          columns={columns}
          data={renewals}
          isLoading={isLoading}
          searchPlaceholder="Filter renewals by customer or plan..."
          emptyTitle="No upcoming renewals"
          emptyDescription={`There are no active subscriptions scheduled for renewal in the next ${daysAhead} days.`}
          pageSize={5}
        />
      </CardContent>
    </Card>
  );
}

