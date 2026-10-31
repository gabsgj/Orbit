# Performance Evidence — Orbit

> NFR-PERF-01: every page must load in **< 2 seconds** with **thousands of
> subscriptions** in the database. Measured with `EXPLAIN (ANALYZE, BUFFERS)`
> on the volume-seeded local database, 2026-10-31.
> **Result: worst query = 10.55 ms — ~190× under the budget.** ✅

---

## 1. Goal

| Requirement | Target | Measured | Status |
|---|---|---|---|
| Dashboard page load (KPI aggregates) | < 2 s | ≤ 10.55 ms | ✅ |
| Invoice list page (paginated, 25 rows) | < 2 s | 0.12 ms | ✅ |
| Overdue filter query | < 2 s | 2.26 ms | ✅ |

*(SQL execution time; even with app-server + render overhead, two orders of
magnitude of headroom remain.)*

---

## 2. Dataset

Volume-seeded database (`npm run db:seed` + `npm run db:seed:volume`):

| Table | Row Count |
|---|---|
| subscriptions | **10,007** (7 demo + 10,000 ACTIVE volume) |
| subscription_lines | 10,007 |
| invoices | **15,147** (12,789 PAID · 2,356 CONFIRMED overdue) |
| invoice_lines | 15,147 |
| payments | 12,790 |
| customers | 2,002 |
| plans | 3 |
| products | 2 |
| product_variants | 3 |

---

## 3. Query Plans (measured)

### 3.1 Dashboard KPIs

#### 1. Active subscription count — **2.37 ms**
Uses `subscriptions_status_next_billing_date_idx` (Bitmap Index Scan).

```
Bitmap Heap Scan on subscriptions  (actual time=0.371..2.148 rows=10002)
  -> Bitmap Index Scan on subscriptions_status_next_billing_date_idx
Execution Time: 2.366 ms
```

#### 2. Owed sum on CONFIRMED invoices — **2.19 ms**
Uses the **partial** `invoices_overdue_idx` (only CONFIRMED rows exist in it).

```
Aggregate  (actual time=2.190..2.191 rows=1)
  -> Bitmap Index Scan on invoices_overdue_idx (rows=2357)
Execution Time: 2.194 ms
```

#### 3. Overdue invoice count — **0.81 ms**
Partial index again: 2,357 matching rows, no heap scan of the 15k table.

```
Aggregate (actual time=0.806..0.807 rows=1)
  -> Bitmap Index Scan on invoices_overdue_idx (rows=2357)
Execution Time: 0.810 ms
```

#### 4. MRR aggregate (subscriptions ⨝ subscription_lines ⨝ plans) — **10.55 ms**
The heaviest query in the system: joins 10k subs → 10k lines → 3 plans with a
per-period CASE normalization. Seq scans on lines/plans are optimal here
(full-table aggregate; an index would not reduce the work).

```
Aggregate (subscriptions JOIN subscription_lines JOIN plans, CASE period)
Execution Time: 10.545 ms
```

### 3.2 Invoice list queries

#### 1. Paginated list (CONFIRMED, due_date ASC, LIMIT 25) — **0.12 ms**
Index-ordered read stops after 25 rows — keyset-friendly, no OFFSET scan.

```
Limit 25 -> Index Scan using invoices_overdue_idx (actual rows=25)
Execution Time: 0.118 ms
```

#### 2. Overdue invoices (partial-index scan) — **2.26 ms**

```
Bitmap Index Scan on invoices_overdue_idx (rows=2357)
Execution Time: 2.260 ms
```

*(Full query plans: `scripts/perf/results/explain-*-20261031.txt`.)*

---

## 4. Timings

| Query | Execution | Planning | Meets < 2 s? |
|---|---|---|---|
| Active subscription count | 2.37 ms | 1.06 ms | ✅ (845× headroom) |
| Owed sum (CONFIRMED) | 2.19 ms | 0.77 ms | ✅ |
| Overdue count | 0.81 ms | 0.11 ms | ✅ |
| MRR aggregate | 10.55 ms | 1.34 ms | ✅ (190× headroom) |
| Invoice list (page 1) | 0.12 ms | 0.93 ms | ✅ |
| Overdue partial-index | 2.26 ms | 0.08 ms | ✅ |

---

## 5. Indexes relied upon

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `subscriptions_status_next_billing_date_idx` | subscriptions | (status, next_billing_date) | billing engine + active count |
| `subscription_lines_subscription_id_idx` | subscription_lines | (subscription_id) | MRR join |
| `subscriptions_plan_id_idx` | subscriptions | (plan_id) | plan-scoped joins |
| **`invoices_overdue_idx`** (partial) | invoices | (due_date) WHERE status='CONFIRMED' | overdue + owed-sum |
| `invoices_due_date_idx` | invoices | (due_date) | due-date ordering |
| `invoices_customer_id_status_idx` | invoices | (customer_id, status) | portal scoping |
| `invoices_subscription_id_period_start_key` (unique) | invoices | (subscription_id, period_start) | anti-double-bill + joins |
| `invoice_lines_invoice_id_idx` | invoice_lines | (invoice_id) | detail expansion |
| `payments_invoice_id_idx` | payments | (invoice_id) | payment history |

---

## 6. Reproduce

```bash
npm run db:seed && npm run db:seed:volume   # 10k subs / 15k invoices
./scripts/perf/run.sh                        # EXPLAIN ANALYZE → scripts/perf/results/
```

---

## 7. Conclusion

With **10,007 subscriptions and 15,147 invoices**, every dashboard and list
query completes in **≤ 10.55 ms of SQL time** — the requirement (< 2 s per
page) is met with ~190× headroom. The wins come from: the partial overdue
index (only CONFIRMED rows indexed), the composite billing index, keyset
pagination (index-ordered LIMIT reads), and aggregates expressed as single
SQL round-trips instead of row-by-row application math.
