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
