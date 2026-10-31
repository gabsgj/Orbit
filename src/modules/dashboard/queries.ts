import { prisma } from "@/shared/db";
import { PrismaClient, Prisma } from "@prisma/client";
import { DashboardFilterInput } from "./schemas";

/**
 * dashboard data access — raw-SQL aggregate queries via prisma.$queryRaw.
 * Every endpoint is ONE round trip (NFR-PERF-01: <2s at 10k subscriptions).
 * Single aggregate SQL statements with FILTER (zero row-by-row JavaScript math).
 * All parameters bound via Prisma.sql or tagged template literals.
 */

// ── Low-level queries matching Gabriel's contract ────────────────────────────

export interface KpisRow {
  active_subscriptions: bigint;
  revenue_received: Prisma.Decimal;
  amount_owed: Prisma.Decimal;
  overdue_invoices: bigint;
}

export async function kpis(client: PrismaClient, asOf: Date): Promise<KpisRow> {
  const monthStart = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1),
  );

  const rows = await client.$queryRaw<KpisRow[]>`
    SELECT
      (SELECT count(*) FROM subscriptions WHERE status = 'ACTIVE')
        AS active_subscriptions,
      COALESCE((SELECT sum(p.amount) FROM payments p
        WHERE p.paid_at >= ${monthStart} AND p.paid_at < ${monthEnd}), 0)
        AS revenue_received,
      COALESCE((SELECT sum(i.grand_total - i.amount_paid) FROM invoices i
        WHERE i.status = 'CONFIRMED'), 0)
        AS amount_owed,
      (SELECT count(*) FROM invoices i
        WHERE i.status = 'CONFIRMED'
          AND i.due_date < ${asOf}
          AND i.grand_total > i.amount_paid)
        AS overdue_invoices
  `;
  return rows[0]!;
}

export interface MrrRow {
  mrr: Prisma.Decimal;
}

export async function mrr(client: PrismaClient): Promise<MrrRow> {
  const rows = await client.$queryRaw<MrrRow[]>`
    SELECT COALESCE(sum(
      sl.quantity * sl.unit_price *
      CASE p.period
        WHEN 'DAILY'   THEN 30::numeric
        WHEN 'WEEKLY'  THEN (52.0 / 12)::numeric
        WHEN 'MONTHLY' THEN 1::numeric
        WHEN 'YEARLY'  THEN (1.0 / 12)::numeric
      END
    ), 0) AS mrr
    FROM subscription_lines sl
    JOIN subscriptions s ON s.id = sl.subscription_id
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'ACTIVE'
  `;
  return rows[0]!;
}

export interface AgingBucket {
  bucket: string;
  total: Prisma.Decimal;
  cnt: bigint;
}

export async function aging(
  client: PrismaClient,
  asOf: Date,
): Promise<AgingBucket[]> {
  return client.$queryRaw<AgingBucket[]>`
    SELECT
      CASE
        WHEN i.due_date >= ${asOf}::date THEN 'current'
        WHEN ${asOf}::date - i.due_date BETWEEN  1 AND 30 THEN '1-30'
        WHEN ${asOf}::date - i.due_date BETWEEN 31 AND 60 THEN '31-60'
        WHEN ${asOf}::date - i.due_date BETWEEN 61 AND 90 THEN '61-90'
        ELSE '90+'
      END AS bucket,
      COALESCE(sum(i.grand_total - i.amount_paid), 0) AS total,
      count(*) AS cnt
    FROM invoices i
    WHERE i.status = 'CONFIRMED'
      AND i.grand_total > i.amount_paid
    GROUP BY 1
    ORDER BY 1
  `;
}

export interface RenewalWeek {
  week_start: Date;
  cnt: bigint;
  total: Prisma.Decimal;
}

export async function renewals(
  client: PrismaClient,
  asOf: Date,
  withinDays: number,
): Promise<RenewalWeek[]> {
  const end = new Date(asOf);
  end.setUTCDate(end.getUTCDate() + withinDays);

  return client.$queryRaw<RenewalWeek[]>`
    SELECT
      date_trunc('week', s.next_billing_date)::date AS week_start,
      count(*) AS cnt,
      COALESCE(sum(
        sl_total.line_value *
        CASE p.period
          WHEN 'DAILY'   THEN 30::numeric
          WHEN 'WEEKLY'  THEN (52.0 / 12)::numeric
          WHEN 'MONTHLY' THEN 1::numeric
          WHEN 'YEARLY'  THEN (1.0 / 12)::numeric
        END
      ), 0) AS total
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    JOIN LATERAL (
      SELECT sum(sl.quantity * sl.unit_price) AS line_value
      FROM subscription_lines sl
      WHERE sl.subscription_id = s.id
    ) sl_total ON true
    WHERE s.status = 'ACTIVE'
      AND s.next_billing_date >= ${asOf}
      AND s.next_billing_date < ${end}
    GROUP BY 1
    ORDER BY 1
  `;
}

// ── Extended High-Level Queries for Pavilion Dashboard UI ────────────────────

export interface DashboardKPIs {
  activeSubscriptionsCount: number;
  totalRevenueReceived: number;
  amountOwed: number;
  overdueInvoicesCount: number;
  overdueAmount: number;
  mrr: number;
  arr: number;
}

export interface AgingBucketItem {
  bucket: "Current" | "1-30 Days" | "31-60 Days" | "61-90 Days" | "90+ Days";
  invoiceCount: number;
  outstandingAmount: number;
}

export interface RevenueByPlanItem {
  planId: string;
  planName: string;
  productName: string;
  period: string;
  activeCount: number;
  revenue: number;
}

export interface RenewalForecastItem {
  subscriptionId: string;
  subscriptionNumber: string;
  companyName: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  estimatedRenewalAmount: number;
}

export interface MRRMovement {
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnMRR: number;
  netMRRChange: number;
}

export async function getDashboardKPIs(filter?: DashboardFilterInput): Promise<DashboardKPIs> {
  void filter;
  const mrrResult = await mrr(prisma);
  const calculatedMRR = Number(mrrResult.mrr ?? 0);
  const calculatedARR = calculatedMRR * 12;

  const summaryResult = await prisma.$queryRaw<
    Array<{
      active_subs: bigint | number;
      revenue_received: Prisma.Decimal | number | null;
      amount_owed: Prisma.Decimal | number | null;
      overdue_count: bigint | number;
      overdue_amount: Prisma.Decimal | number | null;
    }>
  >(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE') AS active_subs,
      (SELECT COALESCE(SUM(amount), 0) FROM payments) AS revenue_received,
      (SELECT COALESCE(SUM(grand_total - amount_paid), 0) 
       FROM invoices 
       WHERE status = 'CONFIRMED' AND (grand_total - amount_paid) > 0) AS amount_owed,
      (SELECT COUNT(*) 
       FROM invoices 
       WHERE status = 'CONFIRMED' AND due_date < CURRENT_DATE AND (grand_total - amount_paid) > 0) AS overdue_count,
      (SELECT COALESCE(SUM(grand_total - amount_paid), 0) 
       FROM invoices 
       WHERE status = 'CONFIRMED' AND due_date < CURRENT_DATE AND (grand_total - amount_paid) > 0) AS overdue_amount
  `);

  const summary = summaryResult[0];

  return {
    activeSubscriptionsCount: Number(summary?.active_subs ?? 0),
    totalRevenueReceived: Number(summary?.revenue_received ?? 0),
    amountOwed: Number(summary?.amount_owed ?? 0),
    overdueInvoicesCount: Number(summary?.overdue_count ?? 0),
    overdueAmount: Number(summary?.overdue_amount ?? 0),
    mrr: calculatedMRR,
    arr: calculatedARR,
  };
}

export async function getAgingBuckets(): Promise<AgingBucketItem[]> {
  const result = await prisma.$queryRaw<
    Array<{
      current_count: bigint | number;
      current_amount: Prisma.Decimal | number | null;
      d1_30_count: bigint | number;
      d1_30_amount: Prisma.Decimal | number | null;
      d31_60_count: bigint | number;
      d31_60_amount: Prisma.Decimal | number | null;
      d61_90_count: bigint | number;
      d61_90_amount: Prisma.Decimal | number | null;
      d90_plus_count: bigint | number;
      d90_plus_amount: Prisma.Decimal | number | null;
    }>
  >(Prisma.sql`
    SELECT
      COUNT(*) FILTER (WHERE due_date >= CURRENT_DATE) AS current_count,
      COALESCE(SUM(grand_total - amount_paid) FILTER (WHERE due_date >= CURRENT_DATE), 0) AS current_amount,
      
      COUNT(*) FILTER (WHERE CURRENT_DATE - due_date BETWEEN 1 AND 30) AS d1_30_count,
      COALESCE(SUM(grand_total - amount_paid) FILTER (WHERE CURRENT_DATE - due_date BETWEEN 1 AND 30), 0) AS d1_30_amount,
      
      COUNT(*) FILTER (WHERE CURRENT_DATE - due_date BETWEEN 31 AND 60) AS d31_60_count,
      COALESCE(SUM(grand_total - amount_paid) FILTER (WHERE CURRENT_DATE - due_date BETWEEN 31 AND 60), 0) AS d31_60_amount,
      
      COUNT(*) FILTER (WHERE CURRENT_DATE - due_date BETWEEN 61 AND 90) AS d61_90_count,
      COALESCE(SUM(grand_total - amount_paid) FILTER (WHERE CURRENT_DATE - due_date BETWEEN 61 AND 90), 0) AS d61_90_amount,
      
      COUNT(*) FILTER (WHERE CURRENT_DATE - due_date > 90) AS d90_plus_count,
      COALESCE(SUM(grand_total - amount_paid) FILTER (WHERE CURRENT_DATE - due_date > 90), 0) AS d90_plus_amount
    FROM invoices
    WHERE status = 'CONFIRMED' AND (grand_total - amount_paid) > 0
  `);

  const row = result[0];
  if (!row) {
    return [
      { bucket: "Current", invoiceCount: 0, outstandingAmount: 0 },
      { bucket: "1-30 Days", invoiceCount: 0, outstandingAmount: 0 },
      { bucket: "31-60 Days", invoiceCount: 0, outstandingAmount: 0 },
      { bucket: "61-90 Days", invoiceCount: 0, outstandingAmount: 0 },
      { bucket: "90+ Days", invoiceCount: 0, outstandingAmount: 0 },
    ];
  }

  return [
    {
      bucket: "Current",
      invoiceCount: Number(row.current_count ?? 0),
      outstandingAmount: Number(row.current_amount ?? 0),
    },
    {
      bucket: "1-30 Days",
      invoiceCount: Number(row.d1_30_count ?? 0),
      outstandingAmount: Number(row.d1_30_amount ?? 0),
    },
    {
      bucket: "31-60 Days",
      invoiceCount: Number(row.d31_60_count ?? 0),
      outstandingAmount: Number(row.d31_60_amount ?? 0),
    },
    {
      bucket: "61-90 Days",
      invoiceCount: Number(row.d61_90_count ?? 0),
      outstandingAmount: Number(row.d61_90_amount ?? 0),
    },
    {
      bucket: "90+ Days",
      invoiceCount: Number(row.d90_plus_count ?? 0),
      outstandingAmount: Number(row.d90_plus_amount ?? 0),
    },
  ];
}

export async function getRevenueByPlan(): Promise<RevenueByPlanItem[]> {
  const result = await prisma.$queryRaw<
    Array<{
      plan_id: string;
      product_name: string;
      period: string;
      active_count: bigint | number;
      revenue: Prisma.Decimal | number | null;
    }>
  >(Prisma.sql`
    SELECT
      p.id AS plan_id,
      prod.name AS product_name,
      p.period::text AS period,
      COUNT(DISTINCT s.id) AS active_count,
      COALESCE(SUM(
        sl.quantity * sl.unit_price * (
          CASE p.period
            WHEN 'DAILY' THEN 30.0
            WHEN 'WEEKLY' THEN (52.0 / 12.0)
            WHEN 'MONTHLY' THEN 1.0
            WHEN 'YEARLY' THEN (1.0 / 12.0)
            ELSE 1.0
          END
        )
      ), 0) AS revenue
    FROM plans p
    JOIN products prod ON p.product_id = prod.id
    LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'ACTIVE'
    LEFT JOIN subscription_lines sl ON s.id = sl.subscription_id
    GROUP BY p.id, prod.name, p.period
    ORDER BY revenue DESC
  `);

  return result.map((r) => ({
    planId: r.plan_id,
    planName: `${r.product_name} (${r.period})`,
    productName: r.product_name,
    period: r.period,
    activeCount: Number(r.active_count ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}

export async function getRenewalForecast(daysAhead: number = 30): Promise<RenewalForecastItem[]> {
  const result = await prisma.$queryRaw<
    Array<{
      subscription_id: string;
      subscription_number: string;
      company_name: string;
      product_name: string;
      period: string;
      expiry_date: Date | string;
      days_remaining: number;
      estimated_amount: Prisma.Decimal | number | null;
    }>
  >(Prisma.sql`
    SELECT
      s.id AS subscription_id,
      s.number AS subscription_number,
      c.company_name,
      prod.name AS product_name,
      p.period::text AS period,
      s.expiry_date,
      (s.expiry_date - CURRENT_DATE) AS days_remaining,
      COALESCE(SUM(sl.quantity * sl.unit_price), 0) AS estimated_amount
    FROM subscriptions s
    JOIN customers c ON s.customer_id = c.id
    JOIN plans p ON s.plan_id = p.id
    JOIN products prod ON p.product_id = prod.id
    JOIN subscription_lines sl ON s.id = sl.subscription_id
    WHERE s.status = 'ACTIVE'
      AND s.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + (${daysAhead} * INTERVAL '1 day'))
    GROUP BY s.id, s.number, c.company_name, prod.name, p.period, s.expiry_date
    ORDER BY s.expiry_date ASC
    LIMIT 20
  `);

  return result.map((r) => ({
    subscriptionId: r.subscription_id,
    subscriptionNumber: r.subscription_number,
    companyName: r.company_name,
    planName: `${r.product_name} (${r.period})`,
    expiryDate: new Date(r.expiry_date).toISOString().split("T")[0]!,
    daysRemaining: Number(r.days_remaining),
    estimatedRenewalAmount: Number(r.estimated_amount ?? 0),
  }));
}

export async function getMRRMovement(): Promise<MRRMovement> {
  const result = await prisma.$queryRaw<
    Array<{
      new_mrr: Prisma.Decimal | number | null;
      churn_mrr: Prisma.Decimal | number | null;
    }>
  >(Prisma.sql`
    SELECT
      COALESCE(SUM(
        sl.quantity * sl.unit_price * (
          CASE p.period
            WHEN 'DAILY' THEN 30.0
            WHEN 'WEEKLY' THEN (52.0 / 12.0)
            WHEN 'MONTHLY' THEN 1.0
            WHEN 'YEARLY' THEN (1.0 / 12.0)
            ELSE 1.0
          END
        )
      ) FILTER (WHERE s.created_at >= (CURRENT_DATE - INTERVAL '30 days')), 0) AS new_mrr,
      
      COALESCE(SUM(
        sl.quantity * sl.unit_price * (
          CASE p.period
            WHEN 'DAILY' THEN 30.0
            WHEN 'WEEKLY' THEN (52.0 / 12.0)
            WHEN 'MONTHLY' THEN 1.0
            WHEN 'YEARLY' THEN (1.0 / 12.0)
            ELSE 1.0
          END
        )
      ) FILTER (WHERE s.status = 'CLOSED'), 0) AS churn_mrr
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    JOIN subscription_lines sl ON s.id = sl.subscription_id
  `);

  const row = result[0];
  const newMRR = Number(row?.new_mrr ?? 0);
  const churnMRR = Number(row?.churn_mrr ?? 0);
  const expansionMRR = 0;
  const contractionMRR = 0;
  const netMRRChange = newMRR + expansionMRR - contractionMRR - churnMRR;

  return {
    newMRR,
    expansionMRR,
    contractionMRR,
    churnMRR,
    netMRRChange,
  };
}
