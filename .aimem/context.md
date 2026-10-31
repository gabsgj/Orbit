# Project Context

_Last updated: 2026-10-31_

## Event
- **Odoo × Make-a-Ton 9.0, Kochi Hackathon**

## Team
- Gabriel James
- Abhiram H
- Catherine Maria Benny
- Pavithra S Rajesh

## Product name — ✅ LOCKED (2026-10-31): **Orbit**
Tagline: *"Put your revenue in orbit."* Narrative: Brightloop Software (the fictional company in the statement) runs on **Orbit**. Candidates considered: Orbit, RevLoop, Cadence, Everloop, Flywheel. Package/folder name: `orbit`.

## Problem Statement — "Subscription Management System" (received 2026-10-31)

**Source:** `Subscription_Management_System.pdf` (4 pages). **Build one system to run plans, subscriptions and recurring billing in one place.**

Full-text record (verbatim, condensed only by whitespace):

> **1) The Challenge** — Build one unified software platform that runs the full life of a subscription business, from setting up products and plans to sending invoices, collecting payments and reporting revenue. The digital backbone of a company that earns its money every month, not just once. Read the scenes as things that actually happen in an ordinary billing month, and design the system that makes each of them easy.
>
> **2) Meet Brightloop Software** — Sells everything on subscription: business software billed monthly/yearly, add-ons customers switch on/off, a few products in different variants. Customers range from small shops (monthly) to large companies (yearly contracts). An admin sets up products, plans, taxes and discounts; a small internal team handles customers day to day; customers want to see and manage their own subscriptions without emailing anyone.
> *How things run today:* subscriptions in a spreadsheet · renewals remembered by whoever notices · invoices typed by hand every month · payments matched via bank statements · revenue reports built manually each quarter. → Renewals missed, invoices wrong, nobody knows actual recurring revenue.
>
> **3) A Month at Brightloop — the scenes:**
> 1. **Signup & roles** — Customer self-signup with email+password. Email unique per account. Password: >8 chars, uppercase, lowercase, special char. Forgot-password → reset link to registered email. Roles: **admin** (controls everything, only admin can add staff), **internal staff** (day-to-day, limited access), **customer** (portal: only own subscriptions and invoices).
> 2. **Products & plans** — Admin adds product: name, type, sales price, cost price, notes; **variants** (e.g. by brand — "Odoo" brand adds 560 to price). Plan: price, billing period (daily/weekly/monthly/yearly), minimum quantity, availability start/end dates. Per-plan behavior flags: auto-close when ended vs. closable-early / pausable / renewable.
> 3. **Quote → subscription** — Sales rep starts from a **quotation template** (pre-filled plan + product lines, validity in days). Subscription: own **number**, customer, plan, start date, expiry date, payment terms; **lines**: product, quantity, unit price, taxes, amount. Lifecycle: **Draft → Quotation → Confirmed → Active → Closed**, status visible to the whole team.
> 4. **Billing day** — Hundreds of subscriptions due at once → **bulk invoice generation** from subscriptions (customer details, product lines, taxes, totals pre-filled). Taxes auto-calculated from admin-set rules. Invoice actions: confirm, cancel, send, print. Invoice lifecycle: **Draft → Confirmed → Paid**. **Nothing billed twice or skipped.**
> 5. **Discounts** — Only admin creates discount rules: fixed amount OR percentage; min purchase or min quantity; start/end dates; usage limit (how many times usable). Scope: specific products OR whole subscriptions. Auto-applies to the **next invoice on its own**; stops when expired or exhausted.
> 6. **Payments** — Record each payment: method, amount, date, note, against the right invoice. Visibility: which invoices are paid vs outstanding → chase overdue before lost revenue.
> 7. **Finance reporting** — One place: active subscriptions count, revenue received, amount still owed, overdue invoices; filters + summary view. **Perf requirement: thousands of subscriptions, every page responds < 2 seconds.**

## Stack — ✅ LOCKED (2026-10-31, team decision)
- **Next.js 15 (App Router) + TypeScript** — one codebase, one language.
- **tRPC v11** — end-to-end typesafe API layer (the "backend API" requirement).
- **Prisma 6** — schema-as-code, migrations, seeds.
- **PostgreSQL 18 (local)** — judged demo runs fully offline; hosted mirror on Neon (bonus link only).
- **Tailwind CSS + shadcn/ui + TanStack Query/Table + Recharts** — UI system + dense data grids + finance charts.
- **next-auth (credentials) + bcryptjs** — auth + RBAC (admin/staff/customer).
- **Billing scheduler: BOTH** — manual "Run billing day" button (tRPC mutation) AND automatic scheduler (node-cron worker locally, Vercel Cron hosted) calling ONE shared `BillingService`; idempotent via `UNIQUE(subscription_id, period_start)` + `pg_advisory_xact_lock`.
- **Validation:** zod schemas shared client/server. **Tests:** vitest (service-level: billing, discounts, taxes, state machines). **Deploy:** Vercel + Neon (bonus); local-first is the judged path.
- **Sponsor note (kept for context):** Odoo = Python+PG+JS; we chose A for build speed + free one-platform hosting. We compensate with Odoo-style touches: sequence numbering (SUB-2026-00001), quotation templates, variant `price_extra`, modular folders.
- **Fixed decision (unchanged):** local **PostgreSQL**; all data through backend APIs; frontend never touches the DB.

## Judging Criteria (from organizers)

### Must have
- Real-time or dynamic data sources; avoid static JSON except for initial prototyping.
- Responsive and clean UI (consistent color scheme and layout).
- Robust user-input validation.
- Intuitive navigation with proper menu placement and spacing.
- Proper use of version control (Git) — one member managing the repo is not enough.

### Nice to have
- Ability to design backend APIs, model data, and set up a local database.
- Understand AI/code snippets thoroughly before using them; no blind copy-paste.
- Plan for offline or local solutions; don't rely entirely on internet connectivity or cloud tools.
- Use trendy technologies only if they add real value.

### Evaluation weights (per team brief)
Coding standards, logic, modularity, frontend design, scalability, security, usability, debugging skill — and **most importantly, database design**. Modular architecture, coding patterns, attention to detail.

## Key Decisions
- 2026-10-31 — Ruleset established (`AGENTS.md`, mirrored by `CLAUDE.md`). Problem statement pending.
- 2026-10-31 — `.aimem/` created as shared cross-agent memory; committed to git; no secrets.
- 2026-10-31 — Installed skills to use: `design-taste-frontend`, `impeccable`, `postgresql-optimization` (see `.agents/skills/`).
- 2026-10-31 — **Git cadence (binding, team agreement):** every member commits + pushes **at least every 30 minutes** of work on their own `feat/<module>-<name>` branch; never `main`. Recorded in `docs/team/README.md`; each member brief carries a standing authorization so their agent may commit/push when the member asks (satisfies `AGENTS.md` §6 explicit-ask rule).
- 2026-10-31 — **Team kickoff briefs:** `docs/team/{gabriel,abhiram,catherine,pavithra}.md` — paste-ready first-person kickoff prompts so each member starts their own AI agent with full shared context.
- 2026-10-31 — **Git authorization granted by Gabriel:** agent may commit (baseline + checkpoints). Agent may also commit/push **as** teammates `mariacatheriine`, `abhiramh7`, `PavithraSrajesh` — **only with Gabriel's explicit permission each time** (git `--author` / per-commit identity). Remote/push setup still requires explicit ask (no remote exists yet).

## Architecture — ✅ LOCKED (2026-10-31): HIGHLY MODULAR feature modules
- `src/modules/<domain>/` — 11 modules: auth, catalog, templates, subscriptions, billing, invoices, payments, discounts, dashboard, portal, admin.
- **Fixed module anatomy:** `index.ts` (barrel/public API) · `router.ts` (thin tRPC) · `service.ts` (pure, framework-free) · `schemas.ts` (zod, shared) · `queries.ts` (Prisma) · `components/` · `service.test.ts`.
- **Dependency contract:** barrel-only cross-module imports (eslint `no-restricted-imports` enforced); direction components→router→service→queries→prisma; contracts exported by provider module (e.g. `DiscountEngine.evaluate` from `modules/discounts`); `shared/` (trpc init, prisma client, lib, ui) never imports `modules/`; `app/` pages thin.
- **Deletable-module test** at every PR review: a module can be deleted with breakage only at explicit import sites.
