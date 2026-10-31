# FLOWS.md — Pre-Demo Gate (12 flows)

> The **"absolutely everything works"** verifier. One command walks every demo-relevant
> flow against the **live dev server + local PostgreSQL** and prints one ✅/❌ line per
> flow. Exits non-zero if any flow fails. **Run this right before the judges walk in.**

## How to run

```bash
# 1. Start the app (separate terminal) — must be reachable on :3000
npm run dev

# 2. Seed the demo dataset (the Brightloop story) if not already seeded
npm run db:seed

# 3. Run the gate
npx tsx scripts/flow-smoke.ts
# or against a non-default URL:
BASE_URL=http://localhost:3000 npx tsx scripts/flow-smoke.ts
```

**Prerequisites:** `DATABASE_URL` set (in `.env`); dev server up; DB seeded. The script
logs in as `staff@orbit.local / Staff@Orbit1` and `customer@acme.test / Cust@Orbit1`.

**Output:** one ✅/❌ line per flow, then `12/12 flows green ✅ — demo is ready.` and
exit `0`. Any failure prints `❌ N/12 flow(s) FAILED.` and exits non-zero.

**Idempotent & non-destructive:** every mutation the script makes is undone before it
exits, so the demo dataset never drifts and the script can be re-run any number of times.
Billing-run invoices are deleted (FK-safe order) and the `INV` sequence is reset to its
pre-run value; the recorded payment is deleted and `INV-2026-00002` is restored to
`CONFIRMED` / `amount_paid=0`; the staged `RESET` mail and reset token are removed; any
subscription billing anchors moved by the runs are restored. `billing_runs` audit rows are
**intentionally kept** (they are the audit trail, FR-BILL-06).

---

## The 12 flows

| # | Flow | What it proves | tRPC / HTTP touched |
|---|------|----------------|---------------------|
| 1 | **auth** | Staff credentials sign in and yield a `STAFF` session; a wrong password is rejected (no session cookie). Gates every protected route. | `POST /api/auth/callback/credentials`, `GET /api/auth/session` |
| 2 | **catalog** | `catalog.products.list` returns the seeded **Brightloop CRM** + **Brightloop Analytics**, and the CRM's **Odoo variant carries `priceExtra +560`** (attribute-driven pricing works). | `catalog.products.list`, `catalog.variants.listByProduct` |
| 3 | **plans** | `catalog.plans.list` shows **MONTHLY / YEARLY / WEEKLY** periods, each row carrying the lifecycle flags (`pausable`, `renewable`, `closableEarly`, `autoClose`) that drive legal transitions. | `catalog.plans.list` |
| 4 | **templates** | `templates.list` includes the **"Standard Monthly — Odoo Brand"** quotation template (the one-tap quotation the demo creates subscriptions from). | `templates.list` |
| 5 | **subscriptions** | `subscriptions.list` returns **SUB-2026-00001…7** each with a status (DRAFT → QUOTATION → CONFIRMED → ACTIVE → PAUSED → CLOSED lifecycle coverage); `subscriptions.get` on **SUB-2026-00001** returns its **lines + status history**. | `subscriptions.list`, `subscriptions.get` |
| 6 | **billing** | `billing.run` **creates invoices for due subs** (SUB-…00001 due today, SUB-…00002 catch-up) and reports the run; a **second run creates 0** (idempotency via `UNIQUE(subscription_id, period_start)`). Then full cleanup: created invoices deleted (FK-safe), `INV` sequence reset, anchors restored. | `billing.run` (×2) + Prisma cleanup |
| 7 | **discounts** | `discounts.list` shows **SEAT10** (−10% ≥5 seats) and **LAUNCH200** (−₹200 on CRM) with **usage counts** (`_count.usages`) — the discount engine's consumption tracking. | `discounts.list` |
| 8 | **invoices** | `invoices.list` works and surfaces the seeded **OVERDUE `INV-2026-00002`** as `CONFIRMED` with **outstanding ₹1,839.62** — the dunning story the dashboard shows. | `invoices.list` |
| 9 | **payments** | `payments.record` of **₹1,839.62 UPI** on `INV-2026-00002` flips the invoice to **PAID** (transactional `amount_paid` denormalization + auto-settle). Then **UNDO**: payment deleted, invoice restored to `CONFIRMED`/`amount_paid=0`. | `payments.record` + Prisma cleanup |
| 10 | **dashboard** | `dashboard.kpis` returns **activeSubscriptionsCount ≥ 2** and **overdueInvoicesCount ≥ 1** (checked while `INV-2026-00002` is unpaid); `dashboard.mrrMovement` returns all-numeric fields (`newMRR`, `expansionMRR`, `contractionMRR`, `churnMRR`, `netMRRChange`). | `dashboard.kpis`, `dashboard.mrrMovement` |
| 11 | **portal** | Customer login (`customer@acme.test`) → `portal.mySubscriptions` returns **only Acme's subs (≥ 1)** — no cross-customer leak (Globex's SUB-…0002/4/6 must not appear) — and `portal.myProfile` returns **Acme**. Proves session-scoped data isolation (FR-PORT-01). | `portal.mySubscriptions`, `portal.myProfile` |
| 12 | **mail** | `admin.outbox` (staff session) returns 200 with a paginated `{ items }` array; `auth.forgotPassword` for the customer stages a **`RESET` row** in `email_outbox` (offline mail queue). Then cleanup removes the row + token. | `admin.outbox`, `auth.forgotPassword` + Prisma cleanup |

---

## Notes for the demo

- **Ordering matters:** the dashboard "overdue ≥ 1" check (flow 10) depends on
  `INV-2026-00002` being unpaid. Flow 9 restores it to `CONFIRMED` after recording the
  payment, so it is overdue again by the time flow 10 runs — the script is safe in the
  order above and leaves the invoice unpaid for the judges.
- **Why billing_runs rows are kept:** they are the immutable audit trail (FR-BILL-06);
  deleting them would falsify history. Only the *invoices* the run produced are removed so
  document numbering and the "one OVERDUE invoice" demo hook stay pristine.
- **Sequences:** the script reads the current `INV/<year>` sequence before the billing run
  and writes it back after, so the demo's `INV-2026-00003` numbering continues exactly
  where the seed left off.
