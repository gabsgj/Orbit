import type { PrismaClient } from "@prisma/client";
import * as queries from "./queries";

/**
 * dashboard service — pure, framework-free business logic (no next/trpc imports).
 * Functions receive explicit inputs + a Prisma client and return shaped data
 * (Decimals → strings). Everything here is unit-tested in ./service.test.ts.
 */

// ── KPIs (FR-DASH-01) ────────────────────────────────────────────────────────

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

// ── MRR / ARR (FR-DASH-03, SRS §6 rule 7) ───────────────────────────────────

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

// ── Aging buckets (FR-PAY-05) ────────────────────────────────────────────────

export interface AgingBucketResult {
  bucket: string;
  total: string;
  count: number;
}

/** Canonical bucket order for consistent UI rendering. */
const BUCKET_ORDER = ["current", "1-30", "31-60", "61-90", "90+"];

export async function aging(
  prisma: PrismaClient,
  asOf: Date,
): Promise<AgingBucketResult[]> {
  const rows = await queries.aging(prisma, asOf);

  // Ensure every bucket is present (fill empty ones) and in canonical order.
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

// ── Renewal forecast (FR-DASH-05) ────────────────────────────────────────────

export interface RenewalWeekResult {
  weekStart: string; // ISO date YYYY-MM-DD
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
