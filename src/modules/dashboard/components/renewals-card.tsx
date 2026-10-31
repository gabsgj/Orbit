"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
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
  const totalForecastValue = renewals.reduce(
    (acc, r) => acc + r.estimatedRenewalAmount,
    0
  );

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
      header: "Plan & Tier",
      cell: ({ row }) => (
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {row.original.planName}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Renewal Date",
      cell: ({ row }) => (
        <span className="text-xs text-[hsl(var(--foreground))] tabular-nums">
          {formatDate(row.original.expiryDate)}
        </span>
      ),
    },
    {
      accessorKey: "daysRemaining",
      header: "Horizon",
      cell: ({ row }) => {
        const days = row.original.daysRemaining;
        const pillClass =
          days <= 7
            ? "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-ink))]"
            : "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-ink))]";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClass}`}
          >
            {days === 0
              ? "Due today"
              : days < 0
              ? `${Math.abs(days)}d past due`
              : `in ${days} ${days === 1 ? "day" : "days"}`}
          </span>
        );
      },
    },
    {
      accessorKey: "estimatedRenewalAmount",
      header: () => <div className="text-right">Projected Value</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold tabular-nums text-xs text-[hsl(var(--foreground))]">
          {formatINR(row.original.estimatedRenewalAmount)}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--foreground))] [text-wrap:balance]">
            Upcoming Renewals
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Active subscriptions due for renewal in the selected window
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-[hsl(var(--muted-foreground))] block">
              Forecasted Revenue
            </span>
            <span className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
              {formatINR(totalForecastValue)}
            </span>
          </div>

          {/* Horizon selector — rounded-full pills */}
          <div className="flex items-center rounded-full border border-[hsl(var(--border))] p-0.5 bg-[hsl(var(--card))]">
            {(["7", "30", "90"] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onDaysAheadChange(days)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  daysAhead === days
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={renewals}
        isLoading={isLoading}
        searchPlaceholder="Filter upcoming renewals..."
        emptyTitle="No renewals in this horizon"
        emptyDescription={`There are no active subscriptions with renewal dates falling in the next ${daysAhead} days.`}
        pageSize={5}
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
}
