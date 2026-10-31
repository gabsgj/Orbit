import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient, Period, SubscriptionStatus, Prisma } from "@prisma/client";
import { run } from "./service";
import { addPeriod } from "@/shared/lib/dates";

/**
 * BillingService tests — the correctness gate for the crown jewel (SRS M5,
 * NFR-REL-01). Runs against the dedicated orbit_test database (migrated in
 * Phase 1). Each test builds its own fixtures; tables are truncated between
 * tests. Deterministic: every run uses an explicit `asOf` date.
 */
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

const TABLES = [
  "invoice_lines",
  "discount_usages",
  "payments",
  "invoices",
  "billing_runs",
  "subscription_status_history",
  "subscription_line_taxes",
  "subscription_lines",
  "subscriptions",
  "quotation_template_lines",
  "quotation_templates",
  "plans",
  "taxes",
  "product_variants",
  "attribute_values",
  "attributes",
  "products",
  "customers",
  "users",
  "sequences",
];

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(",")} RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Fixtures ──────────────────────────────────────────────────────────────

interface FixtureOptions {
  period?: Period;
  planPrice?: string;
  unitPrice?: string;
  taxRate?: string;
  nextBillingDate: Date;
  startDate?: Date;
  expiryDate?: Date;
  autoClose?: boolean;
  status?: SubscriptionStatus;
  paymentTermsDays?: number;
}

async function seedSubscription(opts: FixtureOptions) {
  const user = await prisma.user.create({
    data: {
      email: `admin-${crypto.randomUUID()}@orbit.test`,
      passwordHash: "x",
      role: "ADMIN",
    },
  });
  const customerUser = await prisma.user.create({
    data: {
      email: `cust-${crypto.randomUUID()}@acme.test`,
      passwordHash: "x",
      role: "CUSTOMER",
    },
  });
  const customer = await prisma.customer.create({
    data: { userId: customerUser.id, companyName: "Acme Test" },
  });
  const attribute = await prisma.attribute.create({ data: { name: `Brand-${crypto.randomUUID()}` } });
  const attributeValue = await prisma.attributeValue.create({
    data: { attributeId: attribute.id, value: "Odoo" },
  });
  const product = await prisma.product.create({
    data: { name: "Brightloop CRM", type: "service", salesPrice: 999, costPrice: 320 },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, attributeValueId: attributeValue.id, priceExtra: 560 },
  });
  const plan = await prisma.plan.create({
    data: {
      productId: product.id,
      price: opts.planPrice ?? "999",
      period: opts.period ?? Period.MONTHLY,
      minQuantity: 1,
      availableFrom: new Date("2025-01-01"),
      availableTo: new Date("2030-12-31"),
      autoClose: opts.autoClose ?? false,
    },
  });
  const tax = await prisma.tax.create({
    data: { name: "GST", ratePercent: opts.taxRate ?? "18" },
  });
  const startDate = opts.startDate ?? new Date("2025-01-01");
  const subscription = await prisma.subscription.create({
    data: {
      number: `SUB-TEST-${crypto.randomUUID().slice(0, 8)}`,
      customerId: customer.id,
      planId: plan.id,
      startDate,
      expiryDate: opts.expiryDate ?? new Date("2030-01-01"),
      paymentTermsDays: opts.paymentTermsDays ?? 15,
      status: opts.status ?? SubscriptionStatus.ACTIVE,
      nextBillingDate: opts.nextBillingDate,
      lines: {
        create: [
          {
            variantId: variant.id,
            quantity: 1,
            unitPrice: opts.unitPrice ?? "1559",
            taxes: { create: [{ taxId: tax.id }] },
          },
        ],
      },
    },
  });
  return { user, customer, product, variant, plan, tax, subscription };
}

const runBilling = (asOf: Date, triggeredById?: string) =>
  run(prisma, { asOf, triggerType: "MANUAL", triggeredById });

// ── Tests ─────────────────────────────────────────────────────────────────

describe("BillingService.run", () => {
  it("invoices a due subscription: snapshot lines, tax, totals, CONFIRMED, gapless number", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-01") });
    const result = await runBilling(new Date("2026-01-15"), f.user.id);

    expect(result.status).toBe("DONE");
    expect(result.invoicesCreated).toBe(1);
    expect(result.errors).toBe(0);

    const invoice = await prisma.invoice.findFirstOrThrow({
      include: { lines: true },
    });
    expect(invoice.number).toBe("INV-2026-00001");
    expect(invoice.status).toBe("CONFIRMED");
    expect(invoice.periodStart).toEqual(new Date("2026-01-01"));
    expect(invoice.periodEnd).toEqual(new Date("2026-02-01"));
    // 1559 × 1 = 1559.00; GST 18% = 280.62; grand = 1839.62
    expect(invoice.subtotal.toString()).toBe("1559");
    expect(invoice.taxTotal.toString()).toBe("280.62");
    expect(invoice.grandTotal.toString()).toBe("1839.62");
    // due = issue + payment terms (15d)
    expect(invoice.dueDate).toEqual(new Date("2026-01-30"));
    // snapshot description carries product + variant + period
    expect(invoice.lines[0].description).toContain("Brightloop CRM");
    expect(invoice.lines[0].description).toContain("Odoo");

    // anchor advanced by one period
    const sub = await prisma.subscription.findUniqueOrThrow({
      where: { id: f.subscription.id },
    });
    expect(sub.nextBillingDate).toEqual(new Date("2026-02-01"));

    // audit row finalized
    const runRow = await prisma.billingRun.findFirstOrThrow();
    expect(runRow.status).toBe("DONE");
    expect(runRow.invoicesCreated).toBe(1);
    expect(runRow.finishedAt).not.toBeNull();
  });

  it("is idempotent: re-running for the same asOf bills NOTHING (anchor advanced, nothing due)", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-01") });
    await runBilling(new Date("2026-01-15"), f.user.id);
    const second = await runBilling(new Date("2026-01-15"), f.user.id);

    expect(second.invoicesCreated).toBe(0);
    expect(second.skippedAlreadyBilled).toBe(0); // nothing due anymore — nothing to skip
    expect(await prisma.invoice.count()).toBe(1); // the DB refused any duplicate
  });

  it("reports due-but-already-billed periods as 'skipped' (catch-up over partial history)", async () => {
    // Story: period 1 was billed BEFORE the anchor broke (real-world drift) —
    // the subscription is anchored at a due period that already has an invoice.
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-01") });
    const systemInvoice = await prisma.invoice.create({
      data: {
        number: "INV-2026-00001",
        customerId: f.customer.id,
        subscriptionId: f.subscription.id,
        issueDate: new Date("2026-01-01"),
        dueDate: new Date("2026-01-16"),
        status: "PAID",
        subtotal: 1559,
        taxTotal: 280.62,
        discountTotal: 0,
        grandTotal: 1839.62,
        amountPaid: 1839.62,
        periodStart: new Date("2026-01-01"), // collides with the anchored period
        periodEnd: new Date("2026-02-01"),
      },
    });
    void systemInvoice;

    const result = await runBilling(new Date("2026-01-15"), f.user.id);
    expect(result.invoicesCreated).toBe(0);
    expect(result.skippedAlreadyBilled).toBe(1); // visible idempotency for the demo
    expect(await prisma.invoice.count()).toBe(1);

    // and the anchor still advances past the already-billed period
    const sub = await prisma.subscription.findUniqueOrThrow({
      where: { id: f.subscription.id },
    });
    expect(sub.nextBillingDate).toEqual(new Date("2026-02-01"));
  });

  it("catches up every missed period — app down 3 months → 3 invoices, never skipped", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2025-08-15") });
    const result = await runBilling(new Date("2025-11-20"), f.user.id);

    expect(result.invoicesCreated).toBe(4); // Aug 15, Sep 15, Oct 15, Nov 15
    const periods = await prisma.invoice.findMany({
      orderBy: { periodStart: "asc" },
      select: { periodStart: true },
    });
    expect(periods.map((p) => p.periodStart.toISOString().slice(0, 10))).toEqual([
      "2025-08-15",
      "2025-09-15",
      "2025-10-15",
      "2025-11-15",
    ]);
    const sub = await prisma.subscription.findUniqueOrThrow({
      where: { id: f.subscription.id },
    });
    expect(sub.nextBillingDate).toEqual(new Date("2025-12-15"));
  });

  it("leaves not-due and paused subscriptions untouched", async () => {
    await seedSubscription({ nextBillingDate: new Date("2026-06-01") }); // future
    await seedSubscription({
      nextBillingDate: new Date("2026-01-01"),
      status: SubscriptionStatus.PAUSED,
    });
    const result = await runBilling(new Date("2026-01-15"));
    expect(result.invoicesCreated).toBe(0);
    expect(await prisma.invoice.count()).toBe(0);
  });

  it("serializes concurrent runs: no duplicates no matter how the race lands", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-01") });
    const [a, b] = await Promise.all([
      runBilling(new Date("2026-01-15"), f.user.id),
      runBilling(new Date("2026-01-15"), f.user.id),
    ]);
    // Either one wins the advisory lock, or both pass sequentially with the
    // unique constraint making the second a no-op. Invoices: exactly 1.
    expect(a.invoicesCreated + b.invoicesCreated).toBe(1);
    expect(await prisma.invoice.count()).toBe(1);
    expect([a.status, b.status]).toContain("DONE");
  });

  it("snapshots prices: catalog price changes after confirm never touch new invoices", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-01") });
    await prisma.product.update({
      where: { id: f.product.id },
      data: { salesPrice: 99999 }, // catalog price explodes AFTER subscription confirm
    });
    await runBilling(new Date("2026-01-15"), f.user.id);
    const invoice = await prisma.invoice.findFirstOrThrow({ include: { lines: true } });
    expect(invoice.lines[0].unitPrice.toString()).toBe("1559"); // frozen snapshot
  });

  it("auto-closes plans past expiry after their final invoice (FR-SUB-06) + history row", async () => {
    const f = await seedSubscription({
      nextBillingDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-01-31"), // inside first period [01-01, 02-01)
      autoClose: true,
    });
    await runBilling(new Date("2026-01-15"), f.user.id);

    const sub = await prisma.subscription.findUniqueOrThrow({
      where: { id: f.subscription.id },
    });
    expect(sub.status).toBe(SubscriptionStatus.CLOSED);
    expect(sub.nextBillingDate).toBeNull();

    const history = await prisma.subscriptionStatusHistory.findFirstOrThrow({
      where: { subscriptionId: sub.id },
    });
    expect(history.toStatus).toBe("CLOSED");
    expect(history.changedById).toBe(f.user.id);

    // and it never bills again
    const again = await runBilling(new Date("2026-02-15"), f.user.id);
    expect(again.invoicesCreated).toBe(0);
    expect(await prisma.invoice.count()).toBe(1);
  });

  it("clamps month-end anchors: Jan 31 monthly period ends Feb 28", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-31") });
    await runBilling(new Date("2026-01-31"), f.user.id);
    const invoice = await prisma.invoice.findFirstOrThrow();
    expect(invoice.periodEnd).toEqual(addPeriod(new Date("2026-01-31"), "MONTHLY"));
    expect(invoice.periodEnd).toEqual(new Date("2026-02-28"));
  });

  it("records amount math with Decimals, not floats (1559 × 18% = exactly 280.62)", async () => {
    const f = await seedSubscription({ nextBillingDate: new Date("2026-01-01") });
    await runBilling(new Date("2026-01-15"), f.user.id);
    const invoice = await prisma.invoice.findFirstOrThrow();
    expect(new Prisma.Decimal(invoice.taxTotal).toFixed(2)).toBe("280.62");
    expect(
      new Prisma.Decimal(invoice.subtotal)
        .add(invoice.taxTotal)
        .sub(invoice.discountTotal)
        .toFixed(2),
    ).toBe(new Prisma.Decimal(invoice.grandTotal).toFixed(2));
  });
});
