/**
 * scripts/flow-smoke.ts — the "absolutely everything works" verifier.
 *
 * Pre-demo gate: ONE command that walks ALL 12 demo-relevant flows against the
 * live dev server + local PostgreSQL and prints one ✅/❌ line per flow.
 * Exits non-zero if ANY flow fails. Run this right before the judges walk in.
 *
 * Usage:
 *   npx tsx scripts/flow-smoke.ts                  # default BASE_URL=http://localhost:3000
 *   BASE_URL=http://localhost:3000 npx tsx scripts/flow-smoke.ts
 *
 * Requires:
 *   - Dev server running (npm run dev)
 *   - Database seeded with demo data (npm run db:seed) — the Brightloop story:
 *     staff@orbit.local / Staff@Orbit1, customer@acme.test / Cust@Orbit1,
 *     SUB-2026-00001..7, INV-2026-00001 (PAID) + INV-2026-00002 (OVERDUE ₹1,839.62),
 *     SEAT10 + LAUNCH200, INV seq 2026 → 2.
 *   - DATABASE_URL env var (or .env) for direct Prisma reads + cleanup.
 *
 * IDEMPOTENT: every mutation this script makes is undone before it exits, so
 * the demo dataset NEVER drifts. Billing-run invoices are deleted (FK-safe
 * order) and the INV sequence is reset to its pre-run value; the recorded
 * payment is deleted and INV-2026-00002 is restored to CONFIRMED/amount_paid=0;
 * the staged RESET mail is removed; any mutated subscription billing anchors
 * are restored. billing_runs audit rows are intentionally KEPT (they are the
 * audit trail, per FR-BILL-06). Re-run this script as many times as you like.
 */
import { PrismaClient } from "@prisma/client";

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const STAFF_EMAIL = "staff@orbit.local";
const STAFF_PASSWORD = "Staff@Orbit1";
const WRONG_PASSWORD = "WrongPass1!";

const CUSTOMER_EMAIL = "customer@acme.test";
const CUSTOMER_PASSWORD = "Cust@Orbit1";

const EXPECTED_SUB_NUMBERS = [
  "SUB-2026-00001",
  "SUB-2026-00002",
  "SUB-2026-00003",
  "SUB-2026-00004",
  "SUB-2026-00005",
  "SUB-2026-00006",
  "SUB-2026-00007",
];
const OVERDUE_INVOICE_NUMBER = "INV-2026-00002";
const OVERDUE_OUTSTANDING = 1839.62;
const ODOO_PRICE_EXTRA = 560;
const TEMPLATE_NAME = "Standard Monthly — Odoo Brand";

let failures = 0;

function pass(label: string) {
  console.log(`✅ ${label}`);
}
function fail(label: string, detail?: string) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failures++;
}

// ── Cookie jar (minimal, per-request) ───────────────────────────────────────

class CookieJar {
  private jar = new Map<string, string>();

  /** Extract Set-Cookie headers from a Response and store them. */
  absorb(res: Response) {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const header of raw) {
      const [pair] = header.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "" || value === '""') {
        this.jar.delete(name);
      } else {
        this.jar.set(name, value);
      }
    }
  }

  /** Return the Cookie header value for outgoing requests. */
  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  get hasSession(): boolean {
    // Only an actual session token counts — csrf/callback cookies contain
    // "next-auth" in their names but are not sessions.
    return [...this.jar.keys()].some((k) => k.includes("session-token"));
  }
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

/** Fetch with cookie jar and no auto-redirect (we want to inspect status codes). */
async function req(
  url: string,
  opts: { method?: string; body?: string; jar?: CookieJar; headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.jar) headers["cookie"] = opts.jar.header();
  if (opts.body && !headers["content-type"]) {
    headers["content-type"] = "application/x-www-form-urlencoded";
  }
  const res = await fetch(`${BASE_URL}${url}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body,
    redirect: "manual",
  });
  opts.jar?.absorb(res);
  return res;
}

/** Extract the CSRF token from the next-auth CSRF endpoint. */
async function getCsrfToken(jar: CookieJar): Promise<string> {
  const res = await req("/api/auth/csrf", { jar });
  const json = (await res.json()) as { csrfToken: string };
  return json.csrfToken;
}

/** Build a URL-encoded credentials body for next-auth's callback endpoint. */
function credentialsBody(csrfToken: string, email: string, password: string): string {
  return new URLSearchParams({ csrfToken, email, password, json: "true" }).toString();
}

/** Sign in via next-auth credentials; returns a session jar or null. */
async function login(email: string, password: string): Promise<CookieJar | null> {
  const jar = new CookieJar();
  const csrf = await getCsrfToken(jar);
  await req("/api/auth/callback/credentials", {
    method: "POST",
    body: credentialsBody(csrf, email, password),
    jar,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  return jar.hasSession ? jar : null;
}

// ── tRPC caller ─────────────────────────────────────────────────────────────

interface TrpcResult<T = unknown> {
  status: number;
  /** The unwrapped `result.data` on success, else undefined. */
  data: T | undefined;
  /** The tRPC error object on failure, else undefined. */
  error: { code?: number; message?: string; data?: { code?: string } } | undefined;
  raw: unknown;
}

/** Call a tRPC query (GET) or mutation (POST) over HTTP (non-batch). */
async function trpcCall<T = unknown>(
  path: string,
  opts: { input?: unknown; jar?: CookieJar; method?: "GET" | "POST" } = {},
): Promise<TrpcResult<T>> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.jar) headers["cookie"] = opts.jar.header();

  const method = opts.method ?? "GET";
  let url = `${BASE_URL}/api/trpc/${path}`;
  let body: string | undefined;

  if (method === "POST") {
    body = JSON.stringify({ json: opts.input });
  } else {
    url += `?input=${encodeURIComponent(JSON.stringify({ json: opts.input ?? null }))}`;
  }

  const res = await fetch(url, { method, headers, body, redirect: "manual" });
  opts.jar?.absorb(res);
  const json = (await res.json().catch(() => null)) as {
    result?: { data?: { json?: T } | T };
    error?: { json?: { code?: number; message?: string; data?: { code?: string } } };
  } | null;

  // tRPC v11 non-batch: success = { result: { data: { json } } } (superjson) or
  // { result: { data } } (plain); error = { error: { json: { code, message, data } } }.
  const dataContainer = json?.result?.data;
  const data = (
    dataContainer && typeof dataContainer === "object" && "json" in dataContainer
      ? (dataContainer as { json: T }).json
      : dataContainer
  ) as T | undefined;
  const error = json?.error?.json;
  return { status: res.status, data, error, raw: json };
}

// ── Small numeric/date utils ────────────────────────────────────────────────

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (v && typeof v === "object" && "toString" in v) return Number((v as { toString(): string }).toString());
  return NaN;
}

function approx(a: unknown, b: number): boolean {
  const n = toNum(a);
  return Number.isFinite(n) && Math.abs(n - b) < 0.005;
}

function isNumeric(v: unknown): boolean {
  return Number.isFinite(toNum(v));
}


// ── Flow 1 · auth ───────────────────────────────────────────────────────────

async function flow01_auth(): Promise<CookieJar | null> {
  const label = "auth: staff login works, wrong password rejected";
  try {
    // Wrong password must NOT yield a session.
    const badJar = new CookieJar();
    const badCsrf = await getCsrfToken(badJar);
    await req("/api/auth/callback/credentials", {
      method: "POST",
      body: credentialsBody(badCsrf, STAFF_EMAIL, WRONG_PASSWORD),
      jar: badJar,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    if (badJar.hasSession) {
      fail(label, "session cookie set despite wrong password");
      return null;
    }

    // Correct password must yield a STAFF session.
    const jar = await login(STAFF_EMAIL, STAFF_PASSWORD);
    if (!jar) {
      fail(label, "no session cookie after staff login");
      return null;
    }
    const sessionRes = await req("/api/auth/session", { jar });
    const session = (await sessionRes.json()) as { user?: { email?: string; role?: string } };
    if (session?.user?.role === "STAFF" && session?.user?.email === STAFF_EMAIL) {
      pass(label);
      return jar;
    }
    fail(label, `session role=${session?.user?.role} email=${session?.user?.email}`);
    return null;
  } catch (e) {
    fail(label, String(e));
    return null;
  }
}

// ── Flow 2 · catalog ────────────────────────────────────────────────────────

interface ProductItem {
  id: string;
  name: string;
  variants?: { priceExtra: unknown; attributeValue?: { value?: string } }[];
}

async function flow02_catalog(jar: CookieJar | null): Promise<void> {
  const label = "catalog: products.list returns seeded products incl. Odoo +560 variant";
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const { status, data, error } = await trpcCall<{ items: ProductItem[] }>("catalog.products.list", {
      input: { take: 100 },
      jar,
    });
    if (status !== 200 || !data) return fail(label, `status=${status} err=${error?.message}`);

    const items = data.items ?? [];
    const crm = items.find((p) => p.name === "Brightloop CRM");
    const analytics = items.find((p) => p.name === "Brightloop Analytics");
    if (!crm || !analytics) {
      return fail(label, `seeded products missing (found: ${items.map((p) => p.name).join(", ") || "none"})`);
    }

    // The Odoo variant must exist with priceExtra +560. If variants aren't
    // inlined in the list response, fetch them per product.
    let odooExtra: unknown = crm.variants?.find(
      (v) => v.attributeValue?.value === "Odoo",
    )?.priceExtra;
    if (odooExtra === undefined) {
      const vr = await trpcCall<{ priceExtra: unknown; attributeValue?: { value?: string } }[]>(
        "catalog.variants.listByProduct",
        { input: { productId: crm.id }, jar },
      );
      if (vr.status === 200 && Array.isArray(vr.data)) {
        odooExtra = vr.data.find((v) => v.attributeValue?.value === "Odoo")?.priceExtra;
      }
    }
    if (approx(odooExtra, ODOO_PRICE_EXTRA)) {
      pass(label);
    } else {
      fail(label, `Odoo variant priceExtra=${JSON.stringify(odooExtra)} (want ${ODOO_PRICE_EXTRA})`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 3 · plans ──────────────────────────────────────────────────────────

interface PlanItem {
  period: string;
  pausable: boolean;
  renewable: boolean;
  closableEarly: boolean;
  autoClose: boolean;
}

async function flow03_plans(jar: CookieJar | null): Promise<void> {
  const label = "plans: list shows MONTHLY/YEARLY/WEEKLY with lifecycle flags";
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const { status, data, error } = await trpcCall<{ items: PlanItem[] }>("catalog.plans.list", {
      input: { take: 100 },
      jar,
    });
    if (status !== 200 || !data) return fail(label, `status=${status} err=${error?.message}`);

    const periods = new Set((data.items ?? []).map((p) => p.period));
    const hasAll = ["MONTHLY", "YEARLY", "WEEKLY"].every((p) => periods.has(p));
    const flagsPresent = (data.items ?? []).every(
      (p) =>
        typeof p.pausable === "boolean" &&
        typeof p.renewable === "boolean" &&
        typeof p.closableEarly === "boolean" &&
        typeof p.autoClose === "boolean",
    );
    if (hasAll && flagsPresent && (data.items ?? []).length >= 3) {
      pass(label);
    } else {
      fail(label, `periods=${[...periods].join(",")} flagsOk=${flagsPresent} count=${data.items?.length}`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 4 · templates ──────────────────────────────────────────────────────

async function flow04_templates(jar: CookieJar | null): Promise<void> {
  const label = `templates: list includes "${TEMPLATE_NAME}"`;
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const { status, data, error } = await trpcCall<{ items: { name: string }[] }>("templates.list", {
      input: { take: 100 },
      jar,
    });
    if (status !== 200 || !data) return fail(label, `status=${status} err=${error?.message}`);
    const found = (data.items ?? []).some((t) => t.name === TEMPLATE_NAME);
    if (found) {
      pass(label);
    } else {
      fail(label, `not found (have: ${(data.items ?? []).map((t) => t.name).join(", ") || "none"})`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 5 · subscriptions ──────────────────────────────────────────────────

interface SubListItem {
  id: string;
  number: string;
  status: string;
}

interface SubDetail {
  number: string;
  status: string;
  lines: unknown[];
  statusHistory: { fromStatus: string; toStatus: string }[];
}

async function flow05_subscriptions(jar: CookieJar | null): Promise<void> {
  const label = "subscriptions: SUB-2026-00001..7 listed; SUB-2026-00001 detail shows lines + status history";
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const { status, data, error } = await trpcCall<SubListItem[]>("subscriptions.list", {
      input: { limit: 100 },
      jar,
    });
    if (status !== 200 || !Array.isArray(data)) {
      return fail(label, `list status=${status} err=${error?.message}`);
    }
    const numbers = new Set(data.map((s) => s.number));
    const missing = EXPECTED_SUB_NUMBERS.filter((n) => !numbers.has(n));
    if (missing.length > 0) {
      return fail(label, `missing subscriptions: ${missing.join(", ")}`);
    }
    // Every listed sub has a status.
    if (!data.every((s) => typeof s.status === "string" && s.status.length > 0)) {
      return fail(label, "some subscription is missing a status");
    }

    // Detail of SUB-2026-00001.
    const sub1 = data.find((s) => s.number === "SUB-2026-00001");
    if (!sub1) return fail(label, "SUB-2026-00001 not in list");
    const detail = await trpcCall<SubDetail>("subscriptions.get", { input: { id: sub1.id }, jar });
    if (detail.status !== 200 || !detail.data) {
      return fail(label, `get status=${detail.status} err=${detail.error?.message}`);
    }
    const hasLines = Array.isArray(detail.data.lines) && detail.data.lines.length > 0;
    const hasHistory = Array.isArray(detail.data.statusHistory) && detail.data.statusHistory.length > 0;
    if (hasLines && hasHistory) {
      pass(label);
    } else {
      fail(label, `lines=${detail.data.lines?.length ?? 0} history=${detail.data.statusHistory?.length ?? 0}`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 6 · billing (idempotent, with full cleanup) ───────────────────────

interface BillingRunResult {
  status: string;
  invoicesCreated: number;
  skippedAlreadyBilled: number;
  errors: number;
}

async function flow06_billing(jar: CookieJar | null, db: PrismaClient): Promise<void> {
  const label = "billing: run invoices due subs; 2nd run idempotent (0); data restored";
  if (!jar) return fail(label, "skipped — no staff session");

  // Capture pristine state to restore afterwards.
  const invYear = new Date().getFullYear();
  let invSeqBefore: bigint | null = null;
  let sub1Anchor: Date | null | undefined;
  let sub2Anchor: Date | null | undefined;
  let preRunInvoiceIds = new Set<string>();
  let runOk = false;

  try {
    const invSeqRow = await db.sequence.findUnique({
      where: { docType_year: { docType: "INV", year: invYear } },
    });
    invSeqBefore = invSeqRow?.lastNumber != null ? BigInt(invSeqRow.lastNumber) : null;
    const sub1 = await db.subscription.findUnique({ where: { number: "SUB-2026-00001" } });
    const sub2 = await db.subscription.findUnique({ where: { number: "SUB-2026-00002" } });
    sub1Anchor = sub1?.nextBillingDate;
    sub2Anchor = sub2?.nextBillingDate;
    // Snapshot every existing invoice id so cleanup deletes ONLY what our runs
    // created — never a pre-existing/demo invoice, regardless of run history.
    const before = await db.invoice.findMany({ select: { id: true } });
    preRunInvoiceIds = new Set(before.map((i) => i.id));

    // ── Run 1: must create invoices for the due subs (sub1 due today, sub2
    // catch-up). ──────────────────────────────────────────────────────────
    const r1 = await trpcCall<BillingRunResult>("billing.run", { method: "POST", input: {}, jar });
    if (r1.status !== 200 || !r1.data) {
      return fail(label, `run#1 status=${r1.status} err=${r1.error?.message}`);
    }
    if (r1.data.status !== "DONE" || r1.data.invoicesCreated < 1) {
      return fail(label, `run#1 status=${r1.data.status} created=${r1.data.invoicesCreated} (want ≥1)`);
    }
    const createdRun1 = r1.data.invoicesCreated;

    // ── Run 2: idempotent — both anchors advanced, so 0 new invoices. ────
    const r2 = await trpcCall<BillingRunResult>("billing.run", { method: "POST", input: {}, jar });
    if (r2.status !== 200 || !r2.data) {
      return fail(label, `run#2 status=${r2.status} err=${r2.error?.message}`);
    }
    if (r2.data.invoicesCreated !== 0) {
      return fail(label, `run#2 created=${r2.data.invoicesCreated} (want 0 — not idempotent)`);
    }
    runOk = true;

    // ── CLEANUP: delete every invoice created by our runs (FK-safe order),
    // reset the INV sequence, restore subscription anchors. billing_runs rows
    // are KEPT (audit trail, FR-BILL-06). ─────────────────────────────────
    const created = await db.invoice.findMany({
      where: { id: { notIn: [...preRunInvoiceIds] } },
      select: { id: true },
    });
    const invIds = created.map((i) => i.id);

    if (invIds.length > 0) {
      // FK order: discount_usages → invoice_lines → invoices.
      await db.discountUsage.deleteMany({ where: { invoiceId: { in: invIds } } });
      await db.invoiceLine.deleteMany({ where: { invoiceId: { in: invIds } } });
      await db.invoice.deleteMany({ where: { id: { in: invIds } } });
    }

    // Reset INV sequence so demo numbering stays pristine (back to pre-run).
    if (invSeqBefore !== null) {
      await db.sequence.update({
        where: { docType_year: { docType: "INV", year: invYear } },
        data: { lastNumber: invSeqBefore },
      });
    }

    // Restore subscription billing anchors mutated by the runs.
    if (sub1 && sub1Anchor !== undefined) {
      await db.subscription.update({ where: { id: sub1.id }, data: { nextBillingDate: sub1Anchor } });
    }
    if (sub2 && sub2Anchor !== undefined) {
      await db.subscription.update({ where: { id: sub2.id }, data: { nextBillingDate: sub2Anchor } });
    }

    pass(`${label} (run#1 +${createdRun1}, run#2 +0, seq reset to ${invSeqBefore})`);
  } catch (e) {
    fail(label, String(e));
  } finally {
    // Belt-and-braces: even on a partial failure above, attempt to restore
    // pristine state so the demo dataset never drifts.
    if (!runOk) {
      try {
        const created = await db.invoice.findMany({
          where: { id: { notIn: [...preRunInvoiceIds] } },
          select: { id: true },
        });
        const invIds = created.map((i) => i.id);
        if (invIds.length > 0) {
          await db.discountUsage.deleteMany({ where: { invoiceId: { in: invIds } } });
          await db.invoiceLine.deleteMany({ where: { invoiceId: { in: invIds } } });
          await db.invoice.deleteMany({ where: { id: { in: invIds } } });
        }
        if (invSeqBefore !== null) {
          await db.sequence.update({
            where: { docType_year: { docType: "INV", year: invYear } },
            data: { lastNumber: invSeqBefore },
          });
        }
        if (sub1Anchor !== undefined) {
          const s1 = await db.subscription.findUnique({ where: { number: "SUB-2026-00001" } });
          if (s1) await db.subscription.update({ where: { id: s1.id }, data: { nextBillingDate: sub1Anchor } });
        }
        if (sub2Anchor !== undefined) {
          const s2 = await db.subscription.findUnique({ where: { number: "SUB-2026-00002" } });
          if (s2) await db.subscription.update({ where: { id: s2.id }, data: { nextBillingDate: sub2Anchor } });
        }
      } catch (cleanupErr) {
        console.error(`   ⚠️  billing cleanup after failure also errored: ${String(cleanupErr)}`);
      }
    }
  }
}

// ── Flow 7 · discounts ──────────────────────────────────────────────────────

interface DiscountRuleItem {
  name: string;
  _count?: { usages: number };
}

async function flow07_discounts(jar: CookieJar | null): Promise<void> {
  const label = "discounts: rules list shows SEAT10 + LAUNCH200 with usage counts";
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const { status, data, error } = await trpcCall<DiscountRuleItem[]>("discounts.list", {
      input: { limit: 100 },
      jar,
    });
    if (status !== 200 || !Array.isArray(data)) return fail(label, `status=${status} err=${error?.message}`);

    const seat10 = data.find((r) => r.name === "SEAT10");
    const launch200 = data.find((r) => r.name === "LAUNCH200");
    if (!seat10 || !launch200) {
      return fail(label, `missing rules (found: ${data.map((r) => r.name).join(", ") || "none"})`);
    }
    const countsPresent = typeof seat10._count?.usages === "number" && typeof launch200._count?.usages === "number";
    if (countsPresent) {
      pass(`${label} (SEAT10=${seat10._count!.usages}, LAUNCH200=${launch200._count!.usages})`);
    } else {
      fail(label, "usage counts (_count.usages) not present on both rules");
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 8 · invoices ───────────────────────────────────────────────────────

interface InvoiceListItem {
  number: string;
  status: string;
  grandTotal: unknown;
  amountPaid: unknown;
}

async function flow08_invoices(jar: CookieJar | null): Promise<void> {
  const label = `invoices: list works; OVERDUE ${OVERDUE_INVOICE_NUMBER} outstanding ₹${OVERDUE_OUTSTANDING}`;
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const { status, data, error } = await trpcCall<{ items: InvoiceListItem[] }>("invoices.list", {
      input: { limit: 100 },
      jar,
    });
    if (status !== 200 || !data) return fail(label, `status=${status} err=${error?.message}`);

    const inv = (data.items ?? []).find((i) => i.number === OVERDUE_INVOICE_NUMBER);
    if (!inv) return fail(label, `${OVERDUE_INVOICE_NUMBER} not in list`);

    const outstanding = toNum(inv.grandTotal) - toNum(inv.amountPaid);
    if (inv.status === "CONFIRMED" && approx(outstanding, OVERDUE_OUTSTANDING)) {
      pass(label);
    } else {
      fail(label, `status=${inv.status} outstanding=${outstanding.toFixed(2)} (want CONFIRMED ₹${OVERDUE_OUTSTANDING})`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 9 · payments (record then UNDO) ────────────────────────────────────

async function flow09_payments(jar: CookieJar | null, db: PrismaClient): Promise<void> {
  const label = `payments: record ₹${OVERDUE_OUTSTANDING} UPI on ${OVERDUE_INVOICE_NUMBER} → PAID, then UNDO`;
  if (!jar) return fail(label, "skipped — no staff session");

  const inv = await db.invoice.findUnique({ where: { number: OVERDUE_INVOICE_NUMBER } });
  if (!inv) return fail(label, `${OVERDUE_INVOICE_NUMBER} not found in DB`);

  // Pristine snapshot to restore.
  const pristine = { amountPaid: inv.amountPaid, status: inv.status };
  let recordedPaymentId: string | null = null;
  let paidVerified = false;

  try {
    // Record the payment via tRPC.
    const rec = await trpcCall<{ payment: { id: string }; settled: boolean }>("payments.record", {
      method: "POST",
      input: { invoiceId: inv.id, method: "UPI", amount: OVERDUE_OUTSTANDING, note: "flow-smoke test payment" },
      jar,
    });
    if (rec.status !== 200 || !rec.data) {
      return fail(label, `record status=${rec.status} err=${rec.error?.message}`);
    }
    recordedPaymentId = rec.data.payment?.id ?? null;

    // Verify the invoice flipped to PAID.
    const after = await db.invoice.findUnique({ where: { id: inv.id } });
    if (after?.status !== "PAID" || !approx(after.amountPaid, OVERDUE_OUTSTANDING)) {
      return fail(label, `after payment status=${after?.status} amountPaid=${String(after?.amountPaid)}`);
    }
    paidVerified = true;
    pass(label);
  } catch (e) {
    fail(label, String(e));
  } finally {
    // UNDO: delete the payment + restore amount_paid=0 status=CONFIRMED so the
    // demo's one OVERDUE invoice is back for the judges. Runs whether or not
    // the flow passed (idempotent / no drift).
    try {
      if (recordedPaymentId) {
        await db.payment.delete({ where: { id: recordedPaymentId } });
      }
      await db.invoice.update({
        where: { id: inv.id },
        data: { amountPaid: pristine.amountPaid, status: pristine.status },
      });
      if (paidVerified) {
        console.log(`   ↩️  restored ${OVERDUE_INVOICE_NUMBER} → status=CONFIRMED amount_paid=0 (demo data pristine)`);
      }
    } catch (cleanupErr) {
      console.error(`   ⚠️  payment cleanup failed: ${String(cleanupErr)}`);
      fail(label, `cleanup failed: ${String(cleanupErr)}`);
    }
  }
}

// ── Flow 10 · dashboard ─────────────────────────────────────────────────────

interface Kpis {
  activeSubscriptionsCount: number;
  overdueInvoicesCount: number;
}
interface MrrMovement {
  newMRR: unknown;
  expansionMRR: unknown;
  contractionMRR: unknown;
  churnMRR: unknown;
  netMRRChange: unknown;
}

async function flow10_dashboard(jar: CookieJar | null): Promise<void> {
  const label = "dashboard: kpis (active subs ≥2, overdue ≥1) + mrrMovement numeric";
  if (!jar) return fail(label, "skipped — no staff session");
  try {
    const k = await trpcCall<Kpis>("dashboard.kpis", { input: {}, jar });
    if (k.status !== 200 || !k.data) return fail(label, `kpis status=${k.status} err=${k.error?.message}`);
    const active = Number(k.data.activeSubscriptionsCount);
    const overdue = Number(k.data.overdueInvoicesCount);
    if (!(active >= 2)) return fail(label, `activeSubscriptionsCount=${active} (want ≥2)`);
    if (!(overdue >= 1)) return fail(label, `overdueInvoicesCount=${overdue} (want ≥1 — run before step 9?)`);

    const m = await trpcCall<MrrMovement>("dashboard.mrrMovement", { input: {}, jar });
    if (m.status !== 200 || !m.data) return fail(label, `mrrMovement status=${m.status} err=${m.error?.message}`);
    const numeric =
      isNumeric(m.data.newMRR) &&
      isNumeric(m.data.expansionMRR) &&
      isNumeric(m.data.contractionMRR) &&
      isNumeric(m.data.churnMRR) &&
      isNumeric(m.data.netMRRChange);
    if (!numeric) return fail(label, "mrrMovement fields are not all numeric");

    pass(`${label} (active=${active}, overdue=${overdue})`);
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 11 · portal ────────────────────────────────────────────────────────

interface PortalSub {
  number: string;
  status: string;
}
interface PortalProfile {
  companyName: string;
  email: string;
}

async function flow11_portal(): Promise<void> {
  const label = "portal: customer login → mySubscriptions scoped to Acme (≥1) + myProfile = Acme";
  try {
    const jar = await login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    if (!jar) return fail(label, "no session after customer login");

    // Profile.
    const prof = await trpcCall<PortalProfile>("portal.myProfile", { input: {}, jar });
    if (prof.status !== 200 || !prof.data) {
      return fail(label, `myProfile status=${prof.status} err=${prof.error?.message}`);
    }
    if (!prof.data.companyName?.toLowerCase().includes("acme")) {
      return fail(label, `myProfile.companyName="${prof.data.companyName}" (want Acme)`);
    }

    // Subscriptions — must be ONLY this customer's, and ≥1.
    const subs = await trpcCall<PortalSub[]>("portal.mySubscriptions", { input: {}, jar });
    if (subs.status !== 200 || !Array.isArray(subs.data)) {
      return fail(label, `mySubscriptions status=${subs.status} err=${subs.error?.message}`);
    }
    const list = subs.data;
    if (list.length < 1) return fail(label, "mySubscriptions returned 0 rows (want ≥1)");

    // Acme owns SUB-2026-00001/3/5/7; Globex owns 2/4/6. If any Globex-only
    // number appears, scoping is broken.
    const globexOnly = ["SUB-2026-00002", "SUB-2026-00004", "SUB-2026-00006"];
    const leaked = list.filter((s) => globexOnly.includes(s.number));
    if (leaked.length > 0) {
      return fail(label, `scoping leak: other customer's subs returned (${leaked.map((s) => s.number).join(",")})`);
    }
    pass(`${label} (${list.length} subs, all Acme)`);
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Flow 12 · mail ──────────────────────────────────────────────────────────

async function flow12_mail(staffJar: CookieJar | null, db: PrismaClient): Promise<void> {
  const label = "mail: admin.outbox 200 + array; forgotPassword stages RESET row (then cleaned up)";
  if (!staffJar) return fail(label, "skipped — no staff session");
  try {
    // Outbox returns 200 with a paginated { items } payload.
    const ob = await trpcCall<{ items: unknown[] }>("admin.outbox", { input: { take: 5 }, jar: staffJar });
    if (ob.status !== 200 || !ob.data || !Array.isArray(ob.data.items)) {
      return fail(label, `outbox status=${ob.status} items not an array`);
    }

    // Trigger a password reset for the customer → RESET row staged in outbox.
    const fp = await trpcCall("auth.forgotPassword", {
      method: "POST",
      input: { email: CUSTOMER_EMAIL },
    });
    if (fp.status !== 200) return fail(label, `forgotPassword status=${fp.status} err=${fp.error?.message}`);

    const resetRow = await db.emailOutbox.findFirst({
      where: { toEmail: CUSTOMER_EMAIL, kind: "RESET" },
      orderBy: { createdAt: "desc" },
    });
    if (!resetRow) return fail(label, "no RESET row staged in email_outbox");

    pass(label);

    // CLEANUP: remove the staged RESET row (and the single-use token) so the
    // demo outbox stays pristine.
    await db.emailOutbox.deleteMany({ where: { toEmail: CUSTOMER_EMAIL, kind: "RESET" } });
    const user = await db.user.findUnique({ where: { email: CUSTOMER_EMAIL } });
    if (user) {
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    }
  } catch (e) {
    fail(label, String(e));
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nOrbit Flow Smoke — pre-demo gate — ${BASE_URL}\n`);
  const db = new PrismaClient();

  try {
    const staffJar = await flow01_auth();
    await flow02_catalog(staffJar);
    await flow03_plans(staffJar);
    await flow04_templates(staffJar);
    await flow05_subscriptions(staffJar);
    await flow06_billing(staffJar, db);
    await flow07_discounts(staffJar);
    await flow08_invoices(staffJar);
    await flow09_payments(staffJar, db);
    // NOTE: dashboard overdue check must run while INV-2026-00002 is unpaid.
    // flow09 already restored it to CONFIRMED, so it is overdue again here.
    await flow10_dashboard(staffJar);
    await flow11_portal();
    await flow12_mail(staffJar, db);
  } finally {
    await db.$disconnect();
  }

  console.log("");
  if (failures > 0) {
    console.error(`❌ ${failures}/12 flow(s) FAILED.`);
    process.exit(1);
  }
  console.log("12/12 flows green ✅ — demo is ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
