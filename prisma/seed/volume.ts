/**
 * Orbit — VOLUME seed generator (FR-ADM-04, NFR-PERF-01).
 *
 * Proves the "< 2s with thousands of subscriptions" claim by loading a
 * realistic bulk dataset on top of the demo seed (prisma/seed/index.ts):
 *
 *   - ~2 000 generated customers (1 user each, one shared precomputed bcrypt
 *     hash constant — hashing 2 000 passwords would dominate the runtime).
 *   - VOLUME_SUBSCRIPTIONS ACTIVE subscriptions (default 10 000), plan mix
 *     30 % MONTHLY / 50 % YEARLY / 20 % WEEKLY, next_billing_date 40 % overdue
 *     (billing-run fuel) / 60 % due within the next 30 days (renewal forecast).
 *   - 60 % of subscriptions get 1–4 historical invoices each (sequential
 *     monthly periods ending today-ish): 85 % PAID (amount_paid = grand_total,
 *     + matching payment row), 15 % CONFIRMED with due_date in the past
 *     (overdue/aging fuel). One PRODUCT line per invoice, 18 % tax snapshot.
 *
 * Numbering: subscription numbers continue the real SUB-<year> sequence (and
 * advance it, so app-created subscriptions never collide); historical invoice
 * numbers use the clearly-marked volume series INV-<year>-V00001… (unique via
 * a counter, never colliding with engine-generated INV-<year>-NNNNN numbers),
 * and sequences INV/<year> is advanced to the max counter used so the gapless
 * numbering mechanism is respected.
 *
 * Re-runnable: each run allocates fresh user e-mail indices, SUB numbers and
 * invoice V-numbers past the existing maxima, so it can be run repeatedly
 * without unique-constraint collisions.
 *
 * Usage:  VOLUME_SUBSCRIPTIONS=10000 VOLUME_BATCH=500 npm run db:seed:volume
 * Requires the demo seed first (plans, GST tax, staff user) — errors clearly
 * if any prerequisite is missing.
 */
import { randomUUID } from "node:crypto";
import {
  PrismaClient,
  Prisma,
  Period,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
} from "@prisma/client";

const prisma = new PrismaClient();

// ── Config (env-driven) ──────────────────────────────────────────────────────
const TOTAL_SUBS = Math.max(1, intEnv("VOLUME_SUBSCRIPTIONS", 10_000));
const BATCH = Math.max(1, intEnv("VOLUME_BATCH", 500));
const CUSTOMER_COUNT = Math.min(2_000, TOTAL_SUBS); // "~2000 customers"
const YEAR = new Date().getUTCFullYear(); // 2026 in this environment
const TAX_RATE = 18; // GST 18 % — invoice tax math per task spec
const CUSTOMER_SHARE_WITH_HISTORY = 0.6; // 60 % of subscriptions get invoices
const PAID_SHARE = 0.85; // of historical invoices

/// Shared password for every generated user: "Volume@User1" (meets the policy:
/// >8 chars, upper, lower, special). Precomputed ONCE with bcryptjs cost 10 —
/// never hash per row (2 000 bcrypt hashes would take minutes for no value).
const VOLUME_PASSWORD_HASH =
  "$2a$10$3jKuWxpBIfLZESK7IQvwduJHevUDCmriLnCMXKc5Q4mA79mc26PAm";

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid ${name}="${raw}" — expected a positive integer.`);
  }
  return n;
}

// ── Small deterministic-safe helpers ─────────────────────────────────────────
const dec2 = (n: number): number => Math.round(n * 100) / 100;
const randInt = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => {
  const v = arr[Math.floor(Math.random() * arr.length)];
  if (v === undefined) throw new Error("pick() called on an empty array");
  return v;
};
const chance = (p: number): boolean => Math.random() < p;

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

/** Date-only helpers (UTC midnight) for @db.Date columns — no DST drift. */
const todayUTC = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};
const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
};
const addMonths = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
};

/** Max numeric suffix captured by `re` among rows matching `like` (0 if none). */
async function maxSuffix(
  table: "users" | "subscriptions" | "invoices",
  column: "email" | "number",
  like: string,
  re: string,
): Promise<number> {
  const sql = `SELECT COALESCE(MAX(CAST(SUBSTRING(${column} FROM $1) AS BIGINT)), 0) AS max FROM ${table} WHERE ${column} LIKE $2`;
  const rows = await prisma.$queryRawUnsafe<{ max: bigint }[]>(sql, re, like);
  return Number(rows[0]?.max ?? 0);
}

/** createMany in VOLUME_BATCH chunks with per-batch progress logging. */
async function batchInsert<T>(
  label: string,
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += BATCH) {
    await insert(rows.slice(i, i + BATCH));
    console.log(`  ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startedAt = Date.now();
  const today = todayUTC();
  console.log(
    `🌱 Orbit VOLUME seed — ${TOTAL_SUBS} subscriptions across ${CUSTOMER_COUNT} customers (batch ${BATCH})…`,
  );

  // ── Prerequisites: demo seed must be present ─────────────────────────────
  const staff = await prisma.user.findUnique({ where: { email: "staff@orbit.local" } });
  if (!staff) {
    throw new Error(
      'Demo seed not detected: staff user "staff@orbit.local" is missing. Run `npm run db:seed` first.',
    );
  }
  const activeTaxes = await prisma.tax.findMany({ where: { isActive: true } });
  if (activeTaxes.length === 0) {
    throw new Error(
      "Demo seed not detected: no active tax (expected GST 18%). Run `npm run db:seed` first.",
    );
  }
  // Volume data is invoiced at a flat 18 % (task spec) — attach only the 18 %
  // tax(es) to volume lines so the billing engine would compute the same tax
  // the historical invoices show. Fallback: all active taxes, summed.
  const volumeTaxes = activeTaxes.filter((t) => Number(t.ratePercent) === TAX_RATE);
  const lineTaxes = volumeTaxes.length > 0 ? volumeTaxes : activeTaxes;
  const effectiveTaxRate = lineTaxes.reduce((s, t) => s + Number(t.ratePercent), 0);
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    include: {
      product: { include: { variants: { include: { attributeValue: true } } } },
    },
  });
  const plansByPeriod = new Map<Period, typeof plans>();
  for (const plan of plans) {
    if (plan.product.variants.length === 0) continue; // need a variant for lines
    const bucket = plansByPeriod.get(plan.period) ?? [];
    bucket.push(plan);
    plansByPeriod.set(plan.period, bucket);
  }
  const missingPeriods = [Period.MONTHLY, Period.YEARLY, Period.WEEKLY].filter(
    (p) => !plansByPeriod.has(p),
  );
  if (missingPeriods.length > 0) {
    throw new Error(
      `Volume seed needs at least one active plan (with a product variant) per period — missing: ${missingPeriods.join(
        ", ",
      )}. Run \`npm run db:seed\` and/or create ${missingPeriods.join("/")} plans first.`,
    );
  }

  // ── Continue counters past existing data (re-runnable) ───────────────────
  const userStart =
    (await maxSuffix(
      "users",
      "email",
      "volume-user-%@load.test",
      "volume-user-([0-9]+)@load[.]test",
    )) + 1;
  const subSeq = await prisma.sequence.findUnique({
    where: { docType_year: { docType: "SUB", year: YEAR } },
  });
  const subStart =
    Math.max(
      Number(subSeq?.lastNumber ?? 0),
      await maxSuffix("subscriptions", "number", `SUB-${YEAR}-%`, `SUB-${YEAR}-([0-9]+)$`),
    ) + 1;
  const invStart =
    (await maxSuffix("invoices", "number", `INV-${YEAR}-V%`, `INV-${YEAR}-V([0-9]+)$`)) + 1;
  console.log(
    `  counters: users from #${userStart} · SUB from #${subStart} · INV-V from #${invStart}`,
  );

  // ── Users + customers (~2000) ────────────────────────────────────────────
  const now = new Date();
  const userRows: Prisma.UserCreateManyInput[] = [];
  const customerRows: Prisma.CustomerCreateManyInput[] = [];
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const n = userStart + i;
    const userId = randomUUID();
    userRows.push({
      id: userId,
      email: `volume-user-${n}@load.test`,
      passwordHash: VOLUME_PASSWORD_HASH, // shared constant — see header comment
      role: "CUSTOMER",
      createdAt: now,
    });
    customerRows.push({
      id: randomUUID(),
      userId,
      companyName: `Load Test Co ${n} Pvt Ltd`,
      billingAddress: `${(n % 400) + 1} MG Road, Kochi, Kerala 682001`,
      taxId: `32LOAD${String(n).padStart(5, "0")}Z5`,
    });
  }
  console.log("👤 users + customers…");
  await batchInsert("users", userRows, (chunk) =>
    prisma.user.createMany({ data: chunk }),
  );
  await batchInsert("customers", customerRows, (chunk) =>
    prisma.customer.createMany({ data: chunk }),
  );
  const customerIds = shuffled(customerRows.map((c) => c.id));

  // ── Subscriptions (ACTIVE; 30 % MONTHLY / 50 % YEARLY / 20 % WEEKLY) ─────
  const monthlyCount = Math.round(TOTAL_SUBS * 0.3);
  const yearlyCount = Math.round(TOTAL_SUBS * 0.5);
  const periodPool = shuffled<Period>([
    ...Array<Period>(monthlyCount).fill(Period.MONTHLY),
    ...Array<Period>(yearlyCount).fill(Period.YEARLY),
    ...Array<Period>(TOTAL_SUBS - monthlyCount - yearlyCount).fill(Period.WEEKLY),
  ]);

  interface SubMeta {
    id: string;
    customerId: string;
    plan: (typeof plans)[number];
    variantId: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
  }
  const subMetas: SubMeta[] = [];
  const subRows: Prisma.SubscriptionCreateManyInput[] = [];
  for (let i = 0; i < TOTAL_SUBS; i++) {
    const period = periodPool[i];
    if (period === undefined) throw new Error("period pool exhausted");
    const plan = pick(plansByPeriod.get(period)!);
    const variant = pick(plan.product.variants);
    const unitPrice = dec2(Number(plan.product.salesPrice) + Number(variant.priceExtra));
    const quantity = plan.minQuantity; // ≥ min_quantity (FR-SUB-07)
    const subId = randomUUID();
    // 40 % due in the past (billing fuel), 60 % due within the next 30 days.
    const nextBillingDate = chance(0.4)
      ? addDays(today, -randInt(1, 45))
      : addDays(today, randInt(0, 30));
    const customerId = customerIds[i % customerIds.length];
    if (customerId === undefined) throw new Error("customer pool exhausted");
    subRows.push({
      id: subId,
      number: `SUB-${YEAR}-${String(subStart + i).padStart(5, "0")}`,
      customerId,
      planId: plan.id,
      startDate: addDays(today, -randInt(30, 400)),
      expiryDate: addDays(today, randInt(60, 730)),
      paymentTermsDays: 15,
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate,
      createdAt: now,
    });
    subMetas.push({
      id: subId,
      customerId,
      plan,
      variantId: variant.id,
      variantLabel: variant.attributeValue.value,
      quantity,
      unitPrice,
    });
  }
  console.log("📄 subscriptions…");
  await batchInsert("subscriptions", subRows, (chunk) =>
    prisma.subscription.createMany({ data: chunk }),
  );

  // ── Subscription lines (+ line taxes) ────────────────────────────────────
  const lineRows: Prisma.SubscriptionLineCreateManyInput[] = [];
  const lineTaxRows: Prisma.SubscriptionLineTaxCreateManyInput[] = [];
  for (const meta of subMetas) {
    const lineId = randomUUID();
    lineRows.push({
      id: lineId,
      subscriptionId: meta.id,
      variantId: meta.variantId,
      quantity: meta.quantity,
      unitPrice: meta.unitPrice,
    });
    for (const tax of lineTaxes) {
      lineTaxRows.push({ lineId, taxId: tax.id });
    }
  }
  console.log("🧾 subscription lines…");
  await batchInsert("subscription lines", lineRows, (chunk) =>
    prisma.subscriptionLine.createMany({ data: chunk }),
  );
  await batchInsert("subscription line taxes", lineTaxRows, (chunk) =>
    prisma.subscriptionLineTax.createMany({ data: chunk }),
  );

  // ── Historical invoices for 60 % of subscriptions (1–4 monthly periods) ──
  const subsWithHistory = new Set(
    shuffled(subMetas.map((m) => m.id)).slice(
      0,
      Math.floor(subMetas.length * CUSTOMER_SHARE_WITH_HISTORY),
    ),
  );
  const invoiceRows: Prisma.InvoiceCreateManyInput[] = [];
  const invoiceLineRows: Prisma.InvoiceLineCreateManyInput[] = [];
  const paymentRows: Prisma.PaymentCreateManyInput[] = [];
  const paymentMethods = [
    PaymentMethod.UPI,
    PaymentMethod.UPI,
    PaymentMethod.CARD,
    PaymentMethod.CARD,
    PaymentMethod.BANK_TRANSFER,
  ];
  let invCounter = invStart;
  for (const meta of subMetas) {
    if (!subsWithHistory.has(meta.id)) continue;
    const k = randInt(1, 4); // invoices per subscription
    // Anchor day clamped to ≤ 28 so monthly steps never roll over a month.
    const anchor = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), Math.min(today.getUTCDate(), 28)),
    );
    const lastPeriodEnd = addDays(anchor, -randInt(0, 10)); // "today-ish"
    const subtotal = dec2(meta.quantity * meta.unitPrice);
    const taxTotal = dec2(subtotal * (effectiveTaxRate / 100));
    const grandTotal = dec2(subtotal + taxTotal);
    for (let j = 0; j < k; j++) {
      // Sequential monthly periods, ending today-ish; consistent start/end.
      const periodEnd = addMonths(lastPeriodEnd, -(k - 1 - j));
      const periodStart = addMonths(periodEnd, -1);
      const issueDate = periodStart; // billed at period start (engine rule §6.5)
      const dueDate = addDays(issueDate, 15); // payment_terms_days
      const paid = chance(PAID_SHARE); // 85 % PAID / 15 % CONFIRMED+overdue
      const invoiceId = randomUUID();
      invoiceRows.push({
        id: invoiceId,
        number: `INV-${YEAR}-V${String(invCounter++).padStart(5, "0")}`,
        customerId: meta.customerId,
        subscriptionId: meta.id,
        issueDate,
        dueDate, // in the past for every period → CONFIRMED rows are overdue
        status: paid ? InvoiceStatus.PAID : InvoiceStatus.CONFIRMED,
        subtotal,
        taxTotal,
        discountTotal: 0,
        grandTotal,
        amountPaid: paid ? grandTotal : 0, // denormalized per ER.md
        periodStart,
        periodEnd,
        createdAt: issueDate,
      });
      invoiceLineRows.push({
        id: randomUUID(),
        invoiceId,
        variantId: meta.variantId,
        kind: "PRODUCT",
        description: `${meta.plan.product.name} (${meta.variantLabel}) — 1 month`,
        quantity: meta.quantity,
        unitPrice: meta.unitPrice,
        taxAmount: taxTotal,
        lineTotal: subtotal,
      });
      if (paid) {
        const paidAt = addDays(issueDate, randInt(1, 12));
        paidAt.setUTCHours(randInt(9, 18), randInt(0, 59), 0, 0);
        paymentRows.push({
          id: randomUUID(),
          invoiceId,
          method: pick(paymentMethods),
          amount: grandTotal,
          paidAt,
          note: "Volume seed payment",
          recordedById: staff.id,
          createdAt: paidAt,
        });
      }
    }
  }
  console.log(
    `💵 historical invoices (${subsWithHistory.size} subscriptions with history)…`,
  );
  await batchInsert("invoices", invoiceRows, (chunk) =>
    prisma.invoice.createMany({ data: chunk }),
  );
  await batchInsert("invoice lines", invoiceLineRows, (chunk) =>
    prisma.invoiceLine.createMany({ data: chunk }),
  );
  await batchInsert("payments", paymentRows, (chunk) =>
    prisma.payment.createMany({ data: chunk }),
  );

  // ── Advance sequences to the max used (gapless-numbering contract) ───────
  const subMaxUsed = subStart + TOTAL_SUBS - 1;
  const invMaxUsed = invCounter - 1;
  await prisma.sequence.upsert({
    where: { docType_year: { docType: "SUB", year: YEAR } },
    update: { lastNumber: subMaxUsed },
    create: { docType: "SUB", year: YEAR, lastNumber: subMaxUsed },
  });
  await prisma.sequence.upsert({
    where: { docType_year: { docType: "INV", year: YEAR } },
    update: { lastNumber: invMaxUsed },
    create: { docType: "INV", year: YEAR, lastNumber: invMaxUsed },
  });

  // ── Summary ──────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log("✅ Volume seed complete:");
  console.log(`   users:            ${userRows.length}`);
  console.log(`   customers:        ${customerRows.length}`);
  console.log(`   subscriptions:    ${subRows.length} (ACTIVE, mix M${monthlyCount}/Y${yearlyCount}/W${TOTAL_SUBS - monthlyCount - yearlyCount})`);
  console.log(`   sub lines/taxes:  ${lineRows.length} / ${lineTaxRows.length}`);
  console.log(`   invoices:         ${invoiceRows.length} (${paymentRows.length} PAID · ${invoiceRows.length - paymentRows.length} CONFIRMED overdue)`);
  console.log(`   invoice lines:    ${invoiceLineRows.length}`);
  console.log(`   payments:         ${paymentRows.length}`);
  console.log(`   sequences:        SUB/${YEAR} → ${subMaxUsed} · INV/${YEAR} → ${invMaxUsed}`);
  console.log(`   elapsed:          ${elapsed}s`);
}

main()
  .catch((e) => {
    console.error("❌ Volume seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
