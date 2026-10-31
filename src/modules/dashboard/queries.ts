import { PrismaClient, Prisma } from "@prisma/client";

/**
 * dashboard data access — raw-SQL aggregate queries via prisma.$queryRaw.
 * Every endpoint is ONE round trip (NFR-PERF-01: <2s at 10k subscriptions).
 * Other modules never import this file; they use the public API from ./index.ts.
 */

// ── KPIs (FR-DASH-01) ────────────────────────────────────────────────────────

export interface KpisRow {
  active_subscriptions: bigint;
  revenue_received: Prisma.Decimal;
  amount_owed: Prisma.Decimal;
  overdue_invoices: bigint;
}

/**
 * Four finance-lead KPIs in a single query using FILTER clauses:
 *   - activeSubscriptions: count of status='ACTIVE' subscriptions
 *   - revenueReceived:     sum of payments.amount where paid_at is in the
 *                          calendar month containing `asOf`
 *   - amountOwed:          sum of (grand_total - amount_paid) on CONFIRMED invoices
 *   - overdueInvoices:     count of CONFIRMED invoices where due_date < asOf
 *                          AND grand_total > amount_paid (SRS §6 rule 6)
 */
export async function kpis(prisma: PrismaClient, asOf: Date): Promise<KpisRow> {
  const monthStart = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1),
  );

  const rows = await prisma.$queryRaw<KpisRow[]>`
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
  return rows[0];
}

// ── MRR / ARR (FR-DASH-03, SRS §6 rule 7) ───────────────────────────────────

export interface MrrRow {
  mrr: Prisma.Decimal;
}

/**
 * MRR = Σ over ACTIVE subscriptions' lines of the monthly-normalized value.
 * Per line: qty × unit_price × period factor (DAILY→30, WEEKLY→52/12,
 * MONTHLY→1, YEARLY→1/12). ARR = MRR × 12 (computed in the service layer).
 */
export async function mrr(prisma: PrismaClient): Promise<MrrRow> {
  const rows = await prisma.$queryRaw<MrrRow[]>`
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
  return rows[0];
}

// ── Aging buckets (FR-PAY-05) ────────────────────────────────────────────────

export interface AgingBucket {
  bucket: string;
  total: Prisma.Decimal;
  cnt: bigint;
}

/**
 * Outstanding amounts on CONFIRMED invoices (grand_total > amount_paid)
 * grouped into buckets by days past due relative to `asOf`:
 *   current (not yet due) / 1-30 / 31-60 / 61-90 / 90+
 */
export async function aging(
  prisma: PrismaClient,
  asOf: Date,
): Promise<AgingBucket[]> {
  return prisma.$queryRaw<AgingBucket[]>`
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

// ── Renewal forecast (FR-DASH-05) ────────────────────────────────────────────

export interface RenewalWeek {
  week_start: Date;
  cnt: bigint;
  total: Prisma.Decimal;
}

/**
 * Count + sum of ACTIVE subscriptions with next_billing_date between
 * `asOf` and `asOf + withinDays`, grouped by calendar week.
 */
export async function renewals(
  prisma: PrismaClient,
  asOf: Date,
  withinDays: number,
): Promise<RenewalWeek[]> {
  const end = new Date(asOf);
  end.setUTCDate(end.getUTCDate() + withinDays);

  return prisma.$queryRaw<RenewalWeek[]>`
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
