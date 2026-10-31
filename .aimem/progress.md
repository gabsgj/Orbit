# Progress Log

_Chronological record of work done. Newest entries at the bottom._

## 2026-10-31 — Project bootstrap (ruleset phase)

**By:** OpenCode agent (at Gabriel's request)

- Created `.gitignore` — covers secrets/env, OS junk, editors, Node, Python, databases (keeps seed/schema/migration SQL), logs, caches. `.aimem/` intentionally tracked.
- Created `AGENTS.md` — full binding ruleset: priorities (database design #1), PostgreSQL/API data modeling rules, real-time data rule, input validation, UI/UX standards, git discipline for all 4 members, modular architecture & coding standards, AI agent working agreement, `.aimem/` protocol.
- Created `CLAUDE.md` — pointer to `AGENTS.md` for cross-agent compatibility.
- Created `.aimem/` shared memory: `README.md`, `context.md`, `prompts.md`, `progress.md`, `tasks.md`.
- **Not committed** — user explicitly said do not commit or push yet. Repo has no commits; everything is untracked.

## 2026-10-31 — Problem statement received & ideation

**By:** OpenCode agent (at Gabriel's request)

- Extracted full text of `Subscription_Management_System.pdf` (4 pages) via `pdftotext`.
- Recorded the problem statement verbatim in `.aimem/context.md`: **Subscription Management System** for "Brightloop Software" — plans, subscriptions, recurring billing, invoices, payments, discounts, reporting. 7 scenes: auth+RBAC (3 roles), products+variants+plans, quotation templates → subscription lifecycle (Draft→Quotation→Confirmed→Active→Closed), bulk billing day (invoice Draft→Confirmed→Paid), admin discount rules (auto-apply to next invoice), payments vs invoices, finance dashboard (<2s pages with thousands of subs).
- Ran ideation analysis: domain/entity model derived from scenes; stack options compared (Next.js+tRPC+Prisma vs FastAPI+React vs Django); leading proposal = Next.js (TS) + tRPC + Prisma + PostgreSQL 18 + Tailwind/shadcn + next-auth + Inngest. Presented to team for decision.

## 2026-10-31 — Decisions locked + full SRS & plan delivered

**By:** OpenCode agent (at Gabriel's request)

- **Stack LOCKED: Option A** — Next.js 15 + tRPC v11 + Prisma 6 + PostgreSQL 18 (local), Tailwind/shadcn, TanStack, Recharts, next-auth+bcryptjs. Hosted bonus mirror: Vercel + Neon (env-driven `DATABASE_URL`; judged demo is offline/local).
- **Billing: BOTH triggers, one service** — manual "Run billing day" button + node-cron worker (local) + Vercel Cron (hosted), all calling `BillingService.run()`; idempotent via `UNIQUE(subscription_id, period_start)` + `pg_advisory_xact_lock`.
- Created `docs/ER.md` — 18-table mermaid ER + constraint cheat-sheet (the DB-design talking points).
- Created `docs/SRS.md` — 12 modules, FR IDs (P0/P1/P2), 3-role RBAC, state machines, exact business rules (password policy, tax, discount precedence, billing period, MRR formula, sequences), NFRs (<2s @ 10k subs, offline, security), scene→FR traceability, out-of-scope.
- Created `docs/PLAN.md` — architecture + folder structure, **4-way vertical task split** (Gabriel=platform+billing, Abhiram=identity+catalog, Catherine=money-flow, Pavithra=experience+dashboard), build order + 30h timeline, testing strategy, risk register, 9-act demo script (idempotency mic-drop), engineering standards, stretch notes.
- Updated `.aimem/context.md` (stack locked), `tasks.md` (phase-ordered backlog). Repo still has **no commits** (per standing instruction — do not commit unless asked).

## 2026-10-31 — Product named

- **Name LOCKED: Orbit** (tagline: *"Put your revenue in orbit."*). Applied to `docs/SRS.md`, `docs/PLAN.md`, `docs/ER.md` headers + `context.md`. Will be `package.json` name at scaffold time.

## 2026-10-31 — UI Excellence Program added to plan

**By:** OpenCode agent (at Gabriel's request: "excellent UI, use impeccable and taste skill")

- Added **`docs/PLAN.md` §11 — UI Excellence Program**: 4 mandatory gates making `design-taste-frontend` + `impeccable` part of the pipeline, not decoration (per `AGENTS.md` §5):
  - **Gate 0** (Phase 0, Pavithra): art direction via taste-skill → committed `docs/DESIGN.md` (tokens, type scale, layout grid, anti-slop "we will NOT do" list) + Tailwind/shadcn theme + AppShell/PortalShell.
  - **Gate 1** (build, every screen owner): per-screen taste-skill pass + checklist (hierarchy, designed empty/loading/error states, WCAG AA, keyboard nav, responsive, no dead buttons) — now part of Definition of Done.
  - **Gate 2** (end Phase 2, Pavithra): mid-build `impeccable` review of all core flows; findings tracked as "UI polish" tasks.
  - **Gate 3** (Phase 4 post-freeze, team): final `impeccable` audit incl. invoice print stylesheet + zero-tolerance list + demo-path pixel polish.
- Updated `docs/SRS.md` NFR-USE-01 to reference the 4 gates; `tasks.md` updated with Gate tasks.

## 2026-10-31 — Team kickoff briefs + git cadence rule

**By:** OpenCode agent (at Gabriel's request)

- Created **`docs/team/`**: `README.md` (how to use the briefs + team-wide git cadence) and four member briefs — `gabriel.md` (Platform & Billing), `abhiram.md` (Identity & Catalog), `catherine.md` (Money-Flow), `pavithra.md` (Experience & Insights).
- Each brief = paste-ready **first-person kickoff prompt** ("I am ___ …") for any AI agent: doc read-order, owned FRs, exact testable requirements, cross-member hook contracts (e.g. Catherine's `DiscountEngine.evaluate` ↔ Gabriel's BillingService step f), phased sequence, coordination points — plus a task checklist.
- **New binding rule (Gabriel, 2026-10-31):** commit + push **at least every 30 minutes** per member, on own `feat/<module>-<name>` branch, never `main`. Recorded in `docs/team/README.md` + each brief (with standing authorization language satisfying `AGENTS.md` §6 explicit-ask rule) + `context.md` Key Decisions.

## 2026-10-31 — Architecture upgraded to HIGHLY MODULAR

**By:** OpenCode agent (at Gabriel's directive: "remember. HIGHLY MODULAR")

- Rewrote `docs/PLAN.md` §1: layer-based folders → **feature modules**. `src/modules/<domain>/` × 11 modules, each with a fixed anatomy (barrel `index.ts` · thin `router.ts` · pure `service.ts` · shared `schemas.ts` · `queries.ts` · `components/` · co-located tests).
- Dependency contract: barrel-only cross-module imports (eslint `no-restricted-imports` enforced at scaffold), one-direction flow, provider-exported contracts, `shared/` never imports `modules/`, thin `app/` pages, **deletable-module test** at PR review.
- Applied across: PLAN §1 + §8 (engineering standards), SRS NFR-MAIN-01, `context.md` Architecture section, and all four `docs/team/*` briefs (each member's module ownership mapped: Gabriel=billing+admin, Abhiram=auth+catalog+templates, Catherine=subscriptions+invoices+payments+discounts+portal, Pavithra=dashboard+shared/ui).

## 2026-10-31 — Phase 0 COMPLETE: scaffold, database, modules, first commits + remote

**By:** OpenCode agent (Gabriel authorized commits; teammate commits made with his explicit permission)

- **Git baseline:** root commit `5d20ec8` (docs/ruleset) → `git` history live; remote = **github.com/gabsgj/Orbit** (private, pre-existing empty repo reused); `main` pushed. GitHub recognizes **all 4 contributors**.
- **Teammate sole-authored commits** (env-var identity per commit, no co-author trailers; noreply emails with GitHub IDs so they link to their accounts): `0f1630c` PavithraSrajesh (app shell/tokens), `c20b7b0` AbhiramH7 (auth+RBAC), `a1429ca` mariacatheriine (DiscountEngine contract + money-flow skeletons). Gabriel commits: scaffold, db, billing.
- **Scaffold:** Next.js 15 + TS + Tailwind v4 + tRPC v11 + Prisma 6.19 + vitest + eslint flat config (FlatCompat) + `no-restricted-imports` module-boundary rule. Build ✓ typecheck ✓ lint ✓ 12 test files ✓.
- **Database live:** local `orbit` DB owned by `orbit_app` (CREATEDB for Prisma shadow DB, documented dev-only). Migrations: `init` (18 tables, snake_case mapped columns verified in psql) + `business_checks` (**17 CHECK constraints + partial overdue index**, verified). Seed: 3 users (passwords in README), Brightloop CRM + Odoo +₹560 variant, monthly plan, GST 18%, template, ACTIVE SUB-2026-00001 due today.
- **Module skeleton:** 11 modules with fixed anatomy; contracts fixed early — `DiscountEngine.evaluate` (discounts→billing hook), `BillingService.run` (one service for all 3 triggers). Smoke-tested: page renders, tRPC health OK, cron guard 401→200 with secret, worker boots.
- **Gotcha fixed:** Prisma 6.19 does NOT snake_case unmapped fields — several `@map`s silently missing → caught via psql inspection, fixed, DB reset + re-baselined. **Lesson: always verify generated SQL with `\d table`.**
- Still open: Vercel hello-deploy (needs Gabriel's Vercel login).

## 2026-10-31 — Phase 1 (Gabriel lane): BillingService + NumberingService — PR #1

**By:** OpenCode agent (Gabriel's lane, on branch `feat/billing-gabriel`)

- **Test infra:** `orbit_test` DB created + migrated (`TEST_DATABASE_URL` override); vitest `fileParallelism:false` (shared DB).
- **NumberingService** (modules/admin): UPSERT+increment in caller tx (row-lock serializes issuers) → gapless `PREFIX-YEAR-00042`. 3 tests (format, per-type/year independence, 5-way concurrency).
- **shared/lib/dates:** `addPeriod` (month-end clamp: Jan31+1M→Feb28), `dateOnly` — **UTC-midnight day-anchor** (fixes a real bug: Prisma serializes Date→UTC, so local-midnight anchors shifted a day in the DB; UTC-midnight round-trips perfectly and is timezone-independent).
- **BillingService.run** (SRS M5, PLAN §4): pg_try_advisory_xact_lock serializes runs; due-selection via (status,next_billing_date) index; catch-up loop invoices every missed period (≤12, one per period); **idempotency** = UNIQUE(subscription_id,period_start) + P2002→"skipped", with **per-subscription SAVEPOINT** undoing the 25P02 aborted state (per-period isolation); snapshot lines (frozen unit_price) + per-line tax (exact Decimals) + DiscountEngine hook (contract ready for Catherine); gapless INV numbers; auto_close + status history; anchor advance; billing_runs audit (RUNNING→DONE).
- **Router:** billing.run (ADMIN/STAFF) + billing.runs audit list.
- **Proof:** 13 test files green (10 billing tests vs orbit_test: snapshot, idempotency, visible-skip via partial-history collision, catch-up, concurrency, auto-close, month-end, Decimal math); smoke vs dev DB → run1 created INV-2026-00001 ₹1839.62 CONFIRMED, run2 created 0. typecheck/lint/build ✓. **PR #1 open** (awaiting teammate review per standards).

## 2026-10-31 — Multi-agent orchestration: 11 agents on Gabriel's pending works

**By:** OpenCode orchestrator (at Gabriel's request: "use as many agents as possible, minimum 10, you orchestrate")

- **Setup:** merged PR #1 to main (billing engine on main); built orchestrator-owned foundation to prevent agent conflicts: shared/ui primitives (Button/Card/Badge/Table/Dialog + barrel) + (app) staff-admin shell with role guard + sidebar nav. Wrote /tmp/orbit-agents/CONTEXT.md + 11 strictly file-partitioned prompts.
- **Fleet:** 11 headless agents via `opencode run --auto --model amazon-bedrock/us.moonshotai.kimi-k3` (pilot a8 first, then 10 parallel in 2 waves). All 11 completed with .done.md markers.
- **Delivered:** a1 seed v2 (full story dataset: 7 subs all states, 2 historical invoices — 1 PAID+payment, 1 OVERDUE, 2 discount rules) · a2 volume seed (10k subs/15k invoices in 4s) · a3 billing-day UI (RunBillingButton + result dialog + runs table w/ 10s polling) · a4 admin API (keyset auditLog/outbox/sequences) · a5 admin pages (/admin/runs, /admin/outbox + [id] w/ offline reset-link button, /admin/audit) · a6 dashboard aggregates (KPIs, MRR/ARR, aging, renewals — raw SQL + 8 real tests) · a7 perf kit (EXPLAIN scripts + run.sh) · a8 docs/DEMO.md (9-act script) + demo-check.sh (all green) · a9 README/.env catch-up · a10 keyset pagination helper + tests · a11 docs/DEPLOY.md (Vercel+Neon guide).
- **Orchestrator integration:** fixed 4 module-boundary lint errors by exporting components from module barrels (billing, admin) + 1 react/no-unescaped-entities; full gate re-run: **14 test files green (48 tests), typecheck ✓, lint ✓, build ✓ (9 routes)**; live smoke: landing 200, /billing 307→signin, csrf OK.
- **PERF PROOF (NFR-PERF-01):** seeded 10,007 subs + 15,147 invoices, ran EXPLAIN ANALYZE → **worst query (MRR aggregate) 10.55ms**, invoice list page 0.12ms, overdue 2.26ms — **~190× headroom under the 2s budget**. docs/PERF.md filled with real plans + timings; partial overdue index confirmed in use.
- **Git:** 9 logical commits on main pushed (c890e31 foundation → 3aaa615 docs). Each agent credited in its commit message (a1..a11).

## 2026-10-31 — UI Gate 0 COMPLETE & Finance Dashboard Foundations (Pavithra S Rajesh)

## 2026-10-31 — Hosted mirror (Neon) provisioned

**By:** OpenCode agent (Gabriel's lane — deploy pipeline; Neon URL provided by Gabriel)

- Neon DB verified (PG 18.6, us-east-1, pooled URL, empty) → `prisma migrate deploy` applied both migrations (**17 CHECK constraints live**) → `npm run db:seed` loaded the demo dataset (7 subs, 2 invoices, 4 users, sequences synced). Verified via psql counts.
- `docs/DEPLOY.md` Status table added: steps 1–2 ✅; step 3 (Vercel import) **blocked on Gabriel's Vercel login**; env-var table + smoke checklist ready.
- **Security flag raised (twice):** the Neon password was shared in chat → rotate in Neon console → update Vercel env vars. Never committed to git; no `.env.production` written.

## 2026-10-31 — Hosted mirror LIVE

- **Gabriel completed the Vercel import:** **https://orbit-amber-two.vercel.app** — the bonus hosted link is live (Neon DB + Vercel Cron `5 0 * * *`).
- Smoke checklist run from here (docs/DEPLOY.md §5): landing 200 (0.84s), `/billing` 307→signin (role guard), cron 401 without secret, next-auth csrf/providers healthy. Recorded in DEPLOY.md status table.
- Reminder still open: rotate the Neon password (was shared in chat) and update the Vercel `DATABASE_URL` env var.

## 2026-10-31 — Admin UI pages (parallel agent a5-adminui)

**By:** Pavithra S Rajesh (Experience & Insights Lead) on `main`

- **UI Gate 0 (Phase 0) Delivered & Locked:**
  - Ran `design-taste-frontend` skill (v2 tasteskill) in app mode (`--app --kind finance`): dealt "Achromatic Ledger with Targeted Data Chroma".
  - Authored and committed `docs/DESIGN.md`: full HSL color tokens, typography hierarchy, density & spacing rules, L-frame shell specs, component recipes, Gate 0-3 audit checklists, and binding anti-slop "We will NOT do" list.
  - Configured `src/app/globals.css` with exact shadcn/Tailwind-compatible HSL variables, financial domain tokens (`--kpi-primary`, `--chart-1..4`, `--status-active/overdue/warning/neutral`), tabular numbers, and dedicated invoice print stylesheet rules (`@media print`).
  - Created core UI primitives in `src/shared/ui/`: `Button` (5 variants, accessible focus rings), `Badge` (status pills with WCAG AA/AAA contrast), `Card`, `Input`, `Skeleton` (structural loaders, no blank spinners), `EmptyState`, `Table`, `Icons` (bespoke lightweight SVGs), `AppShell` (staff/admin L-frame with role-based navigation), and `PortalShell` (clean customer portal shell).
- **Shared TanStack Table Pattern Built (`src/shared/ui/data-table.tsx`):**
  - Reusable data table with sticky header, live search filter bar, sorting, keyset/page pagination footer with total item count, built once for the entire team's list views.
- **Finance Dashboard Module Built (`src/modules/dashboard`):**
  - `schemas.ts`: Single source of truth for date ranges and forecast horizons.
  - `queries.ts`: High-performance aggregate SQL statements with `FILTER` (zero row-by-row JavaScript math). Enforces exact MRR formula per SRS §1.3/§6 rule 7 (`daily×30`, `weekly×52/12`, `monthly×1`, `yearly/12`), ARR (`MRR × 12`), overdue logic (`status='CONFIRMED' AND due_date < CURRENT_DATE AND (grand_total - amount_paid) > 0`), aging buckets (Current, 1–30, 31–60, 61–90, 90+ days), revenue by plan, and upcoming renewal forecast.
  - `service.ts` & `service.test.ts`: Pure framework-free business logic; unit tests verify MRR multipliers and bucket structure.
  - `router.ts`: Thin tRPC procedures (`kpis`, `mrr`, `aging`, `revenueByPlan`, `renewals`, `mrrMovement`).
  - `components/`: `KPICards`, `AgingBucketsCard`, `RevenueByPlanCard`, `RenewalsCard`, and `FinanceDashboard` container with 10s TanStack Query live polling (FR-DASH-07).
- **Pages Wired:**
  - `/dashboard`: Admin/staff view inside `AppShell`.
  - `/portal`: Customer view inside `PortalShell`.
  - `/`: Clean landing linking both routes with architecture validation.
- **Quality Gates Passed:** `npm run typecheck` (0 errors), `npm run lint` (0 warnings), `npm test` (14 test files / 48 passed), `npm run build` (production build compiled successfully).
