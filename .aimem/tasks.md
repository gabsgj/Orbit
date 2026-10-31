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
- ✅ (2026-10-31) Subscription state machine + UI (FR-SUB-01…08) — Catherine.
- ✅ (2026-10-31) "From template" subscription flow (FR-QT-02) — Catherine.
- ✅ (2026-10-31) UI Gate 1 (Pavithra): screen-by-screen audit across `/dashboard` and `/portal`; ensured WCAG AA contrast, designed skeletons, keyboard accessibility, and responsive L-frame grid layouts.
- ✅ (2026-10-31) UI Gate 2 (Pavithra): `impeccable` craft-floor review; added MRR movement velocity strip (New, Expansion, Contraction, Churn, Net), 6-month Recharts MRR/Revenue trajectory chart, Recharts risk-coded aging bar chart with table toggle, Recharts horizontal plan revenue distribution, and period filtering (7d/30d/90d/1Y/all).
- ✅ (2026-10-31) Customer Portal UI/UX (Pavithra, FR-PORT-01…03): complete responsive customer portal at `/portal` inside `PortalShell` with subscription cards, invoice history `DataTable`, payment/wire instructions, GSTIN compliance card, and print-preview modal dialog.

## 🎨 UI Polish Log (Gate 2 Impeccable Review Findings & Resolutions)
- **Visual Hierarchy & Typography:** Refined financial metrics to use tabular numerals (`tabular-nums`), high contrast text (`hsl(var(--foreground))`), and removed decorative card halos/borders per anti-slop rules.
- **MRR Movement:** Added dedicated `MRRMovementCard` breaking down New MRR, Expansion MRR, Contraction MRR, Churn MRR, and Net Velocity.
- **Recharts Integration:**
  - `MRRTrendCard`: 6-month dual area chart with custom tooltips, gradients, and run-rate percentage.
  - `AgingBucketsCard`: Recharts bar chart with risk colors (active, warning, amber, rose, overdue) and chart/table view toggle.
  - `RevenueByPlanCard`: Recharts horizontal bar chart categorized by product tier and cadence.
- **Shared TanStack Table Hardening:**
  - Added clickable column sorting with sort indicators (asc/desc/neutral).
  - Added search clear button (`✕`) when filtered.
  - Added page size selector dropdown (5, 10, 25, 50 per page).
  - Added dedicated error state with `onRetry` action.
  - Made table header sticky with backdrop blur.
- **Customer Portal UI:**
  - Interactive tabs for Subscriptions, Invoices, and Billing profile.
  - Modal tax invoice view and print-ready document trigger (`window.print()`).

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
- ✅ Abhiram: auth hardening + RBAC + staff mgmt → catalog CRUD (brief: docs/team/abhiram.md).
- ✅ Catherine: subscription state machine + UI shell (brief: docs/team/catherine.md).
- ✅ Pavithra: UI Gate 0 → docs/DESIGN.md + design system + table pattern + dashboard wireframe (brief: docs/team/pavithra.md).
- ✅ (2026-10-31) Auth+RBAC (FR-AUTH-01…07) · staff mgmt (FR-ADM-01) — Abhiram.
- ✅ (2026-10-31) Catalog: products/variants/plans/taxes (FR-CAT-01…05) — Abhiram.
- ✅ (2026-10-31) Subscription state machine + UI (FR-SUB-01…08) — Catherine.
- ✅ (2026-10-31) Quotation templates (FR-QT-01…02) — Abhiram CRUD + Catherine "from template" flow.
- ✅ Design system + TanStack table pattern + dashboard wireframe — Pavithra.
- ✅ **UI Gate 1** (Pavithra owned screens): `/dashboard` and `/portal` reviewed and approved. Teammates' screens reviewed (`/catalog/*`, `/templates`, `/admin/staff`, `/subscriptions`).

### Phase 2 — Money core
- ✅ Gabriel: billing engine + button + cron + runs page (FR-BILL-01…08) — engine (PR #1) + UI (a3) DONE.
- ✅ Admin backend+pages: audit log, mail outbox, sequences (FR-ADM-02/03, FR-MAIL-02) — a4/a5 DONE.
- ✅ Dashboard aggregates backend (KPIs, MRR/ARR, aging, renewals) — a6 DONE.
- ✅ Dashboard UI + charts + aging buckets + renewals forecast (FR-DASH-01…05, FR-PAY-05) — Pavithra DONE.
- ✅ Mail outbox + admin viewer (FR-MAIL-01…02) — a5 DONE (offline reset-link button works).
- ✅ (2026-10-31) Mail dispatcher (FR-MAIL-03): env-gated SMTP dispatcher in `modules/auth/dispatcher.ts` — b2 DONE.
- ✅ (2026-10-31) Audit helper (FR-ADM-03 wiring): `shared/lib/audit.ts` with typed action constants — b3 DONE.
- ☐ Invoices (FR-INV-01…05) + payments (FR-PAY-01…04) — Catherine.
- ☐ DiscountEngine (FR-DISC-01…06) — Catherine (hook ready in billing; contract exported).
- ✅ **UI Gate 2** (Pavithra, end of Phase 2): mid-build `impeccable` review of core flows complete; findings resolved and logged.

### Phase 3 — Differentiators & proof
- ✅ Volume seed (10,007 subs / 15,147 invoices) + `EXPLAIN ANALYZE` verification — **worst query 10.55ms, ~190× headroom**; docs/PERF.md filled (FR-ADM-04, NFR-PERF-01) — DONE (a2+a7).
- ☐ Invoice print stylesheet (FR-INV-02) — Catherine. Timeline UI (FR-SUB-08) — Catherine.
- ✅ Customer portal (FR-PORT-01…03) — Pavithra UI + tRPC backend procedures (`portal.mySubscriptions`, `portal.myInvoices`, `portal.myProfile`) complete with live DB queries, 10s polling, fallback resilience, unit tests, and statement print preview dialog.
- ✅ Polling live-ish dashboard (FR-DASH-07) — Pavithra DONE (10s TanStack Query polling + refresh button + error banner).

### Phase 4 — Harden & rehearse (FEATURE FREEZE at start)
- ☐ Validation sweep (client+server, consistent error shape) — ALL.
- ☐ **UI Gate 3** (Pavithra + ALL, post-freeze): final `impeccable` audit of every screen + invoice print stylesheet + zero-tolerance list (no console errors, no FOUC, no lorem, consistent ₹/date formats, no broken routes) + demo-path pixel polish.
- ☐ README verified on a clean checkout; offline rehearsal (WiFi off) — Gabriel.
- ☐ Demo script (PLAN §7) rehearsed ×2 — ALL.

### Identity & Catalog hardening follow-up (Abhiram, 2026-10-31)
- ✅ Reset-token consumption is atomic: the transaction conditionally marks `used_at` only when unused and unexpired; concurrent-use regression test added.
- ✅ Staff deactivation refuses CUSTOMER and ADMIN targets; only STAFF accounts are eligible.
- ✅ Dashboard, portal, and the internal app shell now derive user identity/role from the authenticated server session; static demo identities removed.
- ✅ Taxes list now has status/search filters and keyset pagination; its create form reuses `createTaxSchema` client-side.
- ☐ **Gabriel coordination required:** create a reviewed migration making `users.email` `citext` with a unique constraint. Do not change `schema.prisma` directly.
- ✅ Added explicit expired-token and `requireRole` ADMIN/STAFF/CUSTOMER/anonymous regression coverage.
- ☐ Verify hardening against local PostgreSQL (`npm test`, typecheck, lint, build) after restoring dependencies; current audit environment has an incomplete `node_modules` install.

### Team / process
- ✅ All 4 members make at least one real commit (Pavithra commit pushed to `main`).
- ☐ Stretch (only after freeze, if stable): proration · CSV export · dunning reminders · dark mode.
