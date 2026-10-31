# Orbit — Demo Rehearsal Kit (the 9-act script + offline proof)

> Companion to `docs/PLAN.md` §7. This is the **exact** run-of-show: clicks,
> quotable lines, what judges see, and the fallback for every act.
> Rehearse twice with **WiFi OFF**. Total runtime target: **8–10 minutes**.

**Pre-conditions (verified by `scripts/demo-check.sh`):**

- PostgreSQL local up, `orbit` DB migrated + seeded, `.env` present, port 3000 free.
- Terminal A: `npm run dev` → http://localhost:3000
- Terminal B (rehearsal cron): `BILLING_CRON="0-59/2 * * * *" npm run worker`
- Browser: one tab on the login page, one tab on `docs/ER.md`, dev tools closed,
  zoom 100%, notifications silenced.
- **WiFi toggled OFF before judges sit down** (menu-bar icon visibly off).

**Demo logins (dev seed only):**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@orbit.local` | `Admin@Orbit1` |
| Staff | `staff@orbit.local` | `Staff@Orbit1` |
| Customer | `customer@acme.test` | `Cust@Orbit1` |

---

## Act 1 — Signup, password policy & the outbox reset trick (≈75s)

**Clicks:** Login page → "Sign up" → create a new customer account. First, deliberately
type a weak password (`password123`) and submit — the form rejects it live with the
policy message. Fix it to a compliant one, submit, log in. Then logout →
"Forgot password" → enter the new account's email → submit.

**Say:** *"Validation runs on both client and server — the server is the real gate.
Now watch the reset flow: we're fully offline, no SMTP. Orbit stages the mail in a
database outbox instead of dropping it."*

**Judges see:** Password policy enforced in real time; then you open the **admin
outbox viewer** (login as `admin@orbit.local` → Admin → Mail Outbox), find the staged
`RESET` mail to the new email, and **click the reset link inside it** — it opens the
working reset page. Set a new password, log in with it.

**Fallback:** If signup hiccups, skip to the outbox with the seeded customer —
say *"the flow is identical"* and show a staged reset mail for `customer@acme.test`.
Worst case, show the `email_outbox` table directly:
`psql $DATABASE_URL -c "SELECT to_email, kind, created_at FROM email_outbox ORDER BY created_at DESC LIMIT 3;"`

## Act 2 — Catalog: product, Odoo variant, plan (≈60s)

**Clicks:** As admin → Catalog → Products → "New product": name, sales price, cost.
Add attribute **Brand = Odoo** with **price_extra +₹560**. Then Plans → "New plan":
MONTHLY, ₹999, min quantity 1, availability window, flags: pausable ✓, closable-early ✓,
renewable ✓.

**Say:** *"Attributes and variants are first-class — the +₹560 Odoo variant premium is
data, not a hardcoded price. Plan lifecycle flags drive what the state machine allows later."*

**Judges see:** Product + variant + plan appear in their lists; plan flags visible.

**Fallback:** Seeded **Brightloop CRM** product already has the Odoo variant at +₹560
and a monthly ₹999 plan — say *"here's one we seeded earlier"* and open its detail
to show the identical fields. Never re-type during a failure.

## Act 3 — Quotation → subscription: the state machine (≈75s)

**Clicks:** As staff (`staff@orbit.local`) → Subscriptions → "From template" → pick
**Standard Monthly — Odoo Brand** → customer = Acme Stores → create. Then walk the
transitions: Draft → Quotation → Confirmed → **Active**. Open the **Timeline** tab.

**Say:** *"Subscriptions move through a guarded state machine — only legal transitions
are offered. Every hop is written to `subscription_status_history` with who and when —
that's the audit trail."*

**Judges see:** Status badges changing color through the flow; the timeline tab lists
each transition with actor and timestamp (seeded sub shows the full Draft→Active chain).

**Fallback:** Open seeded **SUB-2026-00001** (already ACTIVE) and demo on its timeline:
*"same machine, this one's already Active — note next billing date is today, which is
exactly what the billing engine picks up in the next act."*

## Act 4 — Billing day: the idempotency mic-drop (≈90s) ★

**Clicks:** Point at Terminal B — the rehearsal cron
(`BILLING_CRON="0-59/2 * * * *" npm run worker`) — and **watch a run fire live**
in the log. Then in the UI: Admin → Billing → **"Run billing day"** → confirm.
Result modal: **"0 created · N skipped (already billed) · 0 errors."**
Open the billing runs page and show the row: trigger type, counts, duration.
Then switch to the ER cheat-sheet tab and point at the constraint.

**Say (verbatim, the mic-drop):** *"Re-running billing can never double-bill — the
engine is **idempotent**: the database itself refuses a duplicate period with
`UNIQUE(subscription_id, period_start)` on invoices. Not application code hoping
for the best — a database constraint. Every invoice number comes from a gapless
sequence inside the same transaction, and a Postgres advisory lock means two
concurrent runs can't even start."*

**Judges see:** Cron firing on its own (scheduler proof), manual run skipping
already-billed periods (idempotency proof), the runs audit table, and the
constraint on screen.

**Fallback:** If the cron hasn't fired in the last minute, click the button twice in
a row — second click shows "skipped (already billed)", which *is* the demo.
If the button errors, run the same service from CLI isn't available — instead show
`billing_runs` rows in psql and read the counts aloud. The constraint on `docs/ER.md`
is static and always available.

## Act 5 — Discount engine: rules that apply themselves (≈60s)

**Clicks:** As admin → Discounts → "New rule": 10% off, scope SUBSCRIPTION,
min 5 seats, validity today→+30d, **usage limit 2**. Save. Run billing again (or open
the next generated invoice for a qualifying subscription). Open the rule page after.

**Say:** *"The discount engine evaluates eligibility at billing time — window,
minimums, precedence — and writes a `discount_usages` ledger row in the **same
transaction** as the invoice, so a usage limit can't be raced. Nobody applied this
discount by hand."*

**Judges see:** The discount as its **own invoice line** (kind = DISCOUNT, negative
amount), invoice totals reflecting it, and the rule page reading **"used 1/2"**.

**Fallback:** If no qualifying subscription exists to bill live, open a previously
generated invoice with a discount line and the rule's usage counter. The
*"used 1/2"* counter alone tells the transactional-ledger story.

## Act 6 — Payment: money in, PAID out (≈60s)

**Clicks:** Open an outstanding CONFIRMED invoice → "Record payment" → method **UPI**,
full amount → submit. Invoice flips to **PAID**. Try to record ₹1 more — the
overpayment guard rejects it. Open the paid/outstanding/overdue lists.

**Say:** *"Payments settle transactionally: the payment row and the invoice's
`amount_paid` update atomically — that denormalized column is deliberate and
documented, so overdue queries are indexed reads, not joins. Overpayment is rejected
by a CHECK and by the service."*

**Judges see:** Status badge flips to PAID; the overdue list shrinks live on refetch;
the guard error message on the overpayment attempt.

**Fallback:** Skip the deliberate overpayment attempt if the form misbehaves — the
flip to PAID and the shrinking overdue list carry the act. Mention the guard verbally.

## Act 7 — Finance dashboard + the EXPLAIN/PERF evidence moment (≈90s) ★

**Clicks:** Dashboard → KPI cards (MRR, ARR, outstanding, overdue) → MRR movement +
trend chart → revenue-by-plan → aging buckets → renewal forecast (7/30d). Change a
filter and let it refetch. Then switch to a terminal with the perf evidence.

**Say:** *"Ten thousand subscriptions are seeded in this database — every page answers
in under two seconds, fully local. That's not luck: the billing hot path runs on
`INDEX (status, next_billing_date)`, and here's the proof."* Then run:

```bash
psql "$DATABASE_URL" -c "EXPLAIN ANALYZE SELECT * FROM subscriptions
  WHERE status='ACTIVE' AND next_billing_date <= CURRENT_DATE;"
```

**Say (while pointing at the plan):** *"Index Scan, not Seq Scan — microseconds.
Database design was judging criterion number one for us; this is the receipt."*

**Judges see:** Live charts and filters; then the `EXPLAIN ANALYZE` output showing an
index scan with sub-millisecond execution on the volume dataset.

**Fallback:** If the volume seed wasn't run, say so honestly — *"this is the demo
dataset; the index works identically at 10k"* — the query plan shape is the same.
Keep a screenshot of the 10k `EXPLAIN ANALYZE` output in the repo docs to flash if
the live query can't run.

## Act 8 — Customer portal: their data, only their data (≈60s)

**Clicks:** Logout → login as `customer@acme.test` → Portal. Show: only Acme's
subscriptions and invoices (no admin nav at all). Open an invoice → **Print**
(the print stylesheet renders a clean paper invoice). Optionally request a pause —
it lands as a staff-visible request.

**Say:** *"Same app, scoped by role — the portal queries are filtered by customer at
the tRPC layer, not hidden in the UI. And the print stylesheet means this invoice
looks as good on paper as on screen — judges can print it."*

**Judges see:** The role-filtered nav, a single customer's data, and the print preview
of a properly typeset invoice.

**Fallback:** If the print dialog is flaky, screenshot the print preview beforehand
or show the print CSS media query in code for 5 seconds — then move on. Portal
scoping (no admin links, only own data) is the point of the act.

## Act 9 — Close: the schema on screen, WiFi still off (≈45s)

**Clicks:** Bring up `docs/ER.md` (already open in a tab) → scroll the ER diagram →
stop at the **Constraint cheat-sheet** table. Gesture at the menu bar: WiFi icon
still OFF.

**Say:** *"Seventeen tables, third normal form, every foreign key indexed, every
business rule backed by a database constraint — never billed twice, positive amounts,
valid plan windows, gapless numbering. And this entire demo — signup, billing, cron,
payments, dashboards — just ran with **zero internet**. Local PostgreSQL, local cron,
local everything."*

**Judges see:** The ER diagram, the constraint cheat-sheet (`UNIQUE(subscription_id,
period_start)` highlighted), and the WiFi-OFF icon as the final image.

**Fallback:** None needed — static docs never fail. If time is cut, the close is two
sentences: the constraint cheat-sheet + the WiFi gesture.

---

## Pre-demo checklist (10 items — run 15 min before judges arrive)

1. `./scripts/demo-check.sh` exits 0 (DB up, seeded, port free).
2. `npm run dev` serving http://localhost:3000 with **no console errors** on login page.
3. Rehearsal worker running: `BILLING_CRON="0-59/2 * * * *" npm run worker` — watch it fire once.
4. "Run billing day" clicked once already, so the demo click shows *skipped (already billed)*.
5. All three logins verified manually (admin / staff / customer).
6. Outbox has ≥1 staged `RESET` mail to click through (trigger forgot-password if empty).
7. A CONFIRMED unpaid invoice exists for the payment act; an invoice with a discount
   line exists (or a qualifying sub ready to bill).
8. Dashboard loads < 2s; `EXPLAIN ANALYZE` command tested in a spare terminal tab.
9. `docs/ER.md` open in a browser tab at the constraint cheat-sheet; print-preview
   of an invoice tested once.
10. **WiFi OFF**, notifications silenced, browser zoom 100%, laptop plugged in,
    phone hotspot ready (untouched — emergency only).
