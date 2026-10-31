<p align="center">
  <img src="public/logo.svg" alt="Orbit logo" width="96" />
</p>

<h1 align="center">Orbit</h1>

<p align="center">
  <strong>Recurring billing that cannot bill you twice.</strong><br/>
  The digital backbone of a subscription business: plans, subscriptions, recurring
  billing, invoices, payments and revenue reporting — in one place.
</p>

<p align="center">
  <a href="https://github.com/gabsgj/Orbit/actions/workflows/ci.yml"><img src="https://github.com/gabsgj/Orbit/actions/workflows/ci.yml/badge.svg" alt="CI"/></a>
  <img src="https://img.shields.io/badge/tests-142-brightgreen" alt="tests"/>
  <img src="https://img.shields.io/badge/flows-12%2F12-brightgreen" alt="flows"/>
  <img src="https://img.shields.io/badge/worst%20query-10.55ms-blue" alt="perf"/>
  <img src="https://img.shields.io/badge/offline-100%25-blueviolet" alt="offline"/>
</p>

<p align="center">
  <strong>Odoo × Make-a-Ton 9.0, Kochi Hackathon</strong> · Local-first ·
  <a href="https://orbit-amber-two.vercel.app">Live mirror (bonus)</a>
</p>

---

## Table of contents

1. [What is Orbit](#what-is-orbit)
2. [Quick start](#quick-start)
3. [Demo logins](#demo-logins)
4. [Problem statement → solved](#problem-statement--solved-traceability)
5. [The billing engine](#the-billing-engine-the-crown-jewel)
6. [Architecture](#architecture)
7. [Database design](#database-design)
8. [Data flow](#data-flow)
9. [Roles & access](#roles--access)
10. [Feature map](#feature-map)
11. [Routes](#routes)
12. [Scripts](#scripts)
13. [Testing & verification](#testing--verification)
14. [Performance proof](#performance-proof)
15. [Offline operation](#offline-operation)
16. [Deployment (hosted mirror)](#deployment-hosted-mirror)
17. [Project structure](#project-structure)
18. [Documentation index](#documentation-index)
19. [Team](#team)

---

## What is Orbit

Brightloop Software sells everything on subscription — business software billed
monthly or yearly, add-ons customers switch on and off, products in variants.
Today they track subscriptions in a spreadsheet, remember renewals by whoever
notices first, type invoices by hand, match payments by scrolling bank statements,
and build revenue reports manually each quarter. Renewals get missed, invoices go
out wrong, and nobody can say how much recurring revenue the company has.

Orbit replaces that entire month with one system: an **admin** sets up products,
plans, taxes and discounts; a **staff** team runs customers day to day; and
**customers** manage their own subscriptions and invoices in a portal — with an
**idempotent billing engine enforced by the database itself** underneath it all.

Everything below is real: no mocks, no static JSON, no dead buttons. The judged
demo runs **100% offline** on local PostgreSQL.

## Quick start

Prerequisites: **Node 20+**, **PostgreSQL 18** running locally.

```bash
npm install
cp .env.example .env

# one-time database setup
psql -h localhost -U postgres -c "CREATE ROLE orbit_app LOGIN PASSWORD 'orbit' CREATEDB"
psql -h localhost -U postgres -c "CREATE DATABASE orbit OWNER orbit_app"

# schema + business CHECK constraints, then the demo dataset
npx prisma migrate dev
npm run db:seed

# terminal 1 — the app
npm run dev          # http://localhost:3000

# terminal 2 — the billing scheduler (local cron worker)
npm run worker
```

Verify the install end-to-end:

```bash
./scripts/demo-check.sh        # pre-flight checks, exits non-zero on failure
npx tsx scripts/flow-smoke.ts  # 12-flow end-to-end verifier (expects a dev server)
```

## Demo logins

Dev seed only (all meet the password policy: >8 chars, upper, lower, special):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@orbit.local` | `Admin@Orbit1` |
| Staff | `staff@orbit.local` | `Staff@Orbit1` |
| Customer (Acme Stores) | `customer@acme.test` | `Cust@Orbit1` |

---

## Problem statement → solved (traceability)

The assignment (`Subscription_Management_System.pdf`) describes one billing month
at Brightloop in seven scenes. Each is implemented, and each maps to working
screens, services and tests. **Status: all seven scenes delivered.**

| # | Scene (from the statement) | Requirement | Where it lives | Proof |
|---|---|---|---|---|
| 1 | **A new customer signs up** | Email unique per account; password >8 chars + upper + lower + special; forgot-password → reset link to registered email; admin/staff/customer roles; only admin adds staff | `auth` module, citext-unique `users.email`, `passwordSchema`, hashed single-use reset tokens staged in `email_outbox`; `requireRole` middleware; `/admin/staff` | 21 auth tests incl. single-use/expiry/race; `scripts/auth-smoke.ts` 7/7 |
| 2 | **Launching a new plan** | Product: name, type, sales price, cost price, notes; variants by attribute (Odoo brand +560); plan: price, period (daily/weekly/monthly/yearly), min quantity, availability dates; per-plan auto-close / closable-early / pausable / renewable | `catalog` module, `/catalog/products` (incl. VariantsPanel), `/catalog/plans`, `/catalog/taxes` | Seeded Odoo +560 variant; 4 plan flags in schema + UI |
| 3 | **Turning a quote into a subscription** | Quotation templates with pre-filled lines + validity days; subscription: own number, customer, plan, start/expiry, payment terms, lines (product, qty, unit price, taxes, amount); lifecycle Draft→Quotation→Confirmed→Active→Closed; status visible to the team | `templates` + `subscriptions` modules, `/templates`, `/subscriptions` with state machine + timeline | Gapless `SUB-2026-000xx` numbering; full `subscription_status_history` per transition |
| 4 | **Billing day** | Hundreds due at once → invoices created from subscriptions, customer + lines + taxes + totals pre-filled; taxes auto-computed from admin rules; confirm/cancel/send/print; invoice Draft→Confirmed→Paid; **nothing billed twice or skipped** | `billing` module (BillingService), `/billing` "Run billing day" button + node-cron worker + Vercel Cron, `/invoices` with print + send-to-outbox | `UNIQUE(subscription_id, period_start)`; replayed run: `0 created · skipped (already billed)`; 10 engine tests |
| 5 | **A customer asks for a better price** | Admin-only discount rules: fixed or percent, min purchase or quantity, start/end dates, usage limit; scope products or whole subscriptions; auto-applies on next invoice on its own line; stops on expiry or exhaustion | `discounts` module (DiscountEngine), `/discounts` (admin-only) | LAUNCH200 auto-applied −₹200 line on 4 invoices in a live run; usage ledger in `discount_usages` |
| 6 | **The money comes in** | Record payments: method, amount, date, note, against the right invoice; see paid vs outstanding; chase overdue before revenue is lost | `payments` module, `/payments` ledger + overdue view + record-payment dialog; dunning reminders → outbox | Overpayment rejected; `amount_paid` transactional; auto-PAID; partial overdue index; `sendReminder` verified |
| 7 | **The finance lead, end of month** | One place: active subscriptions, revenue in, amount owed, overdue invoices; filters + summary; every page <2s with thousands of subscriptions | `dashboard` module, `/dashboard` — KPIs, MRR/ARR + movement, aging buckets, renewal forecast, revenue-by-plan, CSV export | 10,007 subs / 15,147 invoices seeded; worst query **10.55 ms** (`docs/PERF.md`) |

Beyond the scenes, the statement's explicit constraints are all in force:

- **"Renewals get missed"** → renewal forecast on the dashboard (next 7/30 days).
- **"Each email can belong to only one account"** → `citext` unique at the DB level
  (`Admin@ORBIT.local` is rejected as a duplicate of `admin@orbit.local`).
- **"Only the admin can add a new member of staff"** → no public staff signup;
  `createStaff` is `requireRole("ADMIN")`; deactivation blocks login.
- **"Customers see only their own subscriptions and invoices"** → portal queries
  resolve the customer from the session user id; there is no cross-customer fallback.
- **"Nothing should be billed twice or skipped"** → database-enforced idempotency
  plus a catch-up loop (see the engine below).
- **"Every page should still respond in under two seconds"** → measured headroom
  of roughly two orders of magnitude (see Performance proof).

---

## The billing engine (the crown jewel)

Most subscription tools promise careful billing. Orbit makes it a **database-level
property**. One service (`modules/billing/service.ts` → `BillingService.run()`)
is called by all three triggers — the "Run billing day" button, the local
node-cron worker, and the hosted Vercel Cron:

```mermaid
flowchart TD
    A["Run billing day button<br/>(tRPC mutation, ADMIN/STAFF)"] --> S["BillingService.run(asOf, trigger)"]
    B["node-cron worker<br/>(local, offline)"] --> S
    C["Vercel Cron<br/>(hosted mirror only)"] --> S

    S --> L{"pg_try_advisory_xact_lock<br/>('orbit_billing_run')"}
    L -->|not acquired| R["ALREADY_RUNNING"]
    L -->|acquired| RUN["INSERT billing_runs (RUNNING)"]

    RUN --> D["SELECT subscriptions<br/>WHERE status='ACTIVE'<br/>AND next_billing_date <= asOf"]
    D --> LOOP["for each subscription<br/>(own SAVEPOINT)"]

    LOOP --> P{"invoice exists for<br/>(subscription, period)?"}
    P -->|yes| SK["skipped_already_billed++"]
    P -->|no| GEN["create invoice:<br/>snapshot lines + tax + discounts<br/>+ gapless INV number"]
    GEN -->|P2002 unique violation| SK

    SK --> N["advance next_billing_date"]
    GEN --> N
    N --> M{"more missed periods?<br/>(catch-up, cap 12)"}
    M -->|yes| LOOP
    M -->|no| F["billing_runs → DONE<br/>(created / skipped / errors / duration)"]
```

The four guarantees, each with a named mechanism and a test:

| Guarantee | Mechanism | Verified by |
|---|---|---|
| **Never billed twice** | `UNIQUE(subscription_id, period_start)` — a duplicate period is physically impossible; P2002 is counted as `skipped`, never an error | Replayed run reports `0 created · N skipped`; engine test asserts one row after two runs |
| **Never concurrent** | `pg_try_advisory_xact_lock` serializes runs — cron and the button cannot overlap | Two parallel runs produce exactly one invoice |
| **Never skipped** | Catch-up loop invoices every missed period (one per period, cap 12) after downtime | Test: subscription 3 months behind → 3 invoices, anchor advanced |
| **Never partial** | Per-subscription `SAVEPOINT`: one bad subscription rolls back only itself, the run continues | Postgres 25P02 (aborted-transaction) handled explicitly; engine suite |

Invoice math: subscription lines are **snapshots** (frozen unit prices — catalog
price changes never touch issued invoices), per-line tax from assigned active
rates, discounts applied by the DiscountEngine inside the same transaction,
totals in `Decimal(12,2)`, and **gapless** document numbers from the `sequences`
table (`INV-2026-00123`) via `UPDATE … RETURNING`.

---

## Architecture

**Highly modular** — eleven feature modules with a fixed anatomy, plus a small
shared kernel. The dependency contract is enforced by eslint, not convention.

```mermaid
flowchart TB
    subgraph APP["src/app — thin routes"]
      PUB["/ · login · signup · reset"]
      STAFF["(app) staff/admin shell"]
      PORTAL["(portal) customer area"]
      API["api/trpc · api/cron · api/export"]
    end

    subgraph MODULES["src/modules — fixed anatomy per module"]
      direction LR
      M["index.ts (barrel)<br/>router.ts (thin)<br/>service.ts (pure)<br/>schemas.ts (zod)<br/>queries.ts (prisma)<br/>components/ · tests"]
    end

    subgraph KERNEL["src/shared — zero domain logic"]
      TRPC["trpc init + requireRole"]
      DB["prisma singleton"]
      LIB["money · dates · audit · pagination"]
      UI["design system + shells"]
    end

    APP --> MODULES
    MODULES --> KERNEL
    KERNEL --> PG[("PostgreSQL 18 (local)")]

    BILL["billing button"] --> BS["BillingService"]
    W["node-cron worker"] --> BS
    V["Vercel Cron"] --> BS
    BS --> PG
```

Contract rules (docs/PLAN.md §1):

1. **Barrel-only imports** — other modules may import only from
   `modules/<name>/index.ts` (or the client-safe `modules/<name>/client.ts`,
   a sanctioned second barrel for browser-safe schemas). Enforced by
   `no-restricted-imports`.
2. **One direction** — components → router → service → queries → prisma.
3. **Contracts live with the provider** — e.g. `DiscountEngine.evaluate` is
   exported by `modules/discounts`; `modules/billing` consumes the barrel.
4. **`shared/` never imports `modules/`** — no upward dependencies.
5. **Thin `app/` pages** — routes compose modules; no business logic in pages.
6. **Deletable-module test** at review: a module can be removed with breakage
   only at explicit import sites.

## Database design

Eighteen tables, third normal form, every business rule backed by a constraint.
The full annotated model is [`docs/ER.md`](docs/ER.md); the shape:

```mermaid
erDiagram
    users ||--o| customers : "1:1 (role=CUSTOMER)"
    users ||--o{ password_reset_tokens : requests
    customers ||--o{ subscriptions : owns
    customers ||--o{ invoices : billed

    products ||--o{ product_variants : has
    attributes ||--o{ attribute_values : defines
    attribute_values ||--o{ product_variants : "price_extra"
    products ||--o{ plans : "sold as"
    plans ||--o{ subscriptions : governs
    plans ||--o{ quotation_templates : prefills

    quotation_templates ||--o{ quotation_template_lines : contains
    quotation_templates ||--o{ subscriptions : instantiates
    subscriptions ||--o{ subscription_lines : contains
    subscription_lines ||--o{ subscription_line_taxes : taxed
    taxes ||--o{ subscription_line_taxes : applies
    subscriptions ||--o{ subscription_status_history : tracks
    subscriptions ||--o{ invoices : generates

    invoices ||--o{ invoice_lines : "snapshots"
    invoices ||--o{ payments : settles
    billing_runs ||--o{ invoices : "produced by"

    discount_rules ||--o{ discount_rule_products : scoped
    discount_rules ||--o{ discount_usages : consumed
    invoices ||--o{ discount_usages : receives

    users ||--o{ audit_log : acts
```

### The constraint cheat-sheet (the database is the last line of defense)

| Rule | Enforcement |
|---|---|
| One account per email | `users.email` — `citext` + unique (case-insensitive at the DB level) |
| **Never billed twice** | `UNIQUE(subscription_id, period_start)` on `invoices` |
| Never concurrent billing | `pg_try_advisory_xact_lock` in every run |
| Valid plan windows | `CHECK (available_to > available_from)` |
| Discount value by kind | `CHECK ((kind='PERCENT' AND value>0 AND value<=100) OR (kind='FIXED' AND value>0))` |
| Positive quantities / amounts | `CHECK (quantity > 0)`, `CHECK (amount > 0)` on lines and payments |
| Non-negative invoice totals | `CHECK (subtotal>=0 AND tax_total>=0 AND discount_total>=0 AND grand_total>=0)` and `CHECK (amount_paid <= grand_total)` |
| Gapless document numbers | `sequences` row updated with `UPDATE … RETURNING` in the same transaction |
| Usage-limit integrity | `discount_usages` counted in the invoice's own transaction |
| Fast overdue queries | Partial index `invoices_overdue_idx ON (due_date) WHERE status='CONFIRMED'` |
| Billing due-selection | Composite index `subscriptions(status, next_billing_date)` |

**Deliberate denormalization (documented):** `invoices.amount_paid` is maintained
transactionally by `PaymentService` so outstanding/overdue reads are indexed
column scans instead of per-row `SUM(payments)` subqueries — this is what keeps
the finance dashboard at ~10 ms on 15k invoices.

Conventions: `snake_case` columns via `@map`, money as `NUMERIC(12,2)`,
`timestamptz` for instants, `@db.Date` for calendar days, day domain anchored to
UTC-midnight (timezone-independent through the driver), every FK indexed.

## Data flow

The full life of a subscription, end to end:

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin/Staff
    participant C as Catalog/Templates
    participant S as Subscription
    participant E as BillingService
    participant D as DiscountEngine
    participant I as Invoice
    participant P as Payments
    participant DB as PostgreSQL

    A->>C: create product + variant (Odoo +560), plan, tax
    A->>S: from template → DRAFT → QUOTATION → CONFIRMED → ACTIVE
    Note over S: number SUB-2026-00001<br/>next_billing_date = start
    Note over E: billing day (button / cron)
    E->>DB: advisory lock + due selection
    E->>S: period [next_billing, +plan.period)
    E->>D: evaluate(subscription, lines, asOf)
    D-->>E: discount line + usage row (same tx)
    E->>I: INSERT invoice (snapshot lines, tax, totals, INV number)
    I->>DB: UNIQUE(subscription, period_start) guards duplicate
    E->>S: advance next_billing_date (+ auto_close if plan says)
    A->>P: record payment (method, amount, date, note)
    P->>I: amount_paid += amount (same tx), auto-flip to PAID
    Note over I,DB: overdue = CONFIRMED + due_date < today + outstanding > 0<br/>partial index serves the chase list
```

## Roles & access

| Role | Sees | Can |
|---|---|---|
| **Admin** | Everything | All staff management (only admin adds staff), products/variants/plans/taxes, **discount rules (admin-only)**, billing runs, templates, settings, mail outbox, audit |
| **Staff** | All customers, subscriptions, invoices, payments | Day-to-day: quotations → subscriptions, confirm/send invoices, record payments, run billing. Cannot manage staff or discount rules |
| **Customer** | Portal: own subscriptions + own invoices only | View, print own invoices, request pause/resume/renew where the plan allows |

RBAC is enforced **server-side** via the tRPC `requireRole` middleware on every
procedure, plus route guards in the two shells, plus nav filtering — defense in
depth. Customer scoping happens at the query layer (the session's user id
resolves the customer; never a client-supplied id).

## Feature map

| Module | FRs | Covers |
|---|---|---|
| `auth` | FR-AUTH-01…07 | Signup, login, password policy, forgot/reset (hashed, single-use, 1h), RBAC, staff-only creation, customer scoping, citext emails, deactivation-login-block |
| `catalog` | FR-CAT-01…05 | Products, attributes/variants (`price_extra`), plans (4 lifecycle flags), taxes |
| `templates` | FR-QT-01…02 | Quotation templates + lines + validity; instantiate subscriptions |
| `subscriptions` | FR-SUB-01…08 | State machine, guarded transitions, status history, pause/resume/renew/close, activity timeline |
| `billing` | FR-BILL-01…08 | Bulk generation, idempotency, advisory lock, catch-up, gapless sequences, runs audit |
| `invoices` | FR-INV-01…05, FR-PAY-06 | State machine, confirm/cancel/send/print, snapshot lines, dunning reminders |
| `discounts` | FR-DISC-01…06 | Rule CRUD (admin-only), auto-apply at billing, precedence, usage ledger, expiry |
| `payments` | FR-PAY-01…05 | Record, overpayment guard, transactional `amount_paid`, auto-PAID, overdue, aging |
| `dashboard` | FR-DASH-01…07 | KPIs, MRR/ARR + movement (new/expansion/contraction/churn), trend, aging buckets, revenue-by-plan, renewal forecast, CSV export, live polling |
| `portal` | FR-PORT-01…03 | Customer-scoped subscriptions/invoices, print, pause/resume/renew requests |
| `admin` | FR-ADM-01…03, FR-MAIL-01…03 | Staff management, billing runs, audit log, mail outbox viewer, env-gated SMTP dispatcher |

## Routes

24 pages + API surface:

| Route | Purpose |
|---|---|
| `/` | Landing — the ledger that bills itself (product story, engine spotlight, proof) |
| `/login` `/signup` `/forgot-password` `/reset-password` | Auth folios (credentials, policy checklist, outbox-staged reset) |
| `/dashboard` | Finance & recurring-revenue dashboard (KPIs, MRR/ARR, movement, aging, renewals, CSV) |
| `/subscriptions` | Subscription list/detail/create — state machine + timeline |
| `/templates` | Quotation template CRUD |
| `/billing` | "Run billing day" button + billing runs audit |
| `/invoices` | Invoice list/detail — confirm, cancel, send, print, record payment, send reminder |
| `/payments` | Payments ledger + overdue invoices |
| `/discounts` | Discount rule CRUD (admin-only) |
| `/catalog/products` `/catalog/plans` `/catalog/taxes` | Catalog management |
| `/admin/staff` `/admin/outbox` `/admin/outbox/[id]` `/admin/audit` `/admin/runs` | Admin: staff, mail outbox (+ detail with offline action link), audit log, billing runs |
| `/portal` | Customer portal — own data only, print, pause/resume/renew |
| `/api/trpc` | tRPC (all modules) · `/api/cron/billing` (Vercel Cron, secret-guarded) · `/api/export/invoices` `/api/export/payments` (CSV) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run worker` | Local billing scheduler (node-cron). Rehearsal: `BILLING_CRON="0-59/2 * * * *" npm run worker` |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | vitest — 142 tests (DB-backed suites need `orbit_test`, below) |
| `npm run typecheck` / `npm run lint` | tsc / eslint (module-boundary contract) |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma migrate / demo seed / Studio |
| `npm run db:seed:volume` | 10k-subscription load generator (`VOLUME_SUBSCRIPTIONS`, `VOLUME_BATCH`) |
| `npx tsx scripts/auth-smoke.ts` | Auth E2E smoke — 7 identity checks against the live server |
| `npx tsx scripts/flow-smoke.ts` | 12-flow end-to-end verifier (self-cleaning, idempotent) |
| `npx tsx scripts/send-mail.ts` | Outbox dispatcher CLI (offline default; sends when `SMTP_URL` set) |
| `./scripts/demo-check.sh` | Pre-demo flight check (DB, seeds, port) |

## Testing & verification

- **142 unit/integration tests** (vitest): billing engine (idempotency, catch-up,
  concurrency, auto-close, month-end clamp, Decimal math), numbering (race-safe
  uniqueness), subscription state machine, discount engine, payment settlement,
  auth policy/tokens/RBAC, portal scoping, MRR aggregates.
- **DB-backed suites** run against a dedicated `orbit_test` database:

  ```bash
  psql -h localhost -U postgres -c "CREATE DATABASE orbit_test OWNER orbit_app"
  DATABASE_URL="postgresql://orbit_app:orbit@localhost:5432/orbit_test" npx prisma migrate deploy
  ```

- **End-to-end verifiers:** `scripts/auth-smoke.ts` (7 checks) and
  `scripts/flow-smoke.ts` (12 flows: auth, catalog, plans, templates,
  subscriptions, billing idempotency, discounts, invoices, payments, dashboard,
  portal scoping, mail outbox) — both exit non-zero on failure.
- **CI** (`.github/workflows/ci.yml`) gates every push/PR: `npm ci` → migrate →
  typecheck → `eslint --max-warnings=0` → vitest → build, with a postgres:18
  service container.

## Performance proof

Requirement: every page < 2 s with **thousands** of subscriptions. Measured with
`EXPLAIN (ANALYZE, BUFFERS)` on the volume-seeded database
(**10,007 subscriptions, 15,147 invoices**):

| Query | Execution time | Budget |
|---|---|---|
| MRR aggregate (heaviest) | **10.55 ms** | 2 s |
| Owed sum (CONFIRMED) | 2.19 ms | 2 s |
| Overdue count | 0.81 ms | 2 s |
| Active subscription count | 2.37 ms | 2 s |
| Invoice list page (25 rows) | 0.12 ms | 2 s |

Roughly **190× headroom** — from the partial overdue index, the composite billing
index, keyset pagination (no OFFSET), single-round-trip aggregates, and the
documented `amount_paid` denormalization. Full plans and timings:
[`docs/PERF.md`](docs/PERF.md); reproduce with `npm run db:seed:volume` then
`./scripts/perf/run.sh`.

## Offline operation

The judged demo needs **zero internet**, by construction:

- Local PostgreSQL 18; local node-cron billing worker.
- Mail is staged in the `email_outbox` table and viewed in-app (`/admin/outbox`) —
  no SMTP required (a webhook dispatcher activates only when `SMTP_URL` is set).
- No external fonts, CDNs, or runtime fetches — verified by a source audit
  (evidence table in [`docs/DEMO.md`](docs/DEMO.md)).
- The hosted mirror below is a **bonus link only**; `DATABASE_URL` switches targets.

## Deployment (hosted mirror)

Live mirror: **https://orbit-amber-two.vercel.app** (Vercel + Neon Postgres,
daily Vercel Cron for billing). Full guide with env-var table and smoke
checklist: [`docs/DEPLOY.md`](docs/DEPLOY.md). Local-first principle: the mirror
is never a dependency of the judged demo.

## Project structure

```
orbit/
├── prisma/
│   ├── schema.prisma          # 18 models, mirrors docs/ER.md (citext email)
│   ├── migrations/            # init · business_checks (17 CHECKs + partial idx) · citext
│   └── seed/                  # demo seed (the Brightloop story) · volume generator
├── docs/                      # SRS · PLAN · ER · PERF · DEMO · DEPLOY · DESIGN · FLOWS · team/
├── scripts/                   # demo-check.sh · auth-smoke.ts · flow-smoke.ts · send-mail.ts · perf/
├── src/
│   ├── app/                   # thin routes: landing, auth folios, (app) shell, portal, api
│   ├── modules/               # 11 feature modules, fixed anatomy (barrel/router/service/schemas/queries/components/tests)
│   ├── shared/                # kernel: trpc+requireRole · prisma · auth · lib (money/dates/audit/pagination) · ui (design system, shells, logo)
│   └── worker/                # local node-cron billing scheduler
├── .github/workflows/ci.yml   # quality gate on every push/PR
└── vercel.json                # hosted cron: 5 0 * * * → /api/cron/billing
```

## Documentation index

| Doc | What |
|---|---|
| [`docs/SRS.md`](docs/SRS.md) | Requirements — 12 modules, FR IDs, priorities, NFRs, state machines, business rules, scene→FR traceability |
| [`docs/ER.md`](docs/ER.md) | Canonical data model + constraint cheat-sheet |
| [`docs/PLAN.md`](docs/PLAN.md) | Architecture contract, team split, build order, UI gates, risks, demo script |
| [`docs/PERF.md`](docs/PERF.md) | Measured query plans + timings on 10k-seeded data |
| [`docs/DEMO.md`](docs/DEMO.md) | 13-act run-of-show + offline-proof evidence |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Hosted mirror guide + status |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design system (Achromatic Ledger) + landing/auth appendix |
| [`docs/FLOWS.md`](docs/FLOWS.md) | The 12 verified flows and what each proves |
| [`docs/team/`](docs/team/) | Per-member briefs and roles |

## Team

| Member | Role | GitHub |
|---|---|---|
| **Gabriel James** | Platform & Billing Lead — schema, billing engine, seeds, perf, deploy, CI, integration | [@gabsgj](https://github.com/gabsgj) |
| **Abhiram H** | Identity & Catalog Lead — auth, RBAC, staff, products/variants/plans/taxes, templates | [@AbhiramH7](https://github.com/AbhiramH7) |
| **Catherine Maria Benny** | Money-Flow Lead — subscriptions, discounts, invoices, payments, portal backend | [@mariacatheriine](https://github.com/mariacatheriine) |
| **Pavithra S Rajesh** | Experience & Insights Lead — design system, dashboard, portal UX, UI gates | [@PavithraSrajesh](https://github.com/PavithraSrajesh) |

---

<p align="center">
  <img src="public/logo-mark.svg" alt="Orbit mark" width="40"/><br/>
  <sub>Put your revenue in orbit.</sub>
</p>
