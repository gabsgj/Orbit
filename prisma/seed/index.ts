/**
 * Orbit — demo seed (v2). This is the dataset the judges see; it tells the
 * full Brightloop story: two customers (Acme Stores, Globex Logistics) across
 * every lifecycle state — DRAFT, QUOTATION, CONFIRMED, ACTIVE (one due TODAY,
 * one catch-up due 2 months ago), PAUSED and CLOSED — plus one PAID and one
 * OVERDUE historical invoice so the dashboard has data before any billing run.
 *
 * The 10k-subscription VOLUME generator is a separate Phase-3 script
 * (prisma/seed/volume.ts) — this file stays small and readable.
 *
 * Idempotent: opens with one TRUNCATE … RESTART IDENTITY CASCADE, so
 * `npm run db:seed` can be re-run any number of times.
 *
 * Passwords (dev only, documented in README): all meet the policy (>8, upper,
 * lower, special). Admin: Admin@Orbit1 · Staff: Staff@Orbit1 · Customers: Cust@Orbit1
 */
import {
  PrismaClient,
  Period,
  Role,
  SubscriptionStatus,
  InvoiceStatus,
  InvoiceLineKind,
  DiscountKind,
  DiscountScope,
  PaymentMethod,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_LOGINS } from "../../src/shared/lib/demo";

const prisma = new PrismaClient();

const daysFromNow = (days: number, from: Date = new Date()): Date => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};

const monthsFromNow = (months: number): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

async function main() {
  console.log("🌱 Seeding Orbit demo data (seed v2 — the Brightloop story)…");

  // ── 0. Wipe everything (every table, quoted, FK-safe, restart identity) ──
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "users",
      "customers",
      "password_reset_tokens",
      "products",
      "attributes",
      "attribute_values",
      "product_variants",
      "plans",
      "taxes",
      "quotation_templates",
      "quotation_template_lines",
      "subscriptions",
      "subscription_lines",
      "subscription_line_taxes",
      "subscription_status_history",
      "discount_rules",
      "discount_rule_products",
      "discount_usages",
      "invoices",
      "invoice_lines",
      "payments",
      "billing_runs",
      "sequences",
      "email_outbox",
      "audit_log"
    RESTART IDENTITY CASCADE
  `);

  // ── 1. Users + customers (bcrypt 10 rounds, lowercase emails) ────────────
  // Credentials come from src/shared/lib/demo.ts — the SINGLE source of truth
  // that also drives the UI's DemoCredentials card. Nothing is duplicated.
  const [adminLogin, staffLogin, acmeLogin] = DEMO_LOGINS;
  const [adminHash, staffHash, custHash] = await Promise.all([
    bcrypt.hash(adminLogin!.password, 10),
    bcrypt.hash(staffLogin!.password, 10),
    bcrypt.hash(acmeLogin!.password, 10),
  ]);

  const admin = await prisma.user.create({
    data: { email: adminLogin!.email, passwordHash: adminHash, role: Role.ADMIN },
  });
  const staff = await prisma.user.create({
    data: { email: staffLogin!.email, passwordHash: staffHash, role: Role.STAFF },
  });
  const acmeUser = await prisma.user.create({
    data: { email: acmeLogin!.email, passwordHash: custHash, role: Role.CUSTOMER },
  });
  const globexUser = await prisma.user.create({
    data: { email: "customer@globex.test", passwordHash: custHash, role: Role.CUSTOMER },
  });
  const acme = await prisma.customer.create({
    data: {
      userId: acmeUser.id,
      companyName: "Acme Stores Pvt Ltd",
      billingAddress: "MG Road, Kochi, Kerala 682001",
      taxId: "32AACCA1234F1Z5",
    },
  });
  const globex = await prisma.customer.create({
    data: {
      userId: globexUser.id,
      companyName: "Globex Logistics Pvt Ltd",
      billingAddress: "Infopark Campus, Kakkanad, Kochi 682030",
      taxId: "32AAGCG5678K1Z2",
    },
  });

  // ── 2. Attributes: Brand{Generic, Odoo}, Edition{Standard} ───────────────
  const brand = await prisma.attribute.create({ data: { name: "Brand" } });
  const edition = await prisma.attribute.create({ data: { name: "Edition" } });
  const [generic, odoo] = await Promise.all(
    ["Generic", "Odoo"].map((value) =>
      prisma.attributeValue.create({ data: { attributeId: brand.id, value } }),
    ),
  );
  const standard = await prisma.attributeValue.create({
    data: { attributeId: edition.id, value: "Standard" },
  });

  // ── 3. Products + variants ───────────────────────────────────────────────
  const crm = await prisma.product.create({
    data: {
      name: "Brightloop CRM",
      type: "service",
      salesPrice: 999,
      costPrice: 320,
      notes: "Core CRM subscription, per seat.",
    },
  });
  const analytics = await prisma.product.create({
    data: {
      name: "Brightloop Analytics",
      type: "service",
      salesPrice: 499,
      costPrice: 150,
      notes: "Reporting & dashboards add-on, per workspace.",
    },
  });
  const crmGeneric = await prisma.productVariant.create({
    data: { productId: crm.id, attributeValueId: generic.id, priceExtra: 0 },
  });
  const crmOdoo = await prisma.productVariant.create({
    data: { productId: crm.id, attributeValueId: odoo.id, priceExtra: 560 },
  });
  const analyticsStandard = await prisma.productVariant.create({
    data: { productId: analytics.id, attributeValueId: standard.id, priceExtra: 0 },
  });

  // ── 4. Plans (window: −60d … +365d) ──────────────────────────────────────
  const crmMonthly = await prisma.plan.create({
    data: {
      productId: crm.id,
      price: 999,
      period: Period.MONTHLY,
      minQuantity: 1,
      availableFrom: daysFromNow(-60),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
    },
  });
  const crmYearly = await prisma.plan.create({
    data: {
      productId: crm.id,
      price: 9999,
      period: Period.YEARLY,
      minQuantity: 1,
      availableFrom: daysFromNow(-60),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: false,
      pausable: false,
      renewable: true,
    },
  });
  const analyticsWeekly = await prisma.plan.create({
    data: {
      productId: analytics.id,
      price: 499,
      period: Period.WEEKLY,
      minQuantity: 1,
      availableFrom: daysFromNow(-60),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: false,
      pausable: true,
      renewable: false,
    },
  });

  // ── 5. Taxes ─────────────────────────────────────────────────────────────
  const gst18 = await prisma.tax.create({ data: { name: "GST 18%", ratePercent: 18 } });
  const gst5 = await prisma.tax.create({ data: { name: "GST 5%", ratePercent: 5 } });

  // ── 6. Quotation templates ───────────────────────────────────────────────
  const stdMonthlyOdoo = await prisma.quotationTemplate.create({
    data: {
      name: "Standard Monthly — Odoo Brand",
      planId: crmMonthly.id,
      validityDays: 15,
      lines: {
        create: [{ variantId: crmOdoo.id, quantity: 1, unitPrice: 1559 }], // 999 + 560
      },
    },
  });
  const enterpriseYearly = await prisma.quotationTemplate.create({
    data: {
      name: "Enterprise Yearly",
      planId: crmYearly.id,
      validityDays: 30,
      lines: {
        create: [{ variantId: crmOdoo.id, quantity: 5, unitPrice: 1559 }],
      },
    },
  });

  // ── 7. Discount rules (no usages wired) ──────────────────────────────────
  await prisma.discountRule.create({
    data: {
      name: "SEAT10",
      kind: DiscountKind.PERCENT,
      value: 10,
      minQuantity: 5,
      usageLimit: 2,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: daysFromNow(-30),
      endDate: daysFromNow(90),
    },
  });
  await prisma.discountRule.create({
    data: {
      name: "LAUNCH200",
      kind: DiscountKind.FIXED,
      value: 200,
      usageLimit: null, // unlimited
      scope: DiscountScope.PRODUCT,
      startDate: daysFromNow(-10),
      endDate: daysFromNow(30),
      products: { create: [{ productId: crm.id }] },
    },
  });

  // ── 8. Subscriptions (SUB-2026-00001..7, staff-authored status history) ──
  const sub1 = await prisma.subscription.create({
    data: {
      number: "SUB-2026-00001",
      customerId: acme.id,
      planId: crmMonthly.id,
      templateId: stdMonthlyOdoo.id,
      startDate: monthsFromNow(-3),
      expiryDate: monthsFromNow(9),
      paymentTermsDays: 15,
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: daysFromNow(0), // due TODAY → billing run invoices it live
      lines: {
        create: [
          {
            variantId: crmOdoo.id,
            quantity: 1,
            unitPrice: 1559,
            taxes: { create: [{ taxId: gst18.id }] },
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: "DRAFT", toStatus: "QUOTATION", changedById: staff.id },
          { fromStatus: "QUOTATION", toStatus: "CONFIRMED", changedById: staff.id },
          { fromStatus: "CONFIRMED", toStatus: "ACTIVE", changedById: staff.id },
        ],
      },
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      number: "SUB-2026-00002",
      customerId: globex.id,
      planId: crmMonthly.id,
      startDate: monthsFromNow(-4),
      expiryDate: monthsFromNow(8),
      paymentTermsDays: 15,
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: monthsFromNow(-2), // catch-up demo: 2 periods overdue
      lines: {
        create: [
          {
            variantId: crmGeneric.id,
            quantity: 3,
            unitPrice: 999,
            taxes: { create: [{ taxId: gst18.id }] },
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: "DRAFT", toStatus: "QUOTATION", changedById: staff.id },
          { fromStatus: "QUOTATION", toStatus: "CONFIRMED", changedById: staff.id },
          { fromStatus: "CONFIRMED", toStatus: "ACTIVE", changedById: staff.id },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      number: "SUB-2026-00003",
      customerId: acme.id,
      planId: analyticsWeekly.id,
      startDate: daysFromNow(-14),
      expiryDate: monthsFromNow(12),
      paymentTermsDays: 15,
      status: SubscriptionStatus.CONFIRMED,
      nextBillingDate: daysFromNow(7),
      lines: {
        create: [
          {
            variantId: analyticsStandard.id,
            quantity: 1,
            unitPrice: 499,
            taxes: { create: [{ taxId: gst5.id }] },
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: "DRAFT", toStatus: "QUOTATION", changedById: staff.id },
          { fromStatus: "QUOTATION", toStatus: "CONFIRMED", changedById: staff.id },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      number: "SUB-2026-00004",
      customerId: globex.id,
      planId: crmYearly.id,
      templateId: enterpriseYearly.id,
      startDate: daysFromNow(0),
      expiryDate: monthsFromNow(12),
      paymentTermsDays: 15,
      status: SubscriptionStatus.QUOTATION,
      nextBillingDate: null,
      lines: {
        create: [
          {
            variantId: crmOdoo.id,
            quantity: 5,
            unitPrice: 1559,
            taxes: { create: [{ taxId: gst18.id }] },
          },
        ],
      },
      statusHistory: {
        create: [{ fromStatus: "DRAFT", toStatus: "QUOTATION", changedById: staff.id }],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      number: "SUB-2026-00005",
      customerId: acme.id,
      planId: crmMonthly.id,
      startDate: daysFromNow(0),
      expiryDate: monthsFromNow(12),
      paymentTermsDays: 15,
      status: SubscriptionStatus.DRAFT,
      nextBillingDate: null,
      lines: {
        create: [
          {
            variantId: crmGeneric.id,
            quantity: 1,
            unitPrice: 999,
            taxes: { create: [{ taxId: gst18.id }] },
          },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      number: "SUB-2026-00006",
      customerId: globex.id,
      planId: analyticsWeekly.id,
      startDate: daysFromNow(-40),
      expiryDate: monthsFromNow(10),
      paymentTermsDays: 15,
      status: SubscriptionStatus.PAUSED,
      pausedOn: daysFromNow(-5),
      nextBillingDate: daysFromNow(10),
      lines: {
        create: [
          {
            variantId: analyticsStandard.id,
            quantity: 1,
            unitPrice: 499,
            taxes: { create: [{ taxId: gst5.id }] },
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: "DRAFT", toStatus: "QUOTATION", changedById: staff.id },
          { fromStatus: "QUOTATION", toStatus: "CONFIRMED", changedById: staff.id },
          { fromStatus: "CONFIRMED", toStatus: "ACTIVE", changedById: staff.id },
          { fromStatus: "ACTIVE", toStatus: "PAUSED", changedById: staff.id },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      number: "SUB-2026-00007",
      customerId: acme.id,
      planId: crmYearly.id,
      startDate: monthsFromNow(-14),
      expiryDate: monthsFromNow(-2),
      paymentTermsDays: 15,
      status: SubscriptionStatus.CLOSED,
      nextBillingDate: null,
      lines: {
        create: [
          {
            variantId: crmGeneric.id,
            quantity: 2,
            unitPrice: 9999,
            taxes: { create: [{ taxId: gst18.id }] },
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: "DRAFT", toStatus: "QUOTATION", changedById: staff.id },
          { fromStatus: "QUOTATION", toStatus: "CONFIRMED", changedById: staff.id },
          { fromStatus: "CONFIRMED", toStatus: "ACTIVE", changedById: staff.id },
          { fromStatus: "ACTIVE", toStatus: "CLOSED", changedById: staff.id },
        ],
      },
    },
  });

  // ── 9. Historical invoices (dashboard/overdue data before any billing run) ─
  const inv1Issue = monthsFromNow(-2);
  await prisma.invoice.create({
    data: {
      number: "INV-2026-00001",
      customerId: globex.id,
      subscriptionId: sub2.id,
      issueDate: inv1Issue,
      dueDate: daysFromNow(15, inv1Issue),
      status: InvoiceStatus.PAID,
      subtotal: 2997, // 3 × 999
      taxTotal: 539.46, // 18%
      discountTotal: 0,
      grandTotal: 3536.46,
      amountPaid: 3536.46,
      periodStart: monthsFromNow(-3),
      periodEnd: monthsFromNow(-2),
      lines: {
        create: [
          {
            variantId: crmGeneric.id,
            kind: InvoiceLineKind.PRODUCT,
            description: "Brightloop CRM (Generic) — 3 seats, monthly",
            quantity: 3,
            unitPrice: 999,
            taxAmount: 539.46,
            lineTotal: 2997,
          },
        ],
      },
      payments: {
        create: [
          {
            method: PaymentMethod.UPI,
            amount: 3536.46,
            paidAt: daysFromNow(10, inv1Issue),
            note: "UPI ref 92837461",
            recordedById: staff.id,
          },
        ],
      },
    },
  });

  const inv2Issue = daysFromNow(-25);
  await prisma.invoice.create({
    data: {
      number: "INV-2026-00002",
      customerId: acme.id,
      subscriptionId: sub1.id,
      issueDate: inv2Issue,
      dueDate: daysFromNow(-10), // past → shows as OVERDUE on the dashboard
      status: InvoiceStatus.CONFIRMED,
      subtotal: 1559, // 1 × 1559
      taxTotal: 280.62, // 18%
      discountTotal: 0,
      grandTotal: 1839.62,
      amountPaid: 0,
      periodStart: monthsFromNow(-1),
      periodEnd: daysFromNow(0),
      lines: {
        create: [
          {
            variantId: crmOdoo.id,
            kind: InvoiceLineKind.PRODUCT,
            description: "Brightloop CRM (Odoo) — 1 seat, monthly",
            quantity: 1,
            unitPrice: 1559,
            taxAmount: 280.62,
            lineTotal: 1559,
          },
        ],
      },
    },
  });

  // ── 10. Sequences (numbering continues from seed values) ─────────────────
  await prisma.sequence.createMany({
    data: [
      { docType: "SUB", year: 2026, lastNumber: 7 },
      { docType: "INV", year: 2026, lastNumber: 2 },
    ],
  });

  // ── 11. Summary ──────────────────────────────────────────────────────────
  console.log("✅ Seed v2 complete:");
  console.log("   users:       4 (admin@orbit.local · staff@orbit.local · customer@acme.test · customer@globex.test)");
  console.log("   customers:   2 (Acme Stores Pvt Ltd · Globex Logistics Pvt Ltd)");
  console.log("   attributes:  2 (Brand{Generic, Odoo} · Edition{Standard})");
  console.log("   products:    2 (Brightloop CRM ₹999 · Brightloop Analytics ₹499)");
  console.log("   variants:    3 (CRM Generic +₹0 · CRM Odoo +₹560 · Analytics Standard +₹0)");
  console.log("   plans:       3 (CRM Pro Monthly ₹999 · CRM Pro Yearly ₹9999 · Analytics Weekly ₹499)");
  console.log("   taxes:       2 (GST 18% · GST 5%)");
  console.log("   templates:   2 (Standard Monthly — Odoo Brand · Enterprise Yearly)");
  console.log("   discounts:   2 (SEAT10 −10% ≥5 seats · LAUNCH200 −₹200 on CRM)");
  console.log("   subscriptions: 7 (SUB-2026-00001..7 — 2 ACTIVE · CONFIRMED · QUOTATION · DRAFT · PAUSED · CLOSED)");
  console.log("   invoices:    2 (INV-2026-00001 PAID ₹3536.46 · INV-2026-00002 OVERDUE ₹1839.62)");
  console.log("   payments:    1 (UPI ref 92837461, recorded by staff)");
  console.log("   sequences:   SUB/2026 → 7 · INV/2026 → 2");
  console.log("   demo hooks:  sub 00001 due TODAY · sub 00002 catch-up due 2 months ago");
  void admin;
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
