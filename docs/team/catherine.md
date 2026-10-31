# Member Brief — Catherine Maria Benny · Money-Flow Lead

Paste the block below as your first message to your agent. Keep this file open as reference.

```text
I am Catherine Maria Benny, Money-Flow Lead on Team Orbit (Odoo × Make-a-Ton 9.0, Kochi).
We are building Orbit, a subscription management system for the fictional company
Brightloop Software. Stack (locked): Next.js 15 + TypeScript + tRPC v11 + Prisma 6 +
PostgreSQL 18 (local, offline-first) + Tailwind/shadcn + vitest.

Before writing ANY code, read these files in this order:
1. AGENTS.md (binding ruleset)
2. .aimem/context.md
3. docs/SRS.md (M3/M4/M6/M7/M8 + §5 state machines + §6 business rules are mine)
4. docs/ER.md (subscriptions(+lines,status_history), invoices(+lines), payments,
   discount_rules(+products,usages), quotation_templates(+lines))
5. docs/PLAN.md (§2 my slice, §4 billing engine — my DiscountEngine hooks in at step f,
   §3 build order, §11 UI gates)

I OWN: subscription state machine (DRAFT→QUOTATION→CONFIRMED→ACTIVE→CLOSED + PAUSED
branch, plan-flag-gated transitions, subscription_status_history on every change),
"subscription from template" flow, subscription create/edit UI + detail timeline,
invoices (list/detail, confirm/cancel/send/print + print stylesheet), PaymentService
(record, overpayment guard, amount_paid in same txn, auto-flip to PAID), paid vs
outstanding vs overdue views, DiscountEngine (admin-only rules, eligibility window,
precedence: product-scope then subscription-scope, usage-limit ledger, auto-apply into
billing), customer portal backend (query-layer scoping) + pause/resume/renew requests.

My FRs: FR-QT-02, FR-SUB-01…08, FR-INV-01…05, FR-PAY-01…04, FR-DISC-01…06, FR-PORT-01…03.

HOOK CONTRACT with Gabriel (he builds BillingService):
  DiscountEngine.evaluate(subscription, lines, asOf) → { discountLines, usages }
  Called inside his per-subscription billing transaction (PLAN §4 step f). I must ship
  DiscountEngine as a pure function in src/server/services/ he can import without
  modification — no DB side effects outside the transaction he passes in.

KEY REQUIREMENTS (exact, testable):
- Illegal subscription transitions → 409 {code:"ILLEGAL_TRANSITION", from, to}; EVERY
  legal transition writes a history row (who/when/note).
- Pause/resume only if plan.pausable; close-early only if closable_early; renew only if
  renewable; quantity ≥ plan.min_quantity at confirm.
- Invoice lines are SNAPSHOTS — never recompute from live prices. Print stylesheet must
  look professional on paper (judges may print).
- Payment: amount > 0 and ≤ outstanding (overpayment rejected with clear message);
  amount_paid updated in the SAME transaction (documented denormalization); auto-PAID
  at full settlement.
- Discount: percent 0<x≤100 / fixed >0; window start≤issue≤end; usage_limit counted
  transactionally; fixed capped at remaining subtotal; never below zero; appears as its
  own invoice line with the rule name; stops on expiry/exhaustion automatically.
- Overdue = status CONFIRMED ∧ due_date < today ∧ outstanding > 0.
- Portal: customers see ONLY their own rows — scoping enforced at the query layer.

RULES I follow (from AGENTS.md):
- HIGHLY MODULAR (PLAN §1 contract): my code lives in modules/subscriptions +
  modules/invoices + modules/payments + modules/discounts + modules/portal with the
  fixed anatomy (index/router/service/schemas/queries/components/tests); Gabriel imports
  DiscountEngine ONLY via modules/discounts/index.ts; services are pure (no next/trpc).
- vitest unit tests: state machine (all legal/illegal transitions), DiscountEngine
  (window, precedence, limit race, caps), PaymentService (settlement, overpayment).
- Every list page: filters + keyset pagination + designed empty/loading/error states.
- UI Gate 1 (PLAN §11): I run the design-taste-frontend skill for each of my screens
  before building; Pavithra reviews. Tokens only, no one-off pixel values.
- I update .aimem/tasks.md and .aimem/progress.md in the same change as my work.

GIT (my standing authorization to you): work on branch feat/money-catherine (or
feat/subscriptions-catherine, feat/discounts-catherine per task). I explicitly authorize
you to `git commit` and `git push` on MY branch whenever I ask — and I will ask at least
every 30 minutes, per team cadence. Small atomic commits, conventional messages. NEVER
commit to main, never force-push, never touch secrets. Ask me before anything outside
my branch.

Sequence: Phase 1 = state machine service + tests → subscription UI shell. Phase 2 =
invoices + payments → DiscountEngine (integrate with Gabriel's hook). Phase 3 = print
stylesheet, timeline UI, portal. Do NOT touch prisma/schema.prisma without telling
Gabriel — schema changes go through him as migrations. Walk me through every
non-obvious decision — I must be able to explain every line to the judges.
```

## My task checklist (phased — details in `docs/PLAN.md` §3)

### Phase 1 — Foundations
- [ ] SubscriptionStateMachine service + full transition unit tests
- [ ] Subscription create/edit UI shell + list with status badges
- [ ] "From template" flow (uses Abhiram's `templates.getWithLines`)

### Phase 2 — Money core
- [ ] Invoice service + list/detail UI, confirm/cancel actions, filters + pagination + totals footer
- [ ] PaymentService + record-payment form; paid/outstanding/overdue views
- [ ] DiscountEngine + admin discount CRUD UI + usage ledger display
- [ ] Wire `evaluate()` into Gabriel's billing hook; joint idempotency/usage-limit race test
- [ ] Send-invoice action → email_outbox staging (Abhiram's viewer displays it)

### Phase 3 — Differentiators
- [ ] Invoice print stylesheet (professional paper layout)
- [ ] Subscription activity timeline (history + invoices + payments)
- [ ] Customer portal: my subscriptions/invoices, print own invoice, pause/resume/renew requests

### Phase 4 — Harden & rehearse
- [ ] Fix Gate 2/3 UI findings for my screens
- [ ] Demo acts 3 (quotation→subscription), 5 (discount auto-applies), 6 (payment flips to PAID) rehearsed

## Coordination points
- **Gabriel** — the DiscountEngine hook (above); joint unit tests for billing+discount in Phase 2. His `UNIQUE(subscription_id, period_start)` + my usage counting share one transaction.
- **Abhiram** — template API shape (`templates.getWithLines`); his outbox staging function is reused by my send-invoice action.
- **Pavithra** — subscription/invoice/portal screens follow her tokens + AppShell/PortalShell + TanStack table pattern; aging data query for her dashboard (agree shape in Phase 2).
- **Taxes** — TaxService is small (rate × line, snapshot); I own it inside billing/invoice code unless Gabriel claims it — confirm in Phase 1 standup.
