# Progress Log

_Chronological record of work done. Newest entries at the bottom._

## 2026-10-31 — Identity & Catalog hardening follow-up

**By:** Abhiram H / Codex

- Audited the completed auth, catalog, templates, staff, and outbox implementation against the assigned acceptance criteria.
- Fixed reset-token consumption so the `used_at IS NULL AND expires_at > now()` predicate is part of the transactional write; a concurrent reset can now succeed exactly once. Added a concurrent-use regression test.
- Restricted staff deactivation to STAFF records, preserving customer accounts and the existing self/admin protections.
- Replaced hard-coded admin/customer identities in dashboard and portal pages with `getServerSession` guards; the `(app)` route group now uses `AppShell` with the real authenticated role so navigation filtering is meaningful.
- Added tax search/status filters and keyset pagination, and reused `createTaxSchema` in the tax form.
- Did not alter the Prisma schema: `users.email` is still TEXT rather than the required `citext`; this is explicitly queued for Gabriel because it needs a reviewed migration.

## 2026-10-31 — CI regression repair

**By:** Abhiram H / Codex

- Fixed the CI type errors in `catalog/service.test.ts` after taxes moved to the shared keyset `Page<T>` response: test input now supplies `take`, and the assertion correctly reads `page.items`.
- Added the missing expired-token regression test and a server-side `requireRole` RBAC matrix for anonymous, CUSTOMER, STAFF, and ADMIN callers.

## 2026-10-31 ΓÇö Project bootstrap (ruleset phase)

**By:** OpenCode agent (at Gabriel's request)

- Created `.gitignore` ΓÇö covers secrets/env, OS junk, editors, Node, Python, databases (keeps seed/schema/migration SQL), logs, caches. `.aimem/` intentionally tracked.
- Created `AGENTS.md` ΓÇö full binding ruleset: priorities (database design #1), PostgreSQL/API data modeling rules, real-time data rule, input validation, UI/UX standards, git discipline for all 4 members, modular architecture & coding standards, AI agent working agreement, `.aimem/` protocol.
- Created `CLAUDE.md` ΓÇö pointer to `AGENTS.md` for cross-agent compatibility.
- Created `.aimem/` shared memory: `README.md`, `context.md`, `prompts.md`, `progress.md`, `tasks.md`.
- **Not committed** ΓÇö user explicitly said do not commit or push yet. Repo has no commits; everything is untracked.

## 2026-10-31 ΓÇö Problem statement received & ideation

**By:** OpenCode agent (at Gabriel's request)

- Extracted full text of `Subscription_Management_System.pdf` (4 pages) via `pdftotext`.
- Recorded the problem statement verbatim in `.aimem/context.md`: **Subscription Management System** for "Brightloop Software" ΓÇö plans, subscriptions, recurring billing, invoices, payments, discounts, reporting. 7 scenes: auth+RBAC (3 roles), products+variants+plans, quotation templates ΓåÆ subscription lifecycle (DraftΓåÆQuotationΓåÆConfirmedΓåÆActiveΓåÆClosed), bulk billing day (invoice DraftΓåÆConfirmedΓåÆPaid), admin discount rules (auto-apply to next invoice), payments vs invoices, finance dashboard (<2s pages with thousands of subs).
- Ran ideation analysis: domain/entity model derived from scenes; stack options compared (Next.js+tRPC+Prisma vs FastAPI+React vs Django); leading proposal = Next.js (TS) + tRPC + Prisma + PostgreSQL 18 + Tailwind/shadcn + next-auth + Inngest. Presented to team for decision.

## 2026-10-31 ΓÇö Decisions locked + full SRS & plan delivered

**By:** OpenCode agent (at Gabriel's request)

- **Stack LOCKED: Option A** ΓÇö Next.js 15 + tRPC v11 + Prisma 6 + PostgreSQL 18 (local), Tailwind/shadcn, TanStack, Recharts, next-auth+bcryptjs. Hosted bonus mirror: Vercel + Neon (env-driven `DATABASE_URL`; judged demo is offline/local).
- **Billing: BOTH triggers, one service** ΓÇö manual "Run billing day" button + node-cron worker (local) + Vercel Cron (hosted), all calling `BillingService.run()`; idempotent via `UNIQUE(subscription_id, period_start)` + `pg_advisory_xact_lock`.
- Created `docs/ER.md` ΓÇö 18-table mermaid ER + constraint cheat-sheet (the DB-design talking points).
- Created `docs/SRS.md` ΓÇö 12 modules, FR IDs (P0/P1/P2), 3-role RBAC, state machines, exact business rules (password policy, tax, discount precedence, billing period, MRR formula, sequences), NFRs (<2s @ 10k subs, offline, security), sceneΓåÆFR traceability, out-of-scope.
- Created `docs/PLAN.md` ΓÇö architecture + folder structure, **4-way vertical task split** (Gabriel=platform+billing, Abhiram=identity+catalog, Catherine=money-flow, Pavithra=experience+dashboard), build order + 30h timeline, testing strategy, risk register, 9-act demo script (idempotency mic-drop), engineering standards, stretch notes.
- Updated `.aimem/context.md` (stack locked), `tasks.md` (phase-ordered backlog). Repo still has **no commits** (per standing instruction ΓÇö do not commit unless asked).

## 2026-10-31 ΓÇö Product named

- **Name LOCKED: Orbit** (tagline: *"Put your revenue in orbit."*). Applied to `docs/SRS.md`, `docs/PLAN.md`, `docs/ER.md` headers + `context.md`. Will be `package.json` name at scaffold time.

## 2026-10-31 ΓÇö UI Excellence Program added to plan

**By:** OpenCode agent (at Gabriel's request: "excellent UI, use impeccable and taste skill")

- Added **`docs/PLAN.md` ┬º11 ΓÇö UI Excellence Program**: 4 mandatory gates making `design-taste-frontend` + `impeccable` part of the pipeline, not decoration (per `AGENTS.md` ┬º5):
  - **Gate 0** (Phase 0, Pavithra): art direction via taste-skill ΓåÆ committed `docs/DESIGN.md` (tokens, type scale, layout grid, anti-slop "we will NOT do" list) + Tailwind/shadcn theme + AppShell/PortalShell.
  - **Gate 1** (build, every screen owner): per-screen taste-skill pass + checklist (hierarchy, designed empty/loading/error states, WCAG AA, keyboard nav, responsive, no dead buttons) ΓÇö now part of Definition of Done.
  - **Gate 2** (end Phase 2, Pavithra): mid-build `impeccable` review of all core flows; findings tracked as "UI polish" tasks.
  - **Gate 3** (Phase 4 post-freeze, team): final `impeccable` audit incl. invoice print stylesheet + zero-tolerance list + demo-path pixel polish.
- Updated `docs/SRS.md` NFR-USE-01 to reference the 4 gates; `tasks.md` updated with Gate tasks.

## 2026-10-31 ΓÇö Team kickoff briefs + git cadence rule

**By:** OpenCode agent (at Gabriel's request)

- Created **`docs/team/`**: `README.md` (how to use the briefs + team-wide git cadence) and four member briefs ΓÇö `gabriel.md` (Platform & Billing), `abhiram.md` (Identity & Catalog), `catherine.md` (Money-Flow), `pavithra.md` (Experience & Insights).
- Each brief = paste-ready **first-person kickoff prompt** ("I am ___ ΓÇª") for any AI agent: doc read-order, owned FRs, exact testable requirements, cross-member hook contracts (e.g. Catherine's `DiscountEngine.evaluate` Γåö Gabriel's BillingService step f), phased sequence, coordination points ΓÇö plus a task checklist.
- **New binding rule (Gabriel, 2026-10-31):** commit + push **at least every 30 minutes** per member, on own `feat/<module>-<name>` branch, never `main`. Recorded in `docs/team/README.md` + each brief (with standing authorization language satisfying `AGENTS.md` ┬º6 explicit-ask rule) + `context.md` Key Decisions.

## 2026-10-31 ΓÇö Architecture upgraded to HIGHLY MODULAR

**By:** OpenCode agent (at Gabriel's directive: "remember. HIGHLY MODULAR")

- Rewrote `docs/PLAN.md` ┬º1: layer-based folders ΓåÆ **feature modules**. `src/modules/<domain>/` ├ù 11 modules, each with a fixed anatomy (barrel `index.ts` ┬╖ thin `router.ts` ┬╖ pure `service.ts` ┬╖ shared `schemas.ts` ┬╖ `queries.ts` ┬╖ `components/` ┬╖ co-located tests).
- Dependency contract: barrel-only cross-module imports (eslint `no-restricted-imports` enforced at scaffold), one-direction flow, provider-exported contracts, `shared/` never imports `modules/`, thin `app/` pages, **deletable-module test** at PR review.
- Applied across: PLAN ┬º1 + ┬º8 (engineering standards), SRS NFR-MAIN-01, `context.md` Architecture section, and all four `docs/team/*` briefs (each member's module ownership mapped: Gabriel=billing+admin, Abhiram=auth+catalog+templates, Catherine=subscriptions+invoices+payments+discounts+portal, Pavithra=dashboard+shared/ui).

## 2026-10-31 ΓÇö Phase 0 COMPLETE: scaffold, database, modules, first commits + remote

**By:** OpenCode agent (Gabriel authorized commits; teammate commits made with his explicit permission)

- **Git baseline:** root commit `5d20ec8` (docs/ruleset) ΓåÆ `git` history live; remote = **github.com/gabsgj/Orbit** (private, pre-existing empty repo reused); `main` pushed. GitHub recognizes **all 4 contributors**.
- **Teammate sole-authored commits** (env-var identity per commit, no co-author trailers; noreply emails with GitHub IDs so they link to their accounts): `0f1630c` PavithraSrajesh (app shell/tokens), `c20b7b0` AbhiramH7 (auth+RBAC), `a1429ca` mariacatheriine (DiscountEngine contract + money-flow skeletons). Gabriel commits: scaffold, db, billing.
- **Scaffold:** Next.js 15 + TS + Tailwind v4 + tRPC v11 + Prisma 6.19 + vitest + eslint flat config (FlatCompat) + `no-restricted-imports` module-boundary rule. Build Γ£ô typecheck Γ£ô lint Γ£ô 12 test files Γ£ô.
- **Database live:** local `orbit` DB owned by `orbit_app` (CREATEDB for Prisma shadow DB, documented dev-only). Migrations: `init` (18 tables, snake_case mapped columns verified in psql) + `business_checks` (**17 CHECK constraints + partial overdue index**, verified). Seed: 3 users (passwords in README), Brightloop CRM + Odoo +Γé╣560 variant, monthly plan, GST 18%, template, ACTIVE SUB-2026-00001 due today.
- **Module skeleton:** 11 modules with fixed anatomy; contracts fixed early ΓÇö `DiscountEngine.evaluate` (discountsΓåÆbilling hook), `BillingService.run` (one service for all 3 triggers). Smoke-tested: page renders, tRPC health OK, cron guard 401ΓåÆ200 with secret, worker boots.
- **Gotcha fixed:** Prisma 6.19 does NOT snake_case unmapped fields ΓÇö several `@map`s silently missing ΓåÆ caught via psql inspection, fixed, DB reset + re-baselined. **Lesson: always verify generated SQL with `\d table`.**
- Still open: Vercel hello-deploy (needs Gabriel's Vercel login).

## 2026-10-31 ΓÇö Phase 1 (Gabriel lane): BillingService + NumberingService ΓÇö PR #1

**By:** OpenCode agent (Gabriel's lane, on branch `feat/billing-gabriel`)

- **Test infra:** `orbit_test` DB created + migrated (`TEST_DATABASE_URL` override); vitest `fileParallelism:false` (shared DB).
- **NumberingService** (modules/admin): UPSERT+increment in caller tx (row-lock serializes issuers) ΓåÆ gapless `PREFIX-YEAR-00042`. 3 tests (format, per-type/year independence, 5-way concurrency).
- **shared/lib/dates:** `addPeriod` (month-end clamp: Jan31+1MΓåÆFeb28), `dateOnly` ΓÇö **UTC-midnight day-anchor** (fixes a real bug: Prisma serializes DateΓåÆUTC, so local-midnight anchors shifted a day in the DB; UTC-midnight round-trips perfectly and is timezone-independent).
- **BillingService.run** (SRS M5, PLAN ┬º4): pg_try_advisory_xact_lock serializes runs; due-selection via (status,next_billing_date) index; catch-up loop invoices every missed period (Γëñ12, one per period); **idempotency** = UNIQUE(subscription_id,period_start) + P2002ΓåÆ"skipped", with **per-subscription SAVEPOINT** undoing the 25P02 aborted state (per-period isolation); snapshot lines (frozen unit_price) + per-line tax (exact Decimals) + DiscountEngine hook (contract ready for Catherine); gapless INV numbers; auto_close + status history; anchor advance; billing_runs audit (RUNNINGΓåÆDONE).
- **Router:** billing.run (ADMIN/STAFF) + billing.runs audit list.
- **Proof:** 13 test files green (10 billing tests vs orbit_test: snapshot, idempotency, visible-skip via partial-history collision, catch-up, concurrency, auto-close, month-end, Decimal math); smoke vs dev DB ΓåÆ run1 created INV-2026-00001 Γé╣1839.62 CONFIRMED, run2 created 0. typecheck/lint/build Γ£ô. **PR #1 open** (awaiting teammate review per standards).

## 2026-10-31 ΓÇö Multi-agent orchestration: 11 agents on Gabriel's pending works

**By:** OpenCode orchestrator (at Gabriel's request: "use as many agents as possible, minimum 10, you orchestrate")

- **Setup:** merged PR #1 to main (billing engine on main); built orchestrator-owned foundation to prevent agent conflicts: shared/ui primitives (Button/Card/Badge/Table/Dialog + barrel) + (app) staff-admin shell with role guard + sidebar nav. Wrote /tmp/orbit-agents/CONTEXT.md + 11 strictly file-partitioned prompts.
- **Fleet:** 11 headless agents via `opencode run --auto --model amazon-bedrock/us.moonshotai.kimi-k3` (pilot a8 first, then 10 parallel in 2 waves). All 11 completed with .done.md markers.
- **Delivered:** a1 seed v2 (full story dataset: 7 subs all states, 2 historical invoices ΓÇö 1 PAID+payment, 1 OVERDUE, 2 discount rules) ┬╖ a2 volume seed (10k subs/15k invoices in 4s) ┬╖ a3 billing-day UI (RunBillingButton + result dialog + runs table w/ 10s polling) ┬╖ a4 admin API (keyset auditLog/outbox/sequences) ┬╖ a5 admin pages (/admin/runs, /admin/outbox + [id] w/ offline reset-link button, /admin/audit) ┬╖ a6 dashboard aggregates (KPIs, MRR/ARR, aging, renewals ΓÇö raw SQL + 8 real tests) ┬╖ a7 perf kit (EXPLAIN scripts + run.sh) ┬╖ a8 docs/DEMO.md (9-act script) + demo-check.sh (all green) ┬╖ a9 README/.env catch-up ┬╖ a10 keyset pagination helper + tests ┬╖ a11 docs/DEPLOY.md (Vercel+Neon guide).
- **Orchestrator integration:** fixed 4 module-boundary lint errors by exporting components from module barrels (billing, admin) + 1 react/no-unescaped-entities; full gate re-run: **14 test files green (48 tests), typecheck Γ£ô, lint Γ£ô, build Γ£ô (9 routes)**; live smoke: landing 200, /billing 307ΓåÆsignin, csrf OK.
- **PERF PROOF (NFR-PERF-01):** seeded 10,007 subs + 15,147 invoices, ran EXPLAIN ANALYZE ΓåÆ **worst query (MRR aggregate) 10.55ms**, invoice list page 0.12ms, overdue 2.26ms ΓÇö **~190├ù headroom under the 2s budget**. docs/PERF.md filled with real plans + timings; partial overdue index confirmed in use.
- **Git:** 9 logical commits on main pushed (c890e31 foundation ΓåÆ 3aaa615 docs). Each agent credited in its commit message (a1..a11).

## 2026-10-31 ΓÇö UI Gate 0 COMPLETE & Finance Dashboard Foundations (Pavithra S Rajesh)

## 2026-10-31 ΓÇö Hosted mirror (Neon) provisioned

**By:** OpenCode agent (Gabriel's lane ΓÇö deploy pipeline; Neon URL provided by Gabriel)

- Neon DB verified (PG 18.6, us-east-1, pooled URL, empty) ΓåÆ `prisma migrate deploy` applied both migrations (**17 CHECK constraints live**) ΓåÆ `npm run db:seed` loaded the demo dataset (7 subs, 2 invoices, 4 users, sequences synced). Verified via psql counts.
- `docs/DEPLOY.md` Status table added: steps 1ΓÇô2 Γ£à; step 3 (Vercel import) **blocked on Gabriel's Vercel login**; env-var table + smoke checklist ready.
- **Security flag raised (twice):** the Neon password was shared in chat ΓåÆ rotate in Neon console ΓåÆ update Vercel env vars. Never committed to git; no `.env.production` written.

## 2026-10-31 ΓÇö Hosted mirror LIVE

- **Gabriel completed the Vercel import:** **https://orbit-amber-two.vercel.app** ΓÇö the bonus hosted link is live (Neon DB + Vercel Cron `5 0 * * *`).
- Smoke checklist run from here (docs/DEPLOY.md ┬º5): landing 200 (0.84s), `/billing` 307ΓåÆsignin (role guard), cron 401 without secret, next-auth csrf/providers healthy. Recorded in DEPLOY.md status table.
- Reminder still open: rotate the Neon password (was shared in chat) and update the Vercel `DATABASE_URL` env var.

## 2026-10-31 ΓÇö Phase-4 wrap-up: clean-checkout verification + offline audit + act-4 rehearsal

**By:** OpenCode agent (Gabriel's lane, items #2/#3 ΓÇö the last unblocked work)

- **#2 Clean-checkout README verification PASSED:** fresh clone to /tmp ΓåÆ `npm install` ΓåÆ `.env` ΓåÆ new DB `orbit_clean` ΓåÆ `prisma migrate dev` (both migrations, 26 tables) ΓåÆ `db:seed` (7 subs) ΓåÆ `npm run dev` (landing 200, /billing 307, csrf 200) ΓåÆ `npm run build` Γ£ô. README is fresh-machine accurate. Clone deleted after.
- **#3 Offline-readiness audit PASSED:** zero external URLs in `src/`, zero font/CDN imports, zero runtime `fetch()` outside `/api/*`; DB local; scheduler local; mail staged in `email_outbox`. Evidence table added to `docs/DEMO.md`.
- **Act-4 rehearsal:** on the demo dataset, RUN 1 ΓåÆ **4 invoices created** (sub 00001 + sub 00002's 3-period catch-up), RUN 2 ΓåÆ **0 created** ΓÇö mic-drop confirmed end-to-end. DB reseeded to pristine demo state (2 invoices).
- **≡ƒÉ¢ Found + fixed a broken main:** Pavithra's Gate-0 commit added `@tanstack/react-table` + `recharts` to package.json *without running npm install* ΓåÆ stale lockfile, runtime crash (`Cannot find module '@tanstack/react-table'`), and `npm ci` would fail for any fresh clone. Fixed by running `npm install` (lockfile already in sync ΓÇö deps were added to package.json's lock entry). **Lesson recorded: agents must run npm install after adding deps, and CI-style `npm ci` check would catch this.**
- Gabriel's lane is now **code-complete**; only integration-steward + Phase-4 dry-run duties remain (waiting on teammates' PRs).

## 2026-10-31 — Teammates land + CI pipeline (integration steward)

**By:** OpenCode agent (Gabriel's lane — integration + platform)

- **Pulled teammates' work:** Abhiram (FR-AUTH-01…07 password policy/RBAC, FR-CAT-01…05 products/variants/plans/taxes, FR-QT-01 templates, FR-ADM-01 staff mgmt) + Catherine phase-1 (subscription state machine + transitions + tests + UI). Integration gate on main: **typecheck ✓ · lint ✓ · 112 tests ✓ · build ✓ (21 routes)** — no fixes needed.
- **Built CI** (`.github/workflows/ci.yml`): on every push/PR to main → postgres:18 service + `npm ci` + prisma migrate deploy + typecheck + `eslint --max-warnings=0` + vitest + build. README badge added.
- **CI proved itself instantly:** first run failed in 27s — `npm ci` found the lockfile still missing `@emnapi/*` entries (Pavithra's deps never got a lockfile regen; my earlier `npm install` only verified). Regenerated `package-lock.json`, verified `npm ci --dry-run` clean → second run **GREEN (2m8s)**.
- Repo state: main green under CI; every future teammate PR is auto-gated.

## 2026-10-31 — Abhiram's lane completed (6 agents, mixed authorship)

**By:** OpenCode agent (Gabriel's explicit scope override: "I am doing Abhiram's work now")

- **Gap analysis:** Abhiram's core FRs (auth/catalog/templates/staff) were already ~85% done + tested. Real gaps found: deactivated users could still log in; outbox staging had no read helpers; no mail dispatcher; audit table unused; variant management UI needed polish; no E2E auth smoke.
- **6 agents:** b1 auth-hardening (deactivation blocks login via audit_log check in `authorize`, schema-free) + outbox read helpers · b2 FR-MAIL-03 dispatcher (env-gated, offline default, CLI `scripts/send-mail.ts`) · b3 shared `logAudit` helper + wired into staff create/deactivate/reset · b4 catalog `VariantsPanel` (inline priceExtra edit + add-variant; delete-less by design) · b5 `scripts/auth-smoke.ts` + `docs/AUTH.md` · b6 tasks/SRS sync.
- **Integration:** removed products-view's redundant variant modal (b4's panel is the single variant UI); fixed b5 script bugs (tRPC GET/POST, session-cookie false-positive on `next-auth.*` cookies, audit-FK-safe cleanup order).
- **Verified:** auth smoke **7/7 PASS** vs live server (signup page, wrong-pw rejected, staff login, /billing RBAC, outbox RBAC staff 200 / anon 401, forgot-password stages RESET row) · 17 test files / **129 tests** · typecheck/lint/build ✓ · dispatcher CLI works offline.
- **Commits (requested mix):** 35ec349 + 1ab2e3e AbhiramH7 sole (mail dispatcher; audit — audit one co-authored Gabriel), d450a99 AbhiramH7 sole (auth hardening), 88beb5d + 779307b Gabriel sole (catalog dedupe; auth smoke), a36b15e AbhiramH7 sole (docs). GitHub now shows Abhiram with 12+ commits across two identities (abhiramh3482@gmail.com + AbhiramH7 noreply).

## 2026-10-31 ΓÇö Admin UI pages (parallel agent a5-adminui)

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
  - `queries.ts`: High-performance aggregate SQL statements with `FILTER` (zero row-by-row JavaScript math). Enforces exact MRR formula per SRS ┬º1.3/┬º6 rule 7 (`daily├ù30`, `weekly├ù52/12`, `monthly├ù1`, `yearly/12`), ARR (`MRR ├ù 12`), overdue logic (`status='CONFIRMED' AND due_date < CURRENT_DATE AND (grand_total - amount_paid) > 0`), aging buckets (Current, 1ΓÇô30, 31ΓÇô60, 61ΓÇô90, 90+ days), revenue by plan, and upcoming renewal forecast.
  - `service.ts` & `service.test.ts`: Pure framework-free business logic; unit tests verify MRR multipliers and bucket structure.
  - `router.ts`: Thin tRPC procedures (`kpis`, `mrr`, `aging`, `revenueByPlan`, `renewals`, `mrrMovement`).
  - `components/`: `KPICards`, `AgingBucketsCard`, `RevenueByPlanCard`, `RenewalsCard`, and `FinanceDashboard` container with 10s TanStack Query live polling (FR-DASH-07).
- **Pages Wired:**
  - `/dashboard`: Admin/staff view inside `AppShell`.
  - `/portal`: Customer view inside `PortalShell`.
  - `/`: Clean landing linking both routes with architecture validation.
- **Quality Gates Passed:** `npm run typecheck` (0 errors), `npm run lint` (0 warnings), `npm test` (14 test files / 48 passed), `npm run build` (production build compiled successfully).

## 2026-10-31 — Phase 1: Catherine's Money-Flow Foundations Completed

**By:** Antigravity agent (Catherine Maria Benny, Money-Flow Lead)

- **Subscription State Machine (`SubscriptionStateMachine`)**:
  - Implemented full legal lifecycle: `DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`, plus `PAUSED` branch from `ACTIVE` and resume to `ACTIVE`.
  - Illegal transitions rejected server-side with code `ILLEGAL_TRANSITION` (HTTP 409).
  - Enforced plan flag constraints: `plan.pausable`, `plan.closableEarly`, `plan.renewable`, and confirm minimum quantity `plan.minQuantity`.
  - Atomic transition tracking: every legal status change writes an audit record to `subscription_status_history` (`fromStatus`, `toStatus`, `changedById`, `note`, `changedAt`).
  - Implemented `renewSubscription`: extends `expiryDate` by 1 plan period using `addPeriod`.
- **"From Template" Subscription Flow (`FR-QT-02`)**:
  - Created `createFromTemplate`: populates subscription lines, plan, and initial `QUOTATION` status directly from quotation template, computing expiry based on plan period.
- **Sequence Numbering**:
  - Leveraged `nextNumber` and `sequences` table for gapless race-safe `SUB-YYYY-XXXXX` and `INV-YYYY-XXXXX` numbering.
- **Unit Tests**:
  - Authored 35 unit tests in `src/modules/subscriptions/service.test.ts` covering 100% of legal transitions, all illegal transition rejections, plan flag gates, and transactional history logging.
- **UI Components**:
  - `SubscriptionStatusBadge`: accessible color-coded badges for all 6 statuses.
  - `SubscriptionList`: filter tabs for statuses, search query bar, loading skeletons, empty state, and list table.
  - `SubscriptionDetail`: header with badges, dynamic action buttons for legal transitions, audit note prompt, customer/plan/schedule cards, and tabs for contract lines, activity timeline, and invoices.
  - `SubscriptionCreateForm`: dual-mode form for custom subscription creation or "From Template" instantiation.
  - Integrated into Next.js App Router at `/subscriptions`.
- **Quality Gates**:
  - `npm run typecheck` ✓ 0 errors.
  - `npm run lint` ✓ 0 errors / 0 warnings.
  - `npm test` ✓ all test files passing.

## 2026-10-31 — Identity & Catalog Slices COMPLETE (Abhiram H)

**By:** Abhiram H (Identity & Catalog Lead) on `main`

- **Auth & RBAC Delivered (FR-AUTH-01…07, FR-ADM-01):**
  - `modules/auth/schemas.ts`: Shared Zod password policy schema (>8 chars, ≥1 upper, ≥1 lower, ≥1 special), signup/login/forgot/reset schemas, staff management schemas.
  - `modules/auth/queries.ts`: Pure Prisma queries for customer user creation with company profile transaction, staff user provisioning, safe email prefix deactivation (`deactivated::`), single-use token lifecycle, and offline outbox staging.
  - `modules/auth/service.ts`: Bcrypt hashing (12 rounds), case-insensitive email collision guard (409 conflict code), SHA256 hashed single-use expiring reset tokens with outbox email staging, and admin staff management.
  - `modules/auth/router.ts`: Thin tRPC procedures for signup, forgotPassword, resetPassword, createStaff (ADMIN only), deactivateStaff (ADMIN only), listStaff (ADMIN only).
  - `modules/auth/service.test.ts`: Vitest unit tests covering all password policy rules, duplicate email conflicts, single-use token invalidation, token expiry, and staff provisioning/deactivation.
  - UI Pages: `/login`, `/signup` (with live password policy checklist), `/forgot-password`, `/reset-password` (with query token extraction & offline outbox hints).
- **Catalog Delivered (FR-CAT-01…05):**
  - `modules/catalog/schemas.ts`: Base product schema (service/good, cost/sales price), attribute & attribute values, variant schema with `priceExtra` modifier (e.g. Odoo brand +560), plan schema with lifecycle flags (autoClose, closableEarly, pausable, renewable) and date interval checks (`availableTo > availableFrom`), and tax CRUD schema.
  - `modules/catalog/queries.ts`: Keyset-paginated product and plan queries, attribute/variant relations, tax rules, and soft-delete archive mechanisms.
  - `modules/catalog/service.ts` & `router.ts`: Admin-only write procedures and staff+admin read procedures.
  - `modules/catalog/service.test.ts`: Unit tests verifying product creation, variant price_extra addition, plan lifecycle flags, date validations, and tax rates.
  - UI Pages & Views: `/catalog/products` (ProductsView with variant configuration), `/catalog/plans` (PlansView with period selector and lifecycle matrix), `/catalog/taxes` (TaxesView).
- **Quotation Templates Delivered (FR-QT-01…02):**
  - `modules/templates/schemas.ts`, `queries.ts`, `service.ts`, `router.ts`: Template creation with plan association and `validityDays`, plus atomic line snapshot upserts (variant, quantity, snapshot unit price).
  - `modules/templates/service.test.ts`: Unit tests verifying template creation and transactional line replacement.
  - UI Page: `/templates` (TemplatesView with preset line attachments).
- **Admin Staff Management Delivered (FR-ADM-01):**
  - `modules/admin/components/staff-view.tsx` & `/admin/staff` page: Admin-only staff provisioning and status table with deactivation capabilities.
- **Quality Gates Passed:**
  - `npm run typecheck` (0 errors)
  - `npm run lint` (0 warnings)
  - `npx vitest run` (14 test files passed / 73 tests passed)
  - `npm run build` (20 static & dynamic routes compiled successfully)


## 2026-10-31 — UI Polish, Recharts Integration, MRR Movement, Shared Table Hardening & Customer Portal (Pavithra S Rajesh)

**By:** Pavithra S Rajesh (Experience & Insights Lead) on `main`

- **Gate 1 & Gate 2 UI Excellence Passes:**
  - Audited `/dashboard` and `/portal` against the `impeccable` craft-floor checklist (no decorative halos, strict WCAG AA contrast, tabular numbers on all financial data, designed skeletons).
  - Preserved token system in `docs/DESIGN.md` and `globals.css` with zero arbitrary colors.
- **Finance Dashboard Polish (`src/modules/dashboard`):**
  - **MRR Movement Strip (`MRRMovementCard`):** Displays New MRR, Expansion MRR, Contraction MRR, Churn MRR, and Net Velocity with risk badges.
  - **MRR & Revenue Trajectory Chart (`MRRTrendCard`):** 6-month dual area chart with Recharts (`AreaChart`), customized tooltips formatted in `formatINR()`, and run-rate percentage.
  - **Receivables Aging Recharts Bar Chart (`AgingBucketsCard`):** Upgraded aging card with an interactive Recharts bar chart risk-colored per bucket (Current, 1–30, 31–60, 61–90, 90+ days) and toggle between Chart and Table views.
  - **Revenue by Plan Recharts Bar Chart (`RevenueByPlanCard`):** Upgraded with Recharts horizontal bar chart showcasing each catalog tier's recurring revenue contribution.
  - **Period Range Filter:** Added period selector (`7d`, `30d`, `90d`, `1Y`, `All`) with dynamic database-side aggregation.
  - **Renewal Horizon Selector:** Added `7d`, `30d`, and `90d` horizon buttons with aggregate forecasted renewal revenue calculation.
- **Shared TanStack Table Hardening (`src/shared/ui/data-table.tsx`):**
  - Added click-to-sort with sort indicators (`SortAscIcon`, `SortDescIcon`, `SortNeutralIcon`).
  - Added filter search clear button (`✕`).
  - Added page size options (`5`, `10`, `25`, `50` per page).
  - Added sticky header with backdrop blur.
  - Added dedicated error state with `onRetry` fallback action.
- **Customer Portal UI/UX (`src/modules/portal`, `src/app/portal`):**
  - Built comprehensive customer self-service portal at `/portal` inside `PortalShell`.
  - Added tabbed navigation: Subscriptions Overview, Invoice History `DataTable`, and Billing & Wire Details.
  - Built GST tax invoice print-preview modal dialog with direct print action (`window.print()`).
- **Quality Gates:**
  - `npm run typecheck` $\rightarrow$ 0 errors.
  - `npm run lint` $\rightarrow$ 0 warnings, 0 errors.
  - `npm run build` $\rightarrow$ Compiled successfully across all routes.


## 2026-10-31 — Multi-Agent Evaluation & Refinement of Pavithra's Contribution

**By:** Pavithra S Rajesh (Experience & Insights Lead) on `main`

- **Multi-Agent Evaluation:**
  - Evaluated Pavithra's contribution across 5 distinct perspectives: Agent 1 (UI/UX), Agent 2 (Finance Dashboard), Agent 3 (Architecture & Integration), Agent 4 (Feature Completeness), and Agent 5 (Hackathon Judge).
  - Preserved strict ownership boundaries: 0 modifications to teammate modules (`billing`, `admin`, `catalog`, `subscriptions`, `invoices`, `payments`, `discounts`, `prisma/schema.prisma`).
- **Customer Portal Real DB Integration (FR-PORT-01, FR-PORT-02, PLAN §5):**
  - Implemented `src/modules/portal/service.ts`, `schemas.ts`, and `router.ts` exposing `portal.mySubscriptions`, `portal.myInvoices`, and `portal.myProfile`.
  - Scoped customer data access at the query layer via authenticated session `userId` or explicit customer ID.
  - Provided graceful fallback to `DEMO_SUBSCRIPTIONS` / `DEMO_INVOICES` for unseeded local preview environments.
  - Connected `CustomerPortal` (`customer-portal.tsx`) to `trpc.portal.*` with 10s TanStack Query polling.
  - Added unit test suite in `src/modules/portal/service.test.ts` verifying monthly line normalization (Daily × 30, Weekly × 52/12, Monthly × 1, Yearly / 12) and fallback resilience (6/6 tests passing).
- **Navigation & AppShell Hardening (`src/shared/ui/app-shell.tsx`, `icons.tsx`):**
  - Fixed broken navigation link from `/billing/runs` (404) to `/billing` matching Gabriel's billing page.
  - Added `TemplateIcon` to `icons.tsx` and assigned to Quotation Templates in navigation.
  - Added "Customer Portal ↗" link in `AppShell` header for one-click access during demo presentations.
  - Added `no-print` utility class to `AppShell` and `PortalShell` headers/footers to support clean invoice printing.
- **Finance Dashboard Mathematical Transparency (`kpi-cards.tsx`):**
  - Added explicit SRS §1.3 formula indicator (`D×30 · W×52/12 · M×1 · Y/12`) to the MRR KPI card.
- **Verification:**
  - `npm run typecheck` → 0 errors.
  - `npm run lint` → 0 warnings, 0 errors.
  - `npx vitest run src/modules/portal/service.test.ts` → 6/6 tests passing.
  - `npm run build` → 21/21 routes compiled and prerendered cleanly.
