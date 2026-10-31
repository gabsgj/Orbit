import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient, Period, SubscriptionStatus, InvoiceStatus } from "@prisma/client";
import { kpis, mrr, aging, renewals } from "./service";

/**
 * Dashboard service tests — real DB (orbit_test) with in-file fixtures,
 * same pattern as src/modules/billing/service.test.ts.
 *
 * Seed data:
 *   - 2 ACTIVE subscriptions (monthly 1559×1, yearly 9999×5)
 *   - 1 CONFIRMED invoice overdue by 45 days (owed)
 *   - 1 PAID invoice with payment recorded this month
 *
 * Verifies: KPI counts, MRR math, aging bucket placement, renewal forecast.
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

// ── Fixture helpers ──────────────────────────────────────────────────────────

async function seedBase() {
  const adminUser = await prisma.user.create({
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
  const attribute = await prisma.attribute.create({
    data: { name: `Brand-${crypto.randomUUID()}` },
  });
  const attributeValue = await prisma.attributeValue.create({
    data: { attributeId: attribute.id, value: "Odoo" },
  });
  const product = await prisma.product.create({
    data: {
      name: "Brightloop CRM",
      type: "service",
      salesPrice: 999,
      costPrice: 320,
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      attributeValueId: attributeValue.id,
      priceExtra: 560,
    },
  });
  return { adminUser, customer, product, variant };
}

async function seedSubscription(opts: {
  customerId: string;
  variantId: string;
  planPrice: string;
  period: Period;
  unitPrice: string;
  quantity: number;
  nextBillingDate?: Date;
  status?: SubscriptionStatus;
}) {
  const plan = await prisma.plan.create({
    data: {
      productId: (
        await prisma.productVariant.findUniqueOrThrow({
          where: { id: opts.variantId },
          select: { productId: true },
        })
      ).productId,
      price: opts.planPrice,
      period: opts.period,
      minQuantity: 1,
      availableFrom: new Date("2025-01-01"),
      availableTo: new Date("2030-12-31"),
    },
  });
  return prisma.subscription.create({
    data: {
      number: `SUB-TEST-${crypto.randomUUID().slice(0, 8)}`,
      customerId: opts.customerId,
      planId: plan.id,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2030-01-01"),
      paymentTermsDays: 15,
      status: opts.status ?? SubscriptionStatus.ACTIVE,
      nextBillingDate: opts.nextBillingDate ?? new Date("2026-06-01"),
      lines: {
        create: [
          {
            variantId: opts.variantId,
            quantity: opts.quantity,
            unitPrice: opts.unitPrice,
          },
        ],
      },
    },
  });
}

/** The "as of" date used across tests: mid-June 2026. */
const AS_OF = new Date("2026-06-15");

async function seedAll() {
  const base = await seedBase();

  // Sub 1: monthly plan, 1559 × 1
  const sub1 = await seedSubscription({
    customerId: base.customer.id,
    variantId: base.variant.id,
    planPrice: "1559",
    period: Period.MONTHLY,
    unitPrice: "1559",
    quantity: 1,
    nextBillingDate: new Date("2026-07-01"),
  });

  // Sub 2: yearly plan, 9999 × 5
  const sub2 = await seedSubscription({
    customerId: base.customer.id,
    variantId: base.variant.id,
    planPrice: "9999",
    period: Period.YEARLY,
    unitPrice: "9999",
    quantity: 5,
    nextBillingDate: new Date("2026-07-01"),
  });

  // Invoice 1: CONFIRMED, overdue by 45 days (due 2026-05-01, asOf=2026-06-15)
  const overdueInvoice = await prisma.invoice.create({
    data: {
      number: "INV-2026-00001",
      customerId: base.customer.id,
      subscriptionId: sub1.id,
      issueDate: new Date("2026-04-16"),
      dueDate: new Date("2026-05-01"), // 45 days before AS_OF
      status: InvoiceStatus.CONFIRMED,
      subtotal: 1559,
      taxTotal: 280.62,
      discountTotal: 0,
      grandTotal: 1839.62,
      amountPaid: 0,
      periodStart: new Date("2026-04-16"),
      periodEnd: new Date("2026-05-16"),
    },
  });

  // Invoice 2: PAID, payment in June 2026 (same month as AS_OF)
  const paidInvoice = await prisma.invoice.create({
    data: {
      number: "INV-2026-00002",
      customerId: base.customer.id,
      subscriptionId: sub2.id,
      issueDate: new Date("2026-06-01"),
      dueDate: new Date("2026-06-16"),
      status: InvoiceStatus.PAID,
      subtotal: 49995,
      taxTotal: 8999.1,
      discountTotal: 0,
      grandTotal: 58994.1,
      amountPaid: 58994.1,
      periodStart: new Date("2026-06-01"),
      periodEnd: new Date("2027-06-01"),
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: paidInvoice.id,
      method: "BANK_TRANSFER",
      amount: 58994.1,
      paidAt: new Date("2026-06-10T12:00:00Z"), // June 2026 — same month as AS_OF
      recordedById: base.adminUser.id,
    },
  });

  return { ...base, sub1, sub2, overdueInvoice, paidInvoice };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("dashboard service", () => {
  describe("kpis (FR-DASH-01)", () => {
    it("returns correct active subscriptions, revenue received, amount owed, overdue count", async () => {
      await seedAll();
      const result = await kpis(prisma, AS_OF);

      expect(result.activeSubscriptions).toBe(2);

      // Revenue received: only the June payment (58994.10)
      expect(result.revenueReceived).toBe("58994.10");

      // Amount owed: only the CONFIRMED overdue invoice (1839.62)
      expect(result.amountOwed).toBe("1839.62");

      // Overdue: 1 CONFIRMED invoice with due_date < AS_OF and outstanding > 0
      expect(result.overdueInvoices).toBe(1);
    });

    it("returns zeros on an empty database", async () => {
      const result = await kpis(prisma, AS_OF);
      expect(result.activeSubscriptions).toBe(0);
      expect(result.revenueReceived).toBe("0.00");
      expect(result.amountOwed).toBe("0.00");
      expect(result.overdueInvoices).toBe(0);
    });
  });

  describe("mrr (FR-DASH-03, SRS §6 rule 7)", () => {
    it("computes MRR as Σ normalized monthly values of ACTIVE subscription lines", async () => {
      await seedAll();
      const result = await mrr(prisma);

      // monthly: 1559 × 1 × 1 = 1559.00
      // yearly:  9999 × 5 × (1/12) = 49995/12 = 4166.25
      // MRR = 1559 + 4166.25 = 5725.25
      expect(result.mrr).toBe("5725.25");

      // ARR = MRR × 12 = 68703.00
      expect(result.arr).toBe("68703.00");
    });

    it("returns zero MRR on an empty database", async () => {
      const result = await mrr(prisma);
      expect(result.mrr).toBe("0.00");
      expect(result.arr).toBe("0.00");
    });
  });

  describe("aging (FR-PAY-05)", () => {
    it("places the 45-day-overdue invoice in the 31-60 bucket", async () => {
      await seedAll();
      const buckets = await aging(prisma, AS_OF);

      // Should have exactly 5 buckets in canonical order
      expect(buckets).toHaveLength(5);
      expect(buckets.map((b) => b.bucket)).toEqual([
        "current",
        "1-30",
        "31-60",
        "61-90",
        "90+",
      ]);

      // The overdue invoice (due 2026-05-01, asOf 2026-06-15 → 45 days) → 31-60
      const bucket3160 = buckets.find((b) => b.bucket === "31-60")!;
      expect(bucket3160.count).toBe(1);
      expect(bucket3160.total).toBe("1839.62");

      // All other buckets empty
      expect(buckets.find((b) => b.bucket === "current")!.count).toBe(0);
      expect(buckets.find((b) => b.bucket === "1-30")!.count).toBe(0);
      expect(buckets.find((b) => b.bucket === "61-90")!.count).toBe(0);
      expect(buckets.find((b) => b.bucket === "90+")!.count).toBe(0);
    });

    it("returns all-empty buckets on an empty database", async () => {
      const buckets = await aging(prisma, AS_OF);
      expect(buckets).toHaveLength(5);
      for (const b of buckets) {
        expect(b.count).toBe(0);
        expect(b.total).toBe("0.00");
      }
    });
  });

  describe("renewals (FR-DASH-05)", () => {
    it("returns upcoming renewals grouped by week within the lookahead window", async () => {
      await seedAll();
      const result = await renewals(prisma, AS_OF, 30);

      // Both subs renew on 2026-07-01 → within 30 days of 2026-06-15
      expect(result.length).toBeGreaterThanOrEqual(1);

      const totalCount = result.reduce((sum, r) => sum + r.count, 0);
      expect(totalCount).toBe(2);

      // Total should be the sum of monthly-normalized values
      const totalVal = result.reduce(
        (sum, r) => sum + parseFloat(r.total),
        0,
      );
      // 1559 + 9999*5/12 = 1559 + 4166.25 = 5725.25
      expect(totalVal).toBeCloseTo(5725.25, 2);
    });

    it("returns empty when no renewals are within the window", async () => {
      await seedAll();
      // Look ahead only 5 days — renewals are on 2026-07-01, 16 days out
      const result = await renewals(prisma, AS_OF, 5);
      expect(result).toHaveLength(0);
    });
  });
});
