# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles at **Brightloop Software** (the fictional subscription company in the
Odoo × Make-a-Ton 9.0 problem statement), plus the hackathon judges evaluating it:

- **Admin** — owns the whole system: products, plans, taxes, discount rules,
  staff management, billing runs, mail outbox, audit.
- **Internal staff** — day-to-day operations: quotations → subscriptions,
  invoices, payments, billing-day runs. Limited access (no staff mgmt, no discounts).
- **Customer** — self-service portal: sees ONLY their own subscriptions and
  invoices, can print invoices, request pause/resume/renew where the plan allows.
- **Judges** — evaluate database design first, then modularity, validation,
  UI craft, offline operation, and git discipline.

## Product Purpose

**Orbit** runs the full life of a subscription business in one place: products
and plans → quotation templates → subscription lifecycle → recurring billing →
invoices → payments → revenue reporting. It replaces Brightloop's spreadsheet,
memory-based renewals, hand-typed invoices, bank-statement matching, and
quarterly manual reports. Success = every scene in the problem statement becomes
easy, and the judged demo runs **fully offline** on local PostgreSQL.

## Positioning

The billing engine is the differentiator a neighbor could not truthfully copy:
**idempotent recurring invoicing enforced by the database itself** —
`UNIQUE(subscription_id, period_start)` + `pg_try_advisory_xact_lock` + a
catch-up loop + per-subscription SAVEPOINT isolation, so nothing is ever billed
twice or skipped, proven live ("0 created · skipped (already billed)").

## Operating Context

- Judged demo runs **100% offline**: local PostgreSQL 18, node-cron worker,
  mail staged in `email_outbox` (no SMTP), zero external fonts/CDNs/APIs.
- Bonus hosted mirror exists (Vercel + Neon) but is never a dependency.
- Database-first evaluation: 18 tables, 3NF, 17 CHECK constraints, partial
  overdue index, gapless sequences, documented denormalization (`amount_paid`).
- Perf requirement: every page < 2s with thousands of subscriptions —
  proven 10.55 ms worst query on 10,007 subs / 15,147 invoices (docs/PERF.md).

## Capabilities and Constraints

- 3-role RBAC enforced server-side (tRPC `requireRole`); citext unique email;
  password policy >8 chars + upper + lower + special; hashed single-use reset tokens.
- Catalog: products, attributes/variants with `price_extra` (Odoo +560), plans
  (daily/weekly/monthly/yearly, min qty, availability, auto_close/closable_early/
  pausable/renewable flags), taxes.
- Quotation templates → subscription state machine DRAFT→QUOTATION→CONFIRMED→
  ACTIVE→CLOSED (+PAUSED) with full status history.
- Billing: bulk invoice generation, snapshot lines, per-line tax, discount
  auto-apply (precedence, usage-limit ledger, expiry), gapless INV numbers.
- Invoices DRAFT→CONFIRMED→PAID, print stylesheet, dunning reminders → outbox.
- Payments: overpayment guard, transactional `amount_paid`, auto-PAID.
- Finance dashboard: KPIs, MRR/ARR + movement (new/expansion/contraction/churn),
  aging buckets, renewal forecast, revenue-by-plan, CSV export. All real SQL.
- Money = Decimal(12,2); day domain = UTC-midnight (timezone-independent).

## Brand Commitments

- Name: **Orbit** — tagline *"Put your revenue in orbit."*
- Design thesis (docs/DESIGN.md): **Achromatic Ledger with Targeted Data Chroma** —
  colour goes on data, never chrome; flat surfaces, 1px borders, tabular-nums
  for money; no decorative cards, no gradients-as-decoration.

## Evidence on Hand

- `docs/SRS.md`, `docs/ER.md`, `docs/PLAN.md`, `docs/PERF.md`, `docs/DEMO.md`.
- Perf evidence: `scripts/perf/results/` (EXPLAIN ANALYZE on 10k-seeded DB).
- Verifiers: `scripts/auth-smoke.ts` (7 checks), `scripts/flow-smoke.ts` (12/12),
  `scripts/demo-check.sh`; CI gate (`.github/workflows/ci.yml`) green.
- Seed dataset: 7 subscriptions (one per status), 2 invoices (1 PAID, 1 OVERDUE),
  2 discount rules (SEAT10 usage-limited, LAUNCH200), Odoo +560 variant.

## Product Principles

1. The database is the last line of defense — every business rule has a constraint.
2. Prove, don't claim — idempotency, perf, and offline operation are demonstrated.
3. Local-first — the judged demo must never need the internet.
4. Modular by contract — barrel-only imports, framework-free services, tests.
5. Colour earns its place — data chroma only; chrome stays achromatic.

## Accessibility & Inclusion

WCAG AA contrast everywhere (placeholders included), keyboard navigable,
visible focus rings, designed empty/loading/error states on every screen.
