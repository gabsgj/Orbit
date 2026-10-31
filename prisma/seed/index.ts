/**
 * Orbit — minimal demo seed (Phase 0).
 * Creates: 1 admin, 1 staff, 1 customer; a demo product with an "Odoo" variant
 * (+560); a monthly plan; GST 18%; a quotation template; one ACTIVE subscription
 * due TODAY so the billing engine has something to invoice on first run.
 *
 * The 10k-subscription VOLUME generator is a separate Phase-3 script
 * (prisma/seed/volume.ts) — this file stays small and readable.
 *
 * Passwords (dev only, documented in README): all meet the policy (>8, upper,
 * lower, special). Admin: Admin@Orbit1 · Staff: Staff@Orbit1 · Customer: Cust@Orbit1
 */
import { PrismaClient, Period, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

async function main() {
  console.log("🌱 Seeding Orbit demo data…");

  // ── Users ────────────────────────────────────────────────────────────────
  const [adminHash, staffHash, custHash] = await Promise.all([
    bcrypt.hash("Admin@Orbit1", 10),
    bcrypt.hash("Staff@Orbit1", 10),
    bcrypt.hash("Cust@Orbit1", 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@orbit.local" },
    update: {},
    create: { email: "admin@orbit.local", passwordHash: adminHash, role: "ADMIN" },
  });
  const staff = await prisma.user.upsert({
    where: { email: "staff@orbit.local" },
    update: {},
    create: { email: "staff@orbit.local", passwordHash: staffHash, role: "STAFF" },
  });
  const custUser = await prisma.user.upsert({
    where: { email: "customer@acme.test" },
    update: {},
    create: { email: "customer@acme.test", passwordHash: custHash, role: "CUSTOMER" },
  });
  const customer = await prisma.customer.upsert({
    where: { userId: custUser.id },
    update: {},
    create: {
      userId: custUser.id,
      companyName: "Acme Stores Pvt Ltd",
      billingAddress: "MG Road, Kochi, Kerala 682001",
    },
  });

  // ── Catalog: product + Brand attribute + Odoo variant (+560) ─────────────
  const brand = await prisma.attribute.upsert({
    where: { name: "Brand" },
    update: {},
    create: { name: "Brand" },
  });
  const [generic, odoo] = await Promise.all(
    ["Generic", "Odoo"].map((value) =>
      prisma.attributeValue.upsert({
        where: { attributeId_value: { attributeId: brand.id, value } },
        update: {},
        create: { attributeId: brand.id, value },
      }),
    ),
  );

  const product = await prisma.product.create({
    data: {
      name: "Brightloop CRM",
      type: "service",
      salesPrice: 999,
      costPrice: 320,
      notes: "Core CRM subscription, per seat.",
    },
  });
  const odooVariant = await prisma.productVariant.create({
    data: { productId: product.id, attributeValueId: odoo.id, priceExtra: 560 },
  });
  await prisma.productVariant.create({
    data: { productId: product.id, attributeValueId: generic.id, priceExtra: 0 },
  });

  // ── Plan ─────────────────────────────────────────────────────────────────
  const plan = await prisma.plan.create({
    data: {
      productId: product.id,
      price: 999,
      period: Period.MONTHLY,
      minQuantity: 1,
      availableFrom: daysFromNow(-30),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
    },
  });

  // ── Tax ──────────────────────────────────────────────────────────────────
  const gst = await prisma.tax.create({
    data: { name: "GST 18%", ratePercent: 18 },
  });

  // ── Quotation template ───────────────────────────────────────────────────
  const template = await prisma.quotationTemplate.create({
    data: {
      name: "Standard Monthly — Odoo Brand",
      planId: plan.id,
      validityDays: 15,
      lines: {
        create: [{ variantId: odooVariant.id, quantity: 1, unitPrice: 1559 }], // 999 + 560
      },
    },
  });

  // ── One ACTIVE subscription due TODAY (billing demo fuel) ────────────────
  await prisma.subscription.create({
    data: {
      number: "SUB-2026-00001",
      customerId: customer.id,
      planId: plan.id,
      templateId: template.id,
      startDate: daysFromNow(-30),
      expiryDate: daysFromNow(335),
      paymentTermsDays: 15,
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: daysFromNow(0), // due today → billing run invoices it
      lines: {
        create: [
          {
            variantId: odooVariant.id,
            quantity: 1,
            unitPrice: 1559,
            taxes: { create: [{ taxId: gst.id }] },
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

  // ── Sequences (so numbering continues from seed values) ──────────────────
  await prisma.sequence.createMany({
    data: [
      { docType: "SUB", year: 2026, lastNumber: 1 },
      { docType: "INV", year: 2026, lastNumber: 0 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete:");
  console.log(`   users:     admin@orbit.local · staff@orbit.local · customer@acme.test`);
  console.log(`   catalog:   ${product.name} (Odoo +₹560) · plan ${plan.period} ₹999 · GST 18%`);
  console.log(`   demo sub:  SUB-2026-00001 ACTIVE, due today`);
  void admin;
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
