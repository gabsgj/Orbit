# Tasks

_Legend: ☐ todo · ☐↑ high priority · ✅ done (YYYY-MM-DD)_

## ✅ Done
- ✅ (2026-10-31) `.gitignore` created.
- ✅ (2026-10-31) `AGENTS.md` + `CLAUDE.md` ruleset created.
- ✅ (2026-10-31) `.aimem/` shared memory initialized.

## ☐ Tasks Left

### ✅ Planning phase complete (2026-10-31)
- ✅ Record problem statement verbatim in `context.md`.
- ✅ Stack LOCKED: Next.js 15 + tRPC + Prisma + PostgreSQL 18 (Option A). Recorded in `context.md`.
- ✅ Billing = BOTH: manual button + node-cron (local) + Vercel Cron (hosted), one shared BillingService.
- ✅ ER diagram: `docs/ER.md` (18 tables, constraint cheat-sheet).
- ✅ SRS: `docs/SRS.md` (12 modules, FR IDs, priorities P0/P1/P2, NFRs, state machines, business rules, traceability).
- ✅ Plan: `docs/PLAN.md` (architecture, 4-way task split, build order, timeline, risks, demo script).

### Phase 0 — Setup & Schema ✅ (2026-10-31, except noted)
- ✅ Scaffold repo (Next.js+TS+tRPC+Prisma+Tailwind+eslint module boundaries), `.env.example`, README quick-start (Gabriel).
- ✅ Schema v1: `prisma/schema.prisma` (18 tables per ER) + `init` migration + `business_checks` (17 CHECKs + partial index) (Gabriel).
- ✅ Local PostgreSQL: `orbit` DB + `orbit_app` user (CREATEDB dev-only, documented); demo seed (3 users, catalog, ACTIVE sub due today) (Gabriel).
- ✅ Module skeleton ×11 + contracts (DiscountEngine, BillingService) + shared kernel (trpc/requireRole, prisma, auth config) + worker/cron stubs.
- ✅ First commits + remote github.com/gabsgj/Orbit (private); all 4 contributors visible on GitHub.
- ☐ **UI Gate 0** (Pavithra, `design-taste-frontend`): art direction → `docs/DESIGN.md` + tokens into globals.css + AppShell/PortalShell.
- ☐ Vercel hello-deploy (needs Gabriel's Vercel login; bonus mirror only).

### Phase 1 — Foundations (per PLAN §2/§3: Gabriel=billing skeleton+seeds, Abhiram=auth+catalog, Catherine=subscriptions, Pavithra=design system+dashboard wire)
- ☐ Auth+RBAC (FR-AUTH-01…07) · staff mgmt (FR-ADM-01) — Abhiram.
- ☐ Catalog: products/variants/plans/taxes (FR-CAT-01…05) — Abhiram.
- ☐ Subscription state machine + UI (FR-SUB-01…08) — Catherine.
- ☐ Quotation templates (FR-QT-01…02) — Abhiram → Catherine integration.
- ☐ Design system + TanStack table pattern + dashboard wireframe — Pavithra.
- ☐ **UI Gate 1** (every screen owner): per-screen `design-taste-frontend` pass + checklist (hierarchy, empty/loading/error skeletons, AA contrast, keyboard nav, responsive, no dead buttons) — part of Definition of Done, PLAN §11.

### Phase 2 — Money core
- ☐ Billing engine complete + button + cron + runs page (FR-BILL-01…08) — Gabriel.
- ☐ Invoices (FR-INV-01…05) + payments (FR-PAY-01…04) — Catherine.
- ☐ DiscountEngine (FR-DISC-01…06) — Catherine (hook point with Gabriel's billing).
- ☐ Dashboard KPIs + MRR/ARR + charts + renewals + aging (FR-DASH-01…05, FR-PAY-05) — Pavithra.
- ☐ Mail outbox + admin viewer (FR-MAIL-01…02) — Abhiram.
- ☐ **UI Gate 2** (Pavithra, end of Phase 2): mid-build `impeccable` review of core flows; findings → "UI polish" tasks fixed in Phase 3.

### Phase 3 — Differentiators & proof
- ☐ Volume seed (≥10k subs/40k invoices) + `EXPLAIN ANALYZE` <2s verification (FR-ADM-04, NFR-PERF-01) — Gabriel.
- ☐ Invoice print stylesheet (FR-INV-02) — Catherine. Timeline UI (FR-SUB-08) — Catherine.
- ☐ Customer portal (FR-PORT-01…03) — Catherine backend + Pavithra UI.
- ☐ Polling live-ish dashboard (FR-DASH-07) — Pavithra.

### Phase 4 — Harden & rehearse (FEATURE FREEZE at start)
- ☐ Validation sweep (client+server, consistent error shape) — ALL.
- ☐ **UI Gate 3** (Pavithra + ALL, post-freeze): final `impeccable` audit of every screen + invoice print stylesheet + zero-tolerance list (no console errors, no FOUC, no lorem, consistent ₹/date formats, no broken routes) + demo-path pixel polish.
- ☐ README verified on a clean checkout; offline rehearsal (WiFi off) — Gabriel.
- ☐ Demo script (PLAN §7) rehearsed ×2 — ALL.

### Team / process
- ☐ All 4 members make at least one real commit (judges check git usage by everyone).
- ☐ First commit & remote setup — **only when Gabriel explicitly asks** (currently forbidden).
- ☐ Stretch (only after freeze, if stable): proration · CSV export · dunning reminders · dark mode.
