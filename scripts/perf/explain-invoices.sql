-- =============================================================================
-- explain-invoices.sql
-- EXPLAIN (ANALYZE, BUFFERS) for the typical invoice-list queries.
-- Demonstrates that the correct indexes are picked up by the planner.
--
-- Usage:  psql "$DATABASE_URL" -f scripts/perf/explain-invoices.sql
-- =============================================================================

\timing on

\echo '============================================================'
\echo 'INVOICE LIST — QUERY PLANS'
\echo '============================================================'

-- 1. Typical paginated list: CONFIRMED invoices ordered by due_date
\echo ''
\echo '--- 1. Paginated list (CONFIRMED, due_date ASC, LIMIT 25) -------'
\echo '    Index expected: invoices_overdue_idx  (partial: status=CONFIRMED)'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, number, customer_id, subscription_id,
       issue_date, due_date, status,
       subtotal, tax_total, discount_total, grand_total, amount_paid
FROM invoices
WHERE status = 'CONFIRMED'
ORDER BY due_date ASC
LIMIT 25;

-- 2. Overdue partial-index query
\echo ''
\echo '--- 2. Overdue invoices (partial-index scan) ---------------------'
\echo '    Index expected: invoices_overdue_idx  (partial: status=CONFIRMED)'
\echo '    Predicate matches partial-index WHERE clause exactly.'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, number, customer_id,
       due_date, grand_total, amount_paid,
       (grand_total - amount_paid) AS outstanding
FROM invoices
WHERE status = 'CONFIRMED'
  AND due_date < CURRENT_DATE
ORDER BY due_date ASC
LIMIT 25;

\echo ''
\echo '============================================================'
\echo 'END OF INVOICES EXPLAIN'
\echo '============================================================'
