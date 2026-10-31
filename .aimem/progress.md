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
- Still open: Vercel hello-deploy (needs Gabriel's Vercel login), Pavithra's UI Gate 0 (docs/DESIGN.md).

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
- **Lesson for agents:** module-boundary eslint rule caught deep component imports — correct fix is exporting components from the module barrel (public surface), never bypassing the rule.

## 2026-10-31 — Admin UI pages (parallel agent a5-adminui)

**By:** OpenCode agent a5-adminui (orchestrated parallel build)

- **Pages created:** `admin/runs` (reuses `trpc.billing.runs`, FR-ADM-02), `admin/outbox` list (FR-MAIL-02, demo-critical), `admin/outbox/[id]` detail (server component, prisma direct read, first-href "Open link" button = offline reset-link demo), `admin/audit` list (FR-ADM-03).
- **Components:** `modules/admin/components/{outbox-list,audit-log-list}.tsx` — client components, keyset "Load more" via `nextCursor` (no OFFSET, NFR-PERF-01), page accumulator in state.
- **Contract:** matches a4-adminapi's `admin.outbox`/`admin.auditLog` (`{items,nextCursor}`, audit includes `user.email`).
- **Gotcha:** TanStack Query v5 has no `keepPreviousData: true` — must use `placeholderData: keepPreviousData` import.
- **Verify:** `npx tsc --noEmit` clean for all 6 files (only remaining repo errors are a2-volume's `prisma/seed/volume.ts`).
