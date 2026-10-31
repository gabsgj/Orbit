-- =============================================================================
-- explain-dashboard.sql
-- EXPLAIN (ANALYZE, BUFFERS) for every aggregate query behind the dashboard
-- KPIs. Run against the volume-seeded orbit database.
--
-- Usage:  psql "$DATABASE_URL" -f scripts/perf/explain-dashboard.sql
-- =============================================================================

\timing on

\echo '============================================================'
\echo 'DASHBOARD KPI — QUERY PLANS'
\echo '============================================================'

-- 1. Active subscription count
\echo ''
\echo '--- 1. Active subscription count --------------------------------'
\echo '    KPI: total ACTIVE subscriptions'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) AS active_count
FROM subscriptions
WHERE status = 'ACTIVE';

-- 2. Total amount owed (outstanding) on CONFIRMED invoices
\echo ''
\echo '--- 2. Owed sum on CONFIRMED invoices ---------------------------'
\echo '    KPI: total outstanding = SUM(grand_total - amount_paid)'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COALESCE(SUM(grand_total - amount_paid), 0) AS owed_sum
FROM invoices
WHERE status = 'CONFIRMED';

-- 3. Overdue invoice count
\echo ''
\echo '--- 3. Overdue invoice count ------------------------------------'
\echo '    KPI: CONFIRMED invoices whose due_date has passed'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) AS overdue_count
FROM invoices
WHERE status = 'CONFIRMED'
  AND due_date < CURRENT_DATE;

-- 4. MRR (Monthly Recurring Revenue)
\echo ''
\echo '--- 4. MRR aggregate ---------------------------------------------'
\echo '    KPI: normalized monthly revenue across ACTIVE subscriptions'
\echo '    Formula: SUM( line_qty * line_unit_price * period_multiplier )'
\echo '    Multipliers: DAILY=30, WEEKLY=4.33, MONTHLY=1, YEARLY=1/12'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COALESCE(SUM(
  sl.quantity * sl.unit_price *
  CASE p.period
    WHEN 'DAILY'   THEN 30.0
    WHEN 'WEEKLY'  THEN 4.33
    WHEN 'MONTHLY' THEN 1.0
    WHEN 'YEARLY'  THEN 1.0 / 12.0
  END
), 0) AS mrr
FROM subscriptions s
JOIN subscription_lines sl ON sl.subscription_id = s.id
JOIN plans p               ON p.id = s.plan_id
WHERE s.status = 'ACTIVE';

\echo ''
\echo '============================================================'
\echo 'END OF DASHBOARD EXPLAIN'
\echo '============================================================'
