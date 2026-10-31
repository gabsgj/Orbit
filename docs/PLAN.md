# Execution Plan — Orbit · Subscription Management System

> Companion to `docs/SRS.md` (requirements) and `docs/ER.md` (data model).
> This is the working plan: architecture, who builds what, when, how we de-risk, and how we demo.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js 15 (App Router) — single TypeScript codebase        │
│                                                             │
│  UI (React Server Components + shadcn/ui)                   │
│    └── tRPC client (TanStack Query)                         │
│  API layer: tRPC routers  ──► RBAC middleware ──► services  │
│    auth · catalog · templates · subscriptions · billing ·   │
│    invoices · payments · discounts · dashboard · admin      │
│  Services (pure business logic, unit-tested):               │
│    BillingService · DiscountEngine · TaxService ·           │
│    NumberingService · SubscriptionStateMachine · PaymentSvc │
│  Data access: Prisma 6  ──►  PostgreSQL 18 (local)          │
│                                                             │
│  Billing triggers (BOTH, one shared service):               │
│    • "Run billing day" button → tRPC mutation               │
│    • node-cron worker (local, offline)                      │
│    • Vercel Cron (hosted mirror only)                       │
└─────────────────────────────────────────────────────────────┘
```

**Folder structure — HIGHLY MODULAR, one folder per domain module** (per `AGENTS.md` §7):

```
orbit/
├── prisma/
│   ├── schema.prisma          # mirrors docs/ER.md exactly (owner: Gabriel)
│   ├── migrations/
│   └── seed/                  # demo seed + volume generator (10k subs)
├── docs/                      # SRS.md · PLAN.md · ER.md · DESIGN.md · team/
├── src/
│   ├── app/                   # Next.js routes ONLY — thin pages that compose modules
│   │   ├── (auth)/            # login · signup · forgot/reset-password
│   │   ├── (app)/             # staff+admin shell routes
│   │   ├── (portal)/portal/   # customer-only routes
│   │   └── api/               # trpc handler · cron/billing (Vercel Cron)
│   ├── modules/               # ★ THE PRODUCT LIVES HERE — one folder per domain module
│   │   ├── auth/              # every module has the SAME anatomy (below)
│   │   ├── catalog/           # products · attributes/variants · plans · taxes
│   │   ├── templates/         # quotation templates
│   │   ├── subscriptions/
│   │   ├── billing/           # BillingService · runs · scheduler triggers
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── discounts/         # DiscountEngine + rules
│   │   ├── dashboard/         # aggregates · reports
│   │   ├── portal/
│   │   └── admin/             # staff mgmt · outbox · audit · sequences
│   ├── shared/                # "shared kernel" — small, stable, ZERO domain logic
│   │   ├── trpc/              # init · requireRole middleware
│   │   ├── db/                # prisma client singleton
│   │   ├── lib/               # money.ts · dates.ts · result.ts · pagination.ts
│   │   └── ui/                # shadcn primitives · AppShell · PortalShell (Pavithra)
│   └── worker/                # local cron entry — imports modules/billing via its index only
├── .env.example
└── README.md                  # fresh-machine setup that actually works
```

### Module anatomy — every module has exactly this shape

```
modules/<name>/
├── index.ts          # PUBLIC API (barrel) — the ONLY file other modules may import
├── router.ts         # tRPC procedures — thin: parse → guard → call service → shape
├── service.ts        # pure business logic — NO framework imports (no next/trpc) → unit-testable
├── schemas.ts        # zod input schemas — shared by router AND client forms
├── queries.ts        # Prisma data access for this module only
├── components/       # React UI owned by this module
└── service.test.ts   # vitest — lives next to the logic it tests
```

### Dependency rules (the modularity contract — binding)

1. **Barrel-only imports.** Other modules may import ONLY from `modules/<name>/index.ts`
   (or the client-safe `modules/<name>/client.ts` — a sanctioned *second* barrel for
   browser-safe exports like zod schemas, which must never import server-only code such
   as `@trpc/server` or Prisma; it exists so pages don't drag the router into the client
   bundle). All other deep imports are forbidden — enforced by an eslint
   `no-restricted-imports` rule, not just convention.
2. **One direction:** components → router → service → queries → prisma. No sideways
   imports within a layer across modules except through the module's public `index.ts`.
3. **Contracts live with the provider.** Cross-module integration points are TypeScript
   types exported from the providing module's barrel — e.g. `DiscountEngine.evaluate`'s
   signature is exported by `modules/discounts`, consumed by `modules/billing`. Two people,
   two modules, one contract — parallel work without conflicts.
4. **`shared/` never imports from `modules/`** (no upward dependencies).
5. **`app/` pages stay thin** — they wire modules to routes; no business logic in pages.
6. **The modularity test:** any module can be deleted and the build breaks ONLY at its
   explicit import sites — never mysteriously. If a change ripples beyond one module,
   the boundary is wrong; fix the boundary, not the symptom.

**Patterns (consistent everywhere):**
- UI never contains business logic — form → module router → module service → module queries.
- One zod schema per input in the module's `schemas.ts`, used by router AND client form (`zodResolver`).
- Error shape: `{ code, message, field? }` — tRPC errors mapped consistently.
- Money: Prisma `Decimal`; format only at the edge (`Intl.NumberFormat('en-IN', {currency:'INR'})`).
- Every list page: filters + keyset pagination + empty/loading/error states.

---

## 2. Team task division (4 people, vertical slices)

Each person owns their slice **end-to-end** (zod schema → service → router → UI → tests).
This minimizes merge conflicts and guarantees **every member has real, attributable commits**
(judges check this). Shared files (`schema.prisma`, root layout, design tokens) are changed
only after a 2-minute huddle in the group chat.

### Gabriel — *Platform & Billing Lead* (DB crown jewels)
| Work | FRs |
|---|---|
| Repo scaffold, env setup, Prisma schema authoring (team-reviewed), migrations | all M12 |
| **BillingService**: due-selection, idempotent generation, advisory lock, catch-up loop, sequences | FR-BILL-01…08 |
| Scheduler **both ways**: node-cron worker + Vercel Cron + shared trigger auth | FR-BILL-02 |
| "Run billing day" button + live result modal + billing runs admin page | FR-BILL-02/06 |
| Seeds: demo dataset **and** 10k-subscription volume generator; `EXPLAIN ANALYZE` perf proof | FR-ADM-04, NFR-PERF-01 |
| Indexes, constraints, DB-level correctness (the `ER.md` cheat-sheet) | ER §constraints |
| Deploy pipeline: Vercel + Neon mirror (bonus link), `DATABASE_URL` env split | NFR-OFFL-01 |
| README, final integration, demo dry-run lead | — |

### Abhiram — *Identity & Catalog Lead*
| Work | FRs |
|---|---|
| Auth: signup/login/logout, password policy, next-auth config | FR-AUTH-01…03 |
| Forgot/reset flow with hashed single-use tokens + outbox staging | FR-AUTH-04 |
| RBAC: `requireRole` middleware, route guards, nav filtering | FR-AUTH-05…07 |
| Staff management (admin-only create/deactivate) | FR-ADM-01 |
| Products + attributes/variants (`price_extra`) CRUD UI | FR-CAT-01…02 |
| Plans CRUD (periods, min qty, availability, lifecycle flags) | FR-CAT-03…04 |
| Taxes CRUD | FR-CAT-05 |
| Quotation templates CRUD + validity | FR-QT-01 |
| Admin mail outbox viewer page | FR-MAIL-02 |

### Catherine — *Money-Flow Lead* (subscriptions → invoices → payments → discounts)
| Work | FRs |
|---|---|
| Subscription state machine service + transitions + history timeline | FR-SUB-01…08 |
| Subscription create/edit UI incl. "from template" flow | FR-QT-02 |
| Invoice model UI: list/detail, confirm/cancel/send/print, print stylesheet | FR-INV-01…05 |
| PaymentService: record, overpayment guard, txn `amount_paid`, auto-PAID | FR-PAY-01…03 |
| Paid/outstanding/overdue views | FR-PAY-04 |
| **DiscountEngine**: eligibility window, precedence, usage-limit ledger, auto-apply in billing | FR-DISC-01…06 |
| Customer portal backend (scoping) + pause/resume/renew requests | FR-PORT-01…03 |
| Unit tests: state machine, discount engine, payment settlement | NFR-REL-01 |

### Pavithra — *Experience & Insights Lead* (design + dashboard + polish)
| Work | FRs |
|---|---|
| **UI Excellence Program owner (§11)**: art direction, design tokens, layout shell, nav — runs `design-taste-frontend`; mid-build + final `impeccable` passes | NFR-USE-01 |
| Finance dashboard: KPI cards, filters, summary view | FR-DASH-01…02 |
| MRR/ARR + movement, MRR trend, revenue-by-plan, aging charts (Recharts) | FR-DASH-03…04 |
| Renewal forecast (7/30 days) | FR-DASH-05 |
| Aging buckets view | FR-PAY-05 |
| Customer portal UI/UX | FR-PORT |
| TanStack Table patterns (pagination/sort/filter) adopted by everyone's lists | FR-INV-05 etc. |
| Query polling for live-ish dashboards | FR-DASH-07 |
| `impeccable` review pass pre-demo; empty/loading/error states sweep | NFR-USE-01 |

**Load-balancing rule:** if someone finishes early, pull from the P1 list in this order:
mail outbox viewer polish → CSV export → reminder dunning → dark mode.

---

## 3. Build order (dependency graph)

```
PHASE 0 (everyone, same room)          ── must finish before any feature code
  ├─ scaffold + Vercel "hello" deploy (Gabriel)
  ├─ schema v1 huddle: walk ER.md table-by-table, freeze (ALL)
  ├─ migrations + minimal seed (admin + demo plan/product) (Gabriel)
  └─ UI Gate 0: art direction + design tokens + layout shell skeleton (Pavithra, per §11)

PHASE 1 — Foundations (parallel vertical slices)
  Gabriel:  seeds v2 + billing service skeleton (due-selection + tests)
  Abhiram:  auth + RBAC + staff mgmt → then catalog CRUD
  Catherine: subscription state machine + subscription UI shell
  Pavithra: design system on real pages + TanStack table pattern + dashboard wireframe

PHASE 2 — Money core
  Gabriel:  full billing engine + button + cron + runs page
  Abhiram:  catalog done → templates → outbox viewer
  Catherine: invoices + payments + discount engine (integrates with Gabriel's hook point)
  Pavithra: dashboard KPIs + charts + renewal forecast + aging

PHASE 3 — Differentiators & proof
  volume seed → perf verification (<2s, EXPLAIN) → print invoice → timeline → polling → portal polish

PHASE 4 — Harden & rehearse  (FEATURE FREEZE at start of phase)
  validation sweep · error states · impeccable pass · README verification on clean checkout ·
  offline rehearsal (WiFi OFF) · demo script ×2 · buffer for bugs only
```

**Timeline (30-hour hackathon, adjustable):** P0: H0–3 · P1: H3–10 · P2: H10–18 · P3: H18–24 ·
P4: H24–28 · buffer H28–30. If the event is 24h: P3 compresses (keep volume-seed + print only).

---

## 4. The billing engine in detail (both triggers, done "the best way")

```
BillingService.run({ asOf, triggerType, triggeredBy })
 1  pg_advisory_xact_lock(hashtext('billing_run'))
    └─ not acquired → return { status: 'ALREADY_RUNNING' }
 2  INSERT billing_runs(status: RUNNING, trigger_type, triggered_by)
 3  SELECT subscriptions WHERE status='ACTIVE' AND next_billing_date <= asOf
    (uses index (status, next_billing_date))
 4  FOR EACH subscription (own transaction):
      a. period = [next_billing_date, +plan.period)          — loop ≤12 for catch-up
      b. INSERT invoice … ON CONFLICT (subscription_id, period_start) DO NOTHING
         └─ conflict → skipped_already_billed++ ; continue
      c. number  ← NumberingService.next('INV')   (sequences, same txn)
      d. lines   ← snapshot subscription_lines × variant prices (+price_extra)
      e. taxes   ← TaxService.compute(lines)      (active assigned taxes)
      f. discount ← DiscountEngine.evaluate(subscription, lines, asOf)
                    → adds DISCOUNT line + discount_usages row (same txn)
      g. totals; due_date = issue + payment_terms_days; status = CONFIRMED
      h. next_billing_date = period_end
      i. if plan.auto_close && expiry ≤ period_end → status=CLOSED (+history)
 5  UPDATE billing_runs(DONE, created, skipped, errors, duration)
 6  revalidate dashboard queries
```

- **Manual:** tRPC mutation → result modal "3 created · 3 skipped (already billed) · 0 errors".
- **Local cron:** `npm run worker` (node-cron, default `05 00 * * *`, env-overridable — set to
  `*/2 * * * *` during rehearsal so judges *watch* it fire).
- **Hosted cron:** Vercel Cron → `GET /api/cron/billing` with `Authorization: Bearer $CRON_SECRET`.
- **Proof of robustness:** unit tests = double-run idempotency, catch-up after 3 missed periods,
  concurrent-run lock, discount usage-limit race.

## 5. API surface (tRPC routers — summary)

`auth.*` (signup, login, forgot, reset) · `staff.*` (create, deactivate) ·
`products.*` `attributes.*` `plans.*` `taxes.*` (CRUD) · `templates.*` (CRUD) ·
`subscriptions.*` (create, fromTemplate, transition, pause, resume, renew, close, timeline, list) ·
`billing.run` `billing.runs` · `invoices.*` (list, get, confirm, cancel, send, markPrint) ·
`payments.*` (record, listByInvoice) · `discounts.*` (CRUD, usage) ·
`dashboard.*` (kpis, mrrMovement, revenueByPlan, aging, renewals) ·
`admin.*` (auditLog, outbox, sequences) · `portal.*` (mySubscriptions, myInvoices).

## 6. Testing strategy

- **Unit (vitest), the services that must never be wrong:** BillingService (idempotency,
  catch-up, lock), DiscountEngine (window, precedence, limit), TaxService, state machine
  transitions, NumberingService race-safety, password policy zod.
- **Integration smoke:** one script walking signup → plan → subscription → billing → payment → paid.
- **Manual E2E:** the demo script (§7) doubles as the acceptance checklist.
- **Perf gate:** volume seed; dashboard + invoices list must each answer < 2s (local).

## 7. Demo script (the story — mirrors the PDF's own "month at Brightloop")

1. **Signup** — new customer; show the password policy reject weak input live; reset flow →
   open the **admin outbox viewer** and click the reset link (offline wow).
2. **Catalog** — admin adds product + **Odoo brand variant (+560)** → monthly plan with flags.
3. **Quotation → subscription** — staff instantiates a template; walk the state badges
   Draft→Quotation→Confirmed→Active; open the timeline tab.
4. **Billing day** — show cron config (`*/2 * * * *` rehearsal mode), *watch a run fire*, then
   click **"Run billing day"** manually → "0 created · 3 skipped (already billed)".
   **Say the words:** "idempotent — the database itself refuses a duplicate period" + show the
   `UNIQUE(subscription_id, period_start)` constraint. ← this is the mic-drop.
5. **Discount** — admin creates a 10% rule (min 5 seats, limit 2 uses) → next invoice shows the
   discount **on its own line, nobody touched it**; rule page shows "used 1/2".
6. **Payment** — record a UPI payment → invoice flips to PAID; overdue list shrinks live.
7. **Finance** — dashboard: MRR/ARR, movement, aging, renewal forecast; mention *"10,000
   subscriptions seeded — every page under 2 seconds"*; filter demos.
8. **Portal** — login as the customer: only their data, print their invoice.
9. **Close** — ER diagram + constraint cheat-sheet (`docs/ER.md`) on screen; offline proof:
   WiFi visibly OFF for the whole demo.

## 8. Engineering standards (binding)

- **HIGHLY MODULAR (§1 contract):** fixed module anatomy · barrel-only cross-module imports
  (eslint `no-restricted-imports` enforced in Phase 0 scaffold) · framework-free pure
  services · provider-exported contracts · `shared/` never imports `modules/` · thin pages.
  The deletable-module test is run at every PR review.
- Conventional commits (`feat:`, `fix:`, `db:`, `test:`…); `feat/<module>` branches; PR per
  slice reviewed by one teammate; **no direct commits to main**; never commit secrets.
- No code ships that the author can't explain line-by-line (ruleset §8) — PR reviewer asks.
- `.aimem/` updated in the same PR as the work (context/progress/tasks).
- Definition of done per feature: server+client validation · loading/empty/error states ·
  pagination on lists · unit tests for service logic · PR approved.

## 9. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Schema churn after freeze | high | Phase-0 huddle is binding; changes = migration + group ping |
| tRPC/Prisma unfamiliarity | med | Hour-3 pair walkthrough of one vertical slice (auth), copy pattern after |
| Billing bugs | high | Constraint-backed idempotency + unit tests + demo seed proves live |
| Time overrun on polish | med | P0/P1/P2 discipline; freeze at H24; cut P2, never P0 or validation |
| Merge conflicts in shared files | med | Vertical slices + shared-file huddle rule |
| Deploy surprises | low | Hello-deploy in Phase 0; redeploy at each phase end |
| Demo WiFi failure | high | Whole demo rehearsed offline; hosted link is bonus only |

## 10. Stretch design notes (do NOT build before freeze)

- **Proration:** mid-cycle plan change → prorated credit/charge line on next invoice
  (`(new−old) × days_remaining/days_in_period`). Design exists; build only if P0+P1 stable.
- **Dunning cadence:** scheduled reminder staging for overdue invoices (outbox rows).
- **Real SMTP dispatch** behind `SMTP_URL`; **CSV exports**; **dark mode**.

---

## 11. UI Excellence Program (mandatory — `design-taste-frontend` + `impeccable`)

Frontend design is judging criterion #3 — UI is treated as a **feature with gates**, not a
finish. Two installed skills are mandatory in the pipeline (per `AGENTS.md` §5):
**`design-taste-frontend`** (art direction, anti-generic house style) and **`impeccable`**
(UX review, hierarchy, typography, accessibility, edge cases). **No screen ships without
passing Gate 1; the demo does not happen before Gate 3.**

### Gate 0 — Art direction (Phase 0 · Pavithra leads · before any screen is built)
- Run `design-taste-frontend` to deal a researched direction (idea, composition, type,
  palette, section blueprints) — not "let's pick Tailwind defaults".
- Commit the result as **`docs/DESIGN.md`**: color tokens (HSL), type scale, spacing/radius
  scale, layout grid, component recipes, and an explicit **"we will NOT do" list** —
  anti-slop house rules: no generic purple-gradient hero, no default-looking gray cards,
  no emoji-as-bullets, no dead buttons, no orphaned pages reachable only by URL.
- Tailwind theme + shadcn/ui configured from those tokens; one shared `AppShell`
  (sidebar/nav) every internal screen uses; one `PortalShell` for customers.

### Gate 1 — Per-screen design pass (during build · every screen owner)
- Any page built or restyled gets the `design-taste-frontend` treatment **first**
  (owner runs the skill for their screen; Pavithra reviews the result).
- Per-screen checklist (part of Definition of Done):
  - One clear primary action; visual hierarchy reads top-to-bottom without effort.
  - Designed **empty / loading / error states** — skeletons, not spinner-on-blank.
  - Consistent spacing + type scale (tokens only, no one-off pixel values).
  - Keyboard navigable, visible focus rings, **WCAG AA contrast**.
  - Responsive 360px → desktop; nav never breaks between breakpoints.
  - **No dead buttons** — every control works or is removed.
  - Dense data screens use the shared TanStack Table pattern (sticky header, filter bar,
    pagination footer with totals) — built once by Pavithra, copied by all.

### Gate 2 — Mid-build UX review (end of Phase 2 · Pavithra runs `impeccable`)
- Full review of the core flows: signup → catalog → quotation → subscription →
  billing → invoice → payment → dashboard → portal.
- Covers hierarchy, typography, motion, UX copy, accessibility, edge cases.
- Findings logged in `.aimem/tasks.md` under "UI polish"; owners fix during Phase 3.

### Gate 3 — Final polish pass (Phase 4, post-freeze · `impeccable` again, whole team triage)
- Audit of **every** screen + the invoice **print stylesheet** (must look as good on paper —
  judges may print it).
- Zero-tolerance list before demo: no console errors · no unstyled flashes (FOUC) ·
  no placeholder/lorem text · consistent ₹ currency (`en-IN`) and date formats everywhere ·
  no broken routes.
- The **9 demo acts (§7) get extra pixel scrutiny** — first impressions are scored.

**Ownership:** Pavithra leads Gates 0/2/3 and unblocks anyone on the skills; Gate 1 is owned
by whoever builds the screen. Findings always tracked in `.aimem/tasks.md` → "UI polish".
