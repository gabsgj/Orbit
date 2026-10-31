# Member Brief — Pavithra S Rajesh · Experience & Insights Lead

Paste the block below as your first message to your agent. Keep this file open as reference.

```text
I am Pavithra S Rajesh, Experience & Insights Lead on Team Orbit (Odoo × Make-a-Ton 9.0,
Kochi). We are building Orbit, a subscription management system for the fictional company
Brightloop Software. Stack (locked): Next.js 15 + TypeScript + tRPC v11 + Prisma 6 +
PostgreSQL 18 (local, offline-first) + Tailwind/shadcn + TanStack Query/Table + Recharts.

Before writing ANY code, read these files in this order:
1. AGENTS.md (binding ruleset — §5 UI/UX is my domain)
2. .aimem/context.md
3. docs/SRS.md (M9 dashboard + NFR-USE-01 are mine; skim all for screen inventory)
4. docs/ER.md (understand aggregates: MRR formula in SRS §1.3/§6, overdue rule)
5. docs/PLAN.md (§2 my slice, §3 build order, and especially §11 — I OWN the
   UI Excellence Program with its 4 gates)

I OWN the UI Excellence Program (PLAN §11):
- Gate 0 (Phase 0): run the design-taste-frontend skill → commit docs/DESIGN.md
  (color tokens HSL, type scale, spacing/radius scale, layout grid, component recipes,
  anti-slop "we will NOT do" list) → configure Tailwind theme + shadcn from tokens →
  build AppShell (staff/admin) + PortalShell (customer).
- Gate 1 (build): review every teammate's screen against the checklist (hierarchy,
  designed empty/loading/error states, WCAG AA contrast, keyboard nav, responsive,
  no dead buttons).
- Gate 2 (end Phase 2): run the impeccable skill over all core flows; log findings to
  .aimem/tasks.md "UI polish".
- Gate 3 (Phase 4, post-freeze): final impeccable audit of EVERY screen + invoice print
  stylesheet + zero-tolerance list + demo-path pixel polish.

I ALSO OWN (features):
- Finance dashboard (FR-DASH-01…07): KPI cards (active subs, revenue received, amount
  owed, overdue invoices) with filters + summary; MRR/ARR + MRR movement (new/expansion/
  contraction/churn); MRR trend + revenue-by-plan + aging charts (Recharts); renewal
  forecast (7/30 days); TanStack Query polling (10s) for live-ish updates.
- Shared TanStack Table pattern (sticky header, filter bar, keyset pagination footer
  with totals) — I build it once in Phase 1; everyone's lists copy it.
- Aging buckets view (current/1–30/31–60/61–90/90+) (FR-PAY-05, data query agreed
  with Catherine in Phase 2).
- Customer portal UI/UX (FR-PORT, backend scoping by Catherine).

KEY REQUIREMENTS (exact, testable):
- Every dashboard page <2s with 10k subscriptions (NFR-PERF-01): single aggregate SQL
  queries with FILTER, keyset pagination, NO row-by-row JS math — review heavy queries
  with Gabriel (he owns indexes).
- MRR = Σ over ACTIVE subscriptions of line value normalized monthly (daily×30,
  weekly×52/12, monthly×1, yearly/12) — per SRS §6 rule 7.
- All currency via one formatter: Intl.NumberFormat('en-IN', {currency:'INR'}) — same
  for dates. No one-off formats anywhere.
- Dashboard data comes ONLY from tRPC dashboard router (aggregates), never client-side
  table scans.

RULES I follow (from AGENTS.md):
- HIGHLY MODULAR (PLAN §1 contract): my feature code lives in modules/dashboard with the
  fixed anatomy (index/router/service/schemas/queries/components/tests); design system
  lives in shared/ui (AppShell, PortalShell, shadcn, TanStack table pattern) — shared/
  contains ZERO domain logic and never imports from modules/.
- I run the design-taste-frontend and impeccable skills MYSELF and coach teammates on
  Gate 1 — the skills are part of our toolchain, not decoration.
- Dashboard tRPC procedures stay thin; aggregate SQL lives in modules/dashboard/queries.ts
  (reviewed with Gabriel).
- I update .aimem/tasks.md and .aimem/progress.md in the same change as my work.

GIT (my standing authorization to you): work on branch feat/design-pavithra (or
feat/dashboard-pavithra per task). I explicitly authorize you to `git commit` and
`git push` on MY branch whenever I ask — and I will ask at least every 30 minutes, per
team cadence. Small atomic commits, conventional messages. NEVER commit to main, never
force-push, never touch secrets. Ask me before anything outside my branch.
Design tokens + AppShell are SHARED files: I announce changes in the group first.

Sequence: Phase 0 = Gate 0 (DESIGN.md + tokens + shells). Phase 1 = design system on
real pages + table pattern + dashboard wireframe. Phase 2 = dashboard KPIs + charts +
renewals + aging; Gate 2 at end. Phase 3 = polling + portal UX + fixes. Phase 4 = Gate 3.
Walk me through every non-obvious decision — I must be able to explain every line to
the judges.
```

## My task checklist (phased — details in `docs/PLAN.md` §3/§11)

### Phase 0 — Gate 0 (blocks everyone's UI)
- [ ] `design-taste-frontend` run → `docs/DESIGN.md` committed (tokens, scales, recipes, anti-slop list)
- [ ] Tailwind theme + shadcn configured from tokens
- [ ] AppShell (sidebar/nav per role) + PortalShell skeletons

### Phase 1 — Foundations
- [ ] Design system applied to first real pages (auth + one CRUD, as the reference implementation)
- [ ] Shared TanStack Table pattern + docs for teammates
- [ ] Dashboard wireframe with mock query shapes (agree with Gabriel)

### Phase 2 — Money core
- [ ] KPI cards + filters + summary view (real data)
- [ ] MRR/ARR + movement, MRR trend, revenue-by-plan, aging charts
- [ ] Renewal forecast (7/30d)
- [ ] **Gate 2**: `impeccable` review of all core flows → findings logged

### Phase 3 — Differentiators
- [ ] TanStack Query polling (10s) on dashboard
- [ ] Portal UI polish
- [ ] Fix Gate 2 findings (with owners)

### Phase 4 — Gate 3 (post-freeze)
- [ ] Final `impeccable` audit: every screen + print stylesheet + zero-tolerance list
- [ ] Demo acts 7 (dashboard wow) + 8 (portal) rehearsed

## Coordination points
- **Gabriel** — heavy aggregate SQL reviewed with him (he owns indexes); dashboard query shapes agreed in Phase 1.
- **Catherine** — aging-buckets data shape (Phase 2); portal UX over her scoped backend.
- **Abhiram** — auth/admin screens follow my tokens; Gate 1 reviews with him.
- **Everyone** — Gate 1 is part of Definition of Done; I unblock anyone running the skills. Token/AppShell changes announced in group first.
