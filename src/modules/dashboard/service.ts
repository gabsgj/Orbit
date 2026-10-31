import type { PrismaClient } from "@prisma/client";
import * as queries from "./queries";
import {
  getDashboardKPIs,
  getAgingBuckets,
  getRevenueByPlan,
  getRenewalForecast,
  getMRRMovement,
  getMRRTrend,
  type DashboardKPIs,
  type AgingBucketItem,
  type RevenueByPlanItem,
  type RenewalForecastItem,
  type MRRMovement,
  type MRRTrendItem,
} from "./queries";
import { DashboardFilterInput, RenewalForecastFilterInput } from "./schemas";

/**
 * dashboard service — pure, framework-free business logic (no next/trpc imports).
 * Functions receive explicit inputs + a Prisma client and return shaped data.
 * Everything here is unit-tested in ./service.test.ts.
 */

// ── Functional exports (backend API matching Gabriel's contract) ─────────────

export interface KpisResult {
  activeSubscriptions: number;
  revenueReceived: string;
  amountOwed: string;
  overdueInvoices: number;
}

export async function kpis(
  prisma: PrismaClient,
  asOf: Date,
): Promise<KpisResult> {
  const row = await queries.kpis(prisma, asOf);
  return {
    activeSubscriptions: Number(row.active_subscriptions),
    revenueReceived: row.revenue_received.toFixed(2),
    amountOwed: row.amount_owed.toFixed(2),
    overdueInvoices: Number(row.overdue_invoices),
  };
}

export interface MrrResult {
  mrr: string;
  arr: string;
}

export async function mrr(prisma: PrismaClient): Promise<MrrResult> {
  const row = await queries.mrr(prisma);
  const mrrVal = row.mrr;
  return {
    mrr: mrrVal.toFixed(2),
    arr: mrrVal.mul(12).toFixed(2),
  };
}

export interface AgingBucketResult {
  bucket: string;
  total: string;
  count: number;
}

const BUCKET_ORDER = ["current", "1-30", "31-60", "61-90", "90+"];

export async function aging(
  prisma: PrismaClient,
  asOf: Date,
): Promise<AgingBucketResult[]> {
  const rows = await queries.aging(prisma, asOf);

  const byBucket = new Map(rows.map((r) => [r.bucket, r]));
  return BUCKET_ORDER.map((bucket) => {
    const row = byBucket.get(bucket);
    return {
      bucket,
      total: row ? row.total.toFixed(2) : "0.00",
      count: row ? Number(row.cnt) : 0,
    };
  });
}

export interface RenewalWeekResult {
  weekStart: string;
  count: number;
  total: string;
}

export async function renewals(
  prisma: PrismaClient,
  asOf: Date,
  withinDays: number = 30,
): Promise<RenewalWeekResult[]> {
  const rows = await queries.renewals(prisma, asOf, withinDays);
  return rows.map((r) => ({
    weekStart: r.week_start.toISOString().slice(0, 10),
    count: Number(r.cnt),
    total: r.total.toFixed(2),
  }));
}

// ── DashboardService class (frontend UI domain integration) ──────────────────

export class DashboardService {
  static async getSummaryKPIs(filter?: DashboardFilterInput): Promise<DashboardKPIs> {
    return getDashboardKPIs(filter);
  }

  static async getAgingAnalysis(): Promise<AgingBucketItem[]> {
    return getAgingBuckets();
  }

  static async getPlanRevenueBreakdown(): Promise<RevenueByPlanItem[]> {
    return getRevenueByPlan();
  }

  static async getUpcomingRenewals(
    input?: RenewalForecastFilterInput
  ): Promise<RenewalForecastItem[]> {
    const days = input?.daysAhead ? parseInt(input.daysAhead, 10) : 30;
    return getRenewalForecast(days);
  }

  static async getMRRMovementSummary(): Promise<MRRMovement> {
    return getMRRMovement();
  }

  static async getMRRTrend(): Promise<MRRTrendItem[]> {
    return getMRRTrend();
  }
}
