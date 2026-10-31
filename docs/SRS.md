# Software Requirements Specification
## Orbit — Subscription Management System
*(product: **Orbit** · fictional customer company in the problem statement: Brightloop Software)*

| | |
|---|---|
| **Project** | Odoo × Make-a-Ton 9.0, Kochi Hackathon |
| **Version** | 1.0 (2026-10-31) |
| **Source** | `Subscription_Management_System.pdf` (problem statement, recorded verbatim in `.aimem/context.md`) |
| **Data model** | `docs/ER.md` (canonical) |
| **Execution plan** | `docs/PLAN.md` |

---

## 1. Introduction

### 1.1 Purpose
Build one unified platform that runs the full life of a subscription business: products and
plans → subscriptions → recurring billing → invoices → payments → revenue reporting.
The system replaces Brightloop Software's spreadsheet/spreadsheet-memory/manual-invoice workflow.

### 1.2 Product vision
> "The digital backbone of a company that earns its money every month, not just once."
Every scene in the problem statement becomes a working screen; every manual pain point
becomes an automated, constraint-backed system behavior.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| **MRR** | Monthly Recurring Revenue = Σ over ACTIVE subscriptions of line-value normalized to monthly (`daily×30`, `weekly×52/12`, `monthly×1`, `yearly/12`) |
| **ARR** | MRR × 12 |
| **Billing run** | One execution of the billing engine for an `as_of` date; audited in `billing_runs` |
| **Idempotent** | Re-running the same operation has no additional effect (billing twice for one period is impossible) |
| **Dunning** | The process of chasing overdue invoices (aging buckets + simulated reminders) |
| **Outstanding** | `invoice.grand_total − invoice.amount_paid` where `> 0` and status = CONFIRMED |
| **Overdue** | Outstanding invoice whose `due_date < today` |
| **Snapshot** | Invoice lines copy prices/taxes at generation time; later price changes never rewrite history |
| **Sequence** | Gapless, race-safe document numbering (`SUB-2026-00042`) from the `sequences` table |
| **Outbox** | `email_outbox` table — all outgoing mail is staged here (offline-safe), viewable in admin |

### 1.4 Roles (exactly 3, per the statement)
| Role | Sees | Can |
|---|---|---|
| **ADMIN** | Everything | All staff management (only admin adds staff), products/variants/plans/taxes, **discount rules (admin-only)**, billing runs, templates, settings, mail outbox |
| **STAFF** | All customers, subscriptions, invoices, payments | Day-to-day ops: quotations→subscriptions, confirm/send invoices, record payments, run billing. Cannot manage staff or discount rules |
| **CUSTOMER** | Portal: own subscriptions + own invoices only | View, print own invoices, request pause/resume/renew where the plan allows |

*(The "finance lead" in the statement is an ADMIN/STAFF using the dashboard — no 4th role.)*

---

## 2. Overall description

- **Stack (locked):** Next.js 15 (App Router, TypeScript) · tRPC v11 · Prisma 6 · PostgreSQL 18 (local) · Tailwind + shadcn/ui · TanStack Query/Table · Recharts · next-auth + bcryptjs · node-cron (local worker) + Vercel Cron (hosted) · vitest.
- **Deployment:** judged demo = 100% offline on local PostgreSQL. Hosted mirror (Vercel + Neon) is a bonus link only; `DATABASE_URL` is env-driven, same build.
- **Users:** 1 admin, a small staff team, thousands of customers on subscription.

---

## 3. Functional requirements

> Priority: **P0** = required by the problem statement (non-negotiable) · **P1** = differentiator (judge-impressing, committed) · **P2** = stretch (only if P0+P1 are done and stable).

### M1 — Authentication & RBAC
| ID | Req | P |
|---|---|---|
| FR-AUTH-01 | Customer self-signup with email + password; email unique (case-insensitive, 409 on conflict) | P0 |
| FR-AUTH-02 | Password policy: **> 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special char** (zod schema shared client+server) | P0 |
| FR-AUTH-03 | Login/logout; bcrypt-hashed passwords; session via next-auth credentials provider | P0 |
| FR-AUTH-04 | Forgot password → reset link to registered email; token sha256-hashed, single-use, 1h expiry; offline mode stages the email in `email_outbox` and the dev/admin outbox viewer shows the link | P0 |
| FR-AUTH-05 | RBAC enforced **server-side** via tRPC middleware (`requireRole`), plus route guards + nav filtering (defense in depth) | P0 |
| FR-AUTH-06 | Only ADMIN can create staff accounts (no public staff signup) | P0 |
| FR-AUTH-07 | Customers are scoped to their own data at the query layer (never trust client-provided ids) | P0 |

### M2 — Catalog: products, variants, plans, taxes
| ID | Req | P |
|---|---|---|
| FR-CAT-01 | Product CRUD: name, type, sales price, cost price, notes, active flag | P0 |
| FR-CAT-02 | Attributes & values (e.g. Brand → Odoo); **variants add `price_extra`** (e.g. Odoo = +560) to the product price | P0 |
| FR-CAT-03 | Plan CRUD: product, price, period (**daily/weekly/monthly/yearly**), min quantity, availability from/to | P0 |
| FR-CAT-04 | Per-plan lifecycle flags: **auto_close, closable_early, pausable, renewable** — these drive which transitions are legal | P0 |
| FR-CAT-05 | Tax CRUD: name, rate %; assignable to plan/product lines; inactive taxes excluded from new invoices | P0 |

### M3 — Quotation templates
| ID | Req | P |
|---|---|---|
| FR-QT-01 | Template CRUD: name, plan, pre-filled product lines (variant, qty, unit price), **validity_days** | P0 |
| FR-QT-02 | "New subscription from template" → subscription pre-populated, expiry = start + plan period(s), quotation validity stamped | P0 |

### M4 — Subscriptions
| ID | Req | P |
|---|---|---|
| FR-SUB-01 | Subscription: auto **number** (sequence), customer, plan, start/expiry dates, payment terms (net days), lines (variant, qty, unit price, taxes, amount) | P0 |
| FR-SUB-02 | State machine **DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED** with **PAUSED** branch from ACTIVE; illegal transitions rejected server-side; every transition written to `subscription_status_history` | P0 |
| FR-SUB-03 | Status visible to the whole team (list badges + detail timeline) | P0 |
| FR-SUB-04 | Pause/resume only if plan.pausable; billing skips PAUSED; resume re-anchors `next_billing_date` (documented rule) | P0 |
| FR-SUB-05 | Close early only if plan.closable_early; renew only if plan.renewable (extends expiry by period) | P0 |
| FR-SUB-06 | Auto-close: plans with auto_close close themselves after their final period is invoiced past expiry | P0 |
| FR-SUB-07 | Quantity validation ≥ plan.min_quantity at confirm time | P0 |
| FR-SUB-08 | Per-subscription **activity timeline** (status changes, invoices, payments) from history + audit data | P1 |

### M5 — Billing engine (the crown jewel)
| ID | Req | P |
|---|---|---|
| FR-BILL-01 | **Bulk generation:** find ACTIVE subscriptions with `next_billing_date ≤ as_of` → create one invoice per due period, fully pre-filled (customer, lines, taxes, totals) | P0 |
| FR-BILL-02 | **Both triggers, one service:** (a) admin/staff **"Run billing day" button** with live result modal; (b) automatic scheduler — **node-cron worker locally** (offline) and **Vercel Cron** on the hosted mirror; all call the same `BillingService.run()` | P0 |
| FR-BILL-03 | **Idempotency:** `UNIQUE(subscription_id, period_start)` + insert `ON CONFLICT DO NOTHING` → re-runs create **0** duplicates and report "skipped (already billed)" | P0 |
| FR-BILL-04 | **Concurrency safety:** `pg_advisory_xact_lock` per run (cron + button can't overlap); per-subscription work in its own transaction | P0 |
| FR-BILL-05 | **Catch-up ("never skipped"):** if the app was down, one run invoices every missed period (loop, capped at 12, one invoice per period — correct for MRR) | P0 |
| FR-BILL-06 | Every run audited in `billing_runs` (trigger type, actor, created/skipped/errors, duration); visible on an admin "Billing runs" page | P0 |
| FR-BILL-07 | Invoice numbering via `sequences` (gapless, race-safe) | P0 |
| FR-BILL-08 | Auto-advance `next_billing_date`; auto_close handling per FR-SUB-06 | P0 |

### M6 — Invoices
| ID | Req | P |
|---|---|---|
| FR-INV-01 | Invoice state machine **DRAFT → CONFIRMED → PAID**, CANCELLED branch from DRAFT/CONFIRMED | P0 |
| FR-INV-02 | Actions: confirm, cancel, **send** (stages email in outbox), **print** (dedicated print stylesheet, professional invoice layout) | P0 |
| FR-INV-03 | Lines snapshotted (product lines, discount lines, tax summary); totals: subtotal, tax, discount, grand total, amount paid, outstanding | P0 |
| FR-INV-04 | `due_date = issue_date + subscription.payment_terms_days` | P0 |
| FR-INV-05 | List with filters (status, customer, date range, overdue-only), keyset pagination, totals footer | P0 |

### M7 — Discounts (admin-only)
| ID | Req | P |
|---|---|---|
| FR-DISC-01 | Rule CRUD (admin only): kind (**fixed | percent**), value, min purchase, min quantity, start/end dates, **usage limit** | P0 |
| FR-DISC-02 | Scope: specific **products** or whole **subscription** | P0 |
| FR-DISC-03 | **Auto-apply on next invoice, no human memory:** the billing engine evaluates matching active rules and adds its own invoice line (`−₹X · Summer20`) | P0 |
| FR-DISC-04 | Stops when **expired** (end_date) or **exhausted** (count(discount_usages) ≥ usage_limit), checked transactionally | P0 |
| FR-DISC-05 | Precedence documented: product-scope first (per line), then subscription-scope on the reduced subtotal; fixed amount capped at remaining subtotal | P0 |
| FR-DISC-06 | Usage ledger visible on the rule ("used 37 / 100 times") | P1 |

### M8 — Payments
| ID | Req | P |
|---|---|---|
| FR-PAY-01 | Record payment: method (cash/bank/card/UPI/cheque), amount > 0, date, note, against the right invoice | P0 |
| FR-PAY-02 | Overpayment rejected with a clear message (amount ≤ outstanding) | P0 |
| FR-PAY-03 | `amount_paid` updated in the same transaction (documented denormalization); invoice auto-flips to PAID at full settlement | P0 |
| FR-PAY-04 | Paid vs outstanding visibility; **overdue list** = confirmed + due_date < today + outstanding > 0 | P0 |
| FR-PAY-05 | **Aging buckets** (current / 1–30 / 31–60 / 61–90 / 90+) on the dashboard | P1 |
| FR-PAY-06 | "Send reminder" on overdue invoices → staged in outbox (simulated dunning) | P2 |

### M9 — Finance dashboard & reports
| ID | Req | P |
|---|---|---|
| FR-DASH-01 | KPI cards: **active subscriptions, revenue received (period), amount owed, overdue invoices** | P0 |
| FR-DASH-02 | Filters (date range, plan, status) + summary view; every page **< 2s with 10k subscriptions** (indexes + keyset pagination + aggregate SQL; see NFR-PERF) | P0 |
| FR-DASH-03 | **MRR / ARR cards + MRR movement** (new, expansion, contraction, churn) + MRR trend chart — answers "nobody can say how much recurring revenue we actually have" | P1 |
| FR-DASH-04 | Revenue-by-plan chart, payments-received table, overdue aging chart (Recharts) | P1 |
| FR-DASH-05 | **Renewal forecast** — upcoming renewals next 7/30 days ("renewals remembered by whoever notices first" → solved) | P1 |
| FR-DASH-06 | CSV export of invoices/payments | P2 |
| FR-DASH-07 | Live-ish updates via TanStack Query polling (10s) — no websockets on day one | P1 |

### M10 — Customer portal
| ID | Req | P |
|---|---|---|
| FR-PORT-01 | Customer sees **only** own subscriptions and invoices (query-layer scoping) | P0 |
| FR-PORT-02 | Print/download own invoices; see status + outstanding | P0 |
| FR-PORT-03 | Request pause/resume/renew where plan flags allow | P1 |

### M11 — Notifications (offline-safe email)
| ID | Req | P |
|---|---|---|
| FR-MAIL-01 | All outgoing mail staged in `email_outbox` (reset links, invoice-sent, reminders) | P0 |
| FR-MAIL-02 | Admin **outbox viewer** — proves the mail flow live on stage without SMTP/internet | P1 |
| FR-MAIL-03 | If `SMTP_URL` is configured, a dispatcher sends for real; otherwise queued (env-driven, documented) | P2 |

### M12 — Admin & system
| ID | Req | P |
|---|---|---|
| FR-ADM-01 | Staff management (admin only): create/deactivate staff | P0 |
| FR-ADM-02 | Billing runs history page | P0 |
| FR-ADM-03 | Global audit log of sensitive actions (status changes, discounts, payments) | P1 |
| FR-ADM-04 | Seed tooling: demo dataset **and** volume generator (≥10k subscriptions, ≥40k invoices) to prove the <2s claim | P0 |

---

## 4. Non-functional requirements

| ID | Requirement | How |
|---|---|---|
| NFR-PERF-01 | **Every page < 2s at 10k subscriptions / 40k invoices** (stated in the problem) | Indexes per `ER.md`; keyset (cursor) pagination (no OFFSET); dashboard KPIs = single aggregate queries with `FILTER`; `amount_paid` denormalized; verified with `EXPLAIN ANALYZE` on the volume seed |
| NFR-OFFL-01 | Demo runs **fully offline**: local PostgreSQL, no cloud dependency, no external API at runtime | Local DB; outbox instead of SMTP; no CDNs (fonts/assets bundled) |
| NFR-SEC-01 | OWASP basics | bcrypt hashing; server-side RBAC; 100% parameterized queries via Prisma (zero string-concat SQL); React-escaped rendering + zod input validation (XSS); customer data scoping at query layer |
| NFR-VAL-01 | **Robust validation on client AND server** | zod schemas in `src/server/validation/` imported by both tRPC procedures and forms; DB `CHECK` constraints as last line of defense; consistent error shape `{code, message, field?}` |
| NFR-REL-01 | Billing correctness: **nothing billed twice or skipped** | UNIQUE constraint + advisory lock + catch-up loop + transactional per-subscription work + unit tests |
| NFR-SCAL-01 | Stateless API layer, paginated lists, indexed queries — grows without rewrite | App Router server components + tRPC; no in-process state |
| NFR-USE-01 | Responsive, consistent color scheme/layout, intuitive nav, no dead buttons | UI Excellence Program with 4 gates (PLAN §11): `design-taste-frontend` art direction → per-screen design pass → mid-build `impeccable` review → final pre-demo polish |
| NFR-MAIN-01 | **HIGHLY MODULAR** architecture, consistent patterns | Feature modules per `PLAN.md` §1: one folder per domain with a fixed anatomy (`index/router/service/schemas/queries/components/tests`), barrel-only cross-module imports (eslint-enforced), pure framework-free services, contracts exported by the provider module; deletable-module test passes |

---

## 5. State machines

### 5.1 Subscription
```
DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED
                          ACTIVE ⇄ PAUSED   (only if plan.pausable)
                          CONFIRMED → CLOSED (only if plan.closable_early)
                          ACTIVE → CLOSED    (manual if closable_early; automatic if plan.auto_close && expiry reached)
                          ACTIVE → ACTIVE    (renew: extends expiry, only if plan.renewable)
```
Rules: every transition writes `subscription_status_history`; illegal transitions → 409 with
`{code:"ILLEGAL_TRANSITION", from, to}`. `next_billing_date` set at CONFIRMED (= start_date).

### 5.2 Invoice
```
DRAFT → CONFIRMED → PAID
DRAFT → CANCELLED ; CONFIRMED → CANCELLED (only if amount_paid = 0)
PAID is terminal. PAID set automatically when amount_paid ≥ grand_total.
```

---

## 6. Business rules (exact, testable)

1. **Password:** length > 8 ∧ ≥1 [A-Z] ∧ ≥1 [a-z] ∧ ≥1 special (`[^A-Za-z0-9]`).
2. **Tax:** `line_tax = round(line_amount × rate/100, 2)`; summed per invoice; applied from active taxes assigned to the line at generation time (snapshot).
3. **Discount precedence:** (1) product-scope rules → matching lines only; (2) subscription-scope rules → post-discount subtotal. Percent: `base × value/100`. Fixed: `min(value, remaining_subtotal)`. Never below zero.
4. **Discount eligibility window:** `start_date ≤ invoice.issue_date ≤ end_date` ∧ `used_count < usage_limit` (NULL = unlimited) ∧ min_purchase/min_quantity satisfied.
5. **Billing period:** `[next_billing_date, next_billing_date + plan.period)`; one invoice per period; `next_billing_date` advances per period invoiced (catch-up loop ≤ 12).
6. **Overdue:** `status = CONFIRMED ∧ due_date < today ∧ (grand_total − amount_paid) > 0`.
7. **MRR:** per `§1.3`; computed from ACTIVE subscriptions' current lines at list time (SQL aggregate, not row-by-row).
8. **Sequences:** `UPDATE sequences SET last_number = last_number + 1 WHERE doc_type=$1 AND year=$2 RETURNING last_number` inside the document's transaction; format `PREFIX-YEAR-%05d`.
9. **Resume rule:** on resume from PAUSED, `next_billing_date = GREATEST(next_billing_date, today)` and the gap is **not** invoiced (documented choice — pause = service holiday).
10. **Idempotent billing:** a run with the same `as_of` after a successful run MUST create 0 invoices and report all due subs as `skipped_already_billed`.

---

## 7. Traceability — problem statement scenes → requirements

| PDF scene | FRs | Primary owner |
|---|---|---|
| 1. A new customer signs up | FR-AUTH-01…07 | Abhiram |
| 2. Launching a new plan | FR-CAT-01…05 | Abhiram |
| 3. Turning a quote into a subscription | FR-QT-01…02, FR-SUB-01…08 | Catherine |
| 4. Billing day | FR-BILL-01…08, FR-INV-01…05 | Gabriel + Catherine |
| 5. A customer asks for a better price | FR-DISC-01…06 | Catherine |
| 6. The money comes in | FR-PAY-01…06 | Catherine |
| 7. The finance lead | FR-DASH-01…07 | Pavithra |
| (cross-cutting) portal, mail, admin, seeds, deploy | FR-PORT/MAIL/ADM | Abhiram + Pavithra + Gabriel |

## 8. Out of scope (explicit — no scope creep)
Real payment gateway · real SMTP (P2 behind env) · multi-currency (INR only) · proration
(mid-cycle plan changes — P2 design note in PLAN §10) · webhooks · multi-tenancy ·
credit notes/refunds · mobile apps.
