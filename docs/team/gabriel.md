# Member Brief — Gabriel James · Platform & Billing Lead

Paste the block below as your first message to your agent. Keep this file open as reference.

```text
I am Gabriel James, Platform & Billing Lead on Team Orbit (Odoo × Make-a-Ton 9.0, Kochi).
We are building Orbit, a subscription management system for the fictional company
Brightloop Software. Stack (locked): Next.js 15 + TypeScript + tRPC v11 + Prisma 6 +
PostgreSQL 18 (local, offline-first) + Tailwind/shadcn + next-auth + vitest.

Before writing ANY code, read these files in this order:
1. AGENTS.md (binding ruleset)
2. .aimem/context.md
3. docs/SRS.md
4. docs/ER.md (the data model — my main deliverable)
5. docs/PLAN.md (§2 my slice, §4 billing engine, §3 build order)

I OWN: repo scaffold, prisma/schema.prisma + migrations, seed tooling (demo + 10k volume
generator), BillingService (idempotent invoice generation, pg_advisory_xact_lock,
catch-up loop, sequences), BOTH billing triggers ("Run billing day" button + node-cron
worker locally + Vercel Cron hosted) calling one shared service, billing runs admin page,
indexes/perf (EXPLAIN ANALYZE <2s proof), deploy pipeline (Vercel + Neon mirror), README,
final integration.

My FRs: FR-BILL-01…08, FR-ADM-02, FR-ADM-04, NFR-PERF-01, NFR-OFFL-01.
Hook contract with Catherine (she builds DiscountEngine):
  DiscountEngine.evaluate(subscription, lines, asOf) → { discountLines, usages }
  I call it inside the per-subscription billing transaction (PLAN §4, step f).

RULES I follow (from AGENTS.md):
- HIGHLY MODULAR (PLAN §1 contract): my code lives in modules/billing + modules/admin
  with the fixed anatomy (index/router/service/schemas/queries/components/tests); other
  modules import ONLY my index.ts barrel; my services are pure (no next/trpc imports).
- Schema-first: no app code before schema v1 is frozen (Phase 0 huddle).
- No string-concatenated SQL — Prisma/parameterized only.
- vitest unit tests for BillingService: double-run idempotency, catch-up after 3 missed
  periods, concurrent-run lock, discount usage-limit race.
- I update .aimem/tasks.md and .aimem/progress.md in the same change as my work.

GIT (my standing authorization to you): work on branch feat/billing-gabriel (or
feat/scaffold-gabriel during Phase 0). I explicitly authorize you to `git commit` and
`git push` on MY branch whenever I ask — and I will ask at least every 30 minutes, per
team cadence. Small atomic commits, conventional messages. NEVER commit to main, never
force-push, never touch secrets. Ask me before anything outside my branch.

Phase 0 first: scaffold + hello-deploy, then schema v1 huddle support, migrations,
minimal seed. Confirm the app builds and `prisma migrate dev` + seed run clean before
feature work. Walk me through every non-obvious decision — I must be able to explain
every line to the judges.
```

## My task checklist (phased — details in `docs/PLAN.md` §3)

### Phase 0 — Setup & Schema (blocks everyone; move fast, communicate)
- [ ] Scaffold: Next.js 15 + TS + tRPC + Prisma + Tailwind + shadcn + next-auth + vitest, `.env.example`
- [ ] Hello-deploy to Vercel (bonus mirror; local remains primary)
- [ ] Schema v1 huddle (walk `docs/ER.md` with the team, freeze)
- [ ] Author `prisma/schema.prisma` (18 tables per ER) + first migration
- [ ] Local PostgreSQL: `orbit` DB + least-privilege user + minimal seed (admin, demo product/plan)
- [ ] Enums + constraints exactly per ER cheat-sheet (UNIQUE(subscription_id, period_start) etc.)

### Phase 1 — Foundations
- [ ] Seed v2 (multiple plans, templates, a few subscriptions due "now" for billing demos)
- [ ] BillingService skeleton: due-selection query + unit test harness
- [ ] Indexes per ER.md; verify query plans with EXPLAIN

### Phase 2 — Money core (my crown jewel)
- [ ] BillingService complete: idempotent insert (ON CONFLICT), advisory lock, catch-up loop (≤12), sequences numbering, next_billing_date advance, auto_close
- [ ] `billing.run` tRPC mutation + "Run billing day" button + result modal (created/skipped/errors)
- [ ] node-cron worker (`npm run worker`, env-configurable; rehearsal mode `*/2 * * * *`)
- [ ] Vercel Cron route `/api/cron/billing` with `CRON_SECRET`
- [ ] Billing runs admin page (FR-ADM-02)
- [ ] Unit tests: idempotency, catch-up, lock, usage-limit race (with Catherine)

### Phase 3 — Differentiators & proof
- [ ] Volume seed generator: ≥10k subscriptions, ≥40k invoices
- [ ] Perf gate: dashboard + invoices list <2s locally; capture EXPLAIN ANALYZE evidence
- [ ] Wire DiscountEngine hook (Catherine) into billing txn

### Phase 4 — Harden & rehearse
- [ ] README verified on a clean checkout by a teammate
- [ ] Offline rehearsal (WiFi OFF) — full demo path works
- [ ] Demo acts 4 (billing day mic-drop) + 9 (ER/constraints) rehearsed

## Coordination points
- **Everyone depends on my Phase 0** — schema freeze is the starting gun; keep it tight.
- **Catherine** — DiscountEngine hook (above); agree the TypeScript signature early, code against it in parallel.
- **Pavithra** — dashboard queries hit my indexes; review her aggregate SQL together in Phase 2.
- **Shared-file huddle rule** — I own `schema.prisma`; any teammate change = migration via me.
