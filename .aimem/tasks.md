# Tasks

_Legend: ☐ todo · ☐↑ high priority · ✅ done (YYYY-MM-DD)_

## ✅ Done
- ✅ (2026-10-31) `.gitignore` created.
- ✅ (2026-10-31) `AGENTS.md` + `CLAUDE.md` ruleset created.
- ✅ (2026-10-31) `.aimem/` shared memory initialized.
- ✅ (2026-10-31) Planning phase complete: SRS.md, ER.md, PLAN.md, stack locked.
- ✅ (2026-10-31) UI Gate 0 (Pavithra): `design-taste-frontend` art direction → `docs/DESIGN.md` committed + tokens into `src/app/globals.css` + `AppShell` (internal staff/admin) + `PortalShell` (external customer) + core primitives in `src/shared/ui/`.
- ✅ (2026-10-31) Shared TanStack Table pattern (Pavithra): `src/shared/ui/data-table.tsx` with sticky headers, toolbar search, keyset pagination footer, and totals.
- ✅ (2026-10-31) Dashboard Foundations (Pavithra): `modules/dashboard` schemas, aggregate SQL queries with FILTER, MRR formula per SRS §6 rule 7, service + vitest tests, router, and UI components with 10s TanStack Query live polling.

## ☐ Tasks Left

### Phase 0 — Setup & Schema ✅ (2026-10-31, except noted)
- ✅ Scaffold repo (Next.js+TS+tRPC+Prisma+Tailwind+eslint module boundaries), `.env.example`, README quick-start (Gabriel).
- ✅ Schema v1: `prisma/schema.prisma` (18 tables per ER) + `init` migration + `business_checks` (17 CHECKs + partial index) (Gabriel).
- ✅ Local PostgreSQL: `orbit` DB + `orbit_app` user (CREATEDB dev-only, documented); demo seed (3 users, catalog, ACTIVE sub due today) (Gabriel).
- ✅ Module skeleton ×11 + contracts (DiscountEngine, BillingService) + shared kernel (trpc/requireRole, prisma, auth config) + worker/cron stubs.
- ✅ First commits + remote github.com/gabsgj/Orbit (private); all 4 contributors visible on GitHub.
- ✅ **UI Gate 0** (Pavithra, `design-taste-frontend`): art direction → `docs/DESIGN.md` + tokens into globals.css + AppShell/PortalShell.
- ☐ Vercel hello-deploy (needs Gabriel's Vercel login; bonus mirror only).

### Phase 1 — Foundations (per PLAN §2/§3)
- ✅ Gabriel lane: test DB (orbit_test) + BillingService skeleton→FULL engine + NumberingService + tests (PR #1).
- ☐ Abhiram: auth hardening + RBAC + staff mgmt → catalog CRUD (brief: docs/team/abhiram.md).
- ☐ Catherine: subscription state machine + UI shell (brief: docs/team/catherine.md).
- ✅ Pavithra: UI Gate 0 → docs/DESIGN.md + design system + table pattern + dashboard wireframe (brief: docs/team/pavithra.md).
- ☐ Auth+RBAC (FR-AUTH-01…07) · staff mgmt (FR-ADM-01) — Abhiram.
- ☐ Catalog: products/variants/plans/taxes (FR-CAT-01…05) — Abhiram.
- ☐ Subscription state machine + UI (FR-SUB-01…08) — Catherine.
- ☐ Quotation templates (FR-QT-01…02) — Abhiram → Catherine integration.
- ✅ Design system + TanStack table pattern + dashboard wireframe — Pavithra.
- ☐ **UI Gate 1** (every screen owner): per-screen `design-taste-frontend` pass + checklist (hierarchy, empty/loading/error skeletons, AA contrast, keyboard nav, responsive, no dead buttons) — part of Definition of Done, PLAN §11.

### Phase 2 — Money core
- ✅ Gabriel: billing engine + button + cron + runs page (FR-BILL-01…08) — engine (PR #1) + UI (a3) DONE.
- ✅ Admin backend+pages: audit log, mail outbox, sequences (FR-ADM-02/03, FR-MAIL-02) — a4/a5 DONE.
- ✅ Dashboard aggregates backend (KPIs, MRR/ARR, aging, renewals) — a6 DONE.
- ✅ Dashboard UI + charts + aging buckets + renewals forecast (FR-DASH-01…05, FR-PAY-05) — Pavithra DONE.
- ✅ Mail outbox + admin viewer (FR-MAIL-01…02) — a5 DONE (offline reset-link button works).
- ☐ Invoices (FR-INV-01…05) + payments (FR-PAY-01…04) — Catherine.
- ☐ DiscountEngine (FR-DISC-01…06) — Catherine (hook ready in billing; contract exported).
- ☐ **UI Gate 2** (Pavithra, end of Phase 2): mid-build `impeccable` review of core flows; findings → "UI polish" tasks fixed in Phase 3.

### Phase 3 — Differentiators & proof
- ✅ Volume seed (10,007 subs / 15,147 invoices) + `EXPLAIN ANALYZE` verification — **worst query 10.55ms, ~190× headroom**; docs/PERF.md filled (FR-ADM-04, NFR-PERF-01) — DONE (a2+a7).
- ☐ Invoice print stylesheet (FR-INV-02) — Catherine. Timeline UI (FR-SUB-08) — Catherine.
- ☐ Customer portal (FR-PORT-01…03) — Catherine backend + Pavithra UI.
- ✅ Polling live-ish dashboard (FR-DASH-07) — Pavithra.

### Phase 4 — Harden & rehearse (FEATURE FREEZE at start)
- ☐ Validation sweep (client+server, consistent error shape) — ALL.
- ☐ **UI Gate 3** (Pavithra + ALL, post-freeze): final `impeccable` audit of every screen + invoice print stylesheet + zero-tolerance list (no console errors, no FOUC, no lorem, consistent ₹/date formats, no broken routes) + demo-path pixel polish.
- ☐ README verified on a clean checkout; offline rehearsal (WiFi off) — Gabriel.
- ☐ Demo script (PLAN §7) rehearsed ×2 — ALL.

### Team / process
- ☐ All 4 members make at least one real commit (judges check git usage by everyone).
- ☐ Stretch (only after freeze, if stable): proration · CSV export · dunning reminders · dark mode.
