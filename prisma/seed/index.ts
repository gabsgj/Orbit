/**
 * Orbit — demo seed (v3 — the rich Brightloop story). This is the dataset the
 * judges see; it makes every screen feel alive: 8 Kerala-flavoured customers,
 * 5 Brightloop products, 7 plans, 30 subscriptions across every lifecycle
 * state with start dates spread over the last 9 months (real MRR trajectory),
 * ~35 invoices hitting EVERY aging bucket, payments across all 5 methods,
 * staged outbox mail and audit rows.
 *
 * Demo hooks kept from v2:
 *   - SUB-2026-00001 = Acme, ACTIVE, monthly Odoo CRM, due TODAY (billing day).
 *   - SUB-2026-00002 = Globex, ACTIVE, catch-up due 2 months ago.
 *
 * The 10k-subscription VOLUME generator is a separate Phase-3 script
 * (prisma/seed/volume.ts) — this file stays curated and readable.
 *
 * Idempotent: opens with one TRUNCATE … RESTART IDENTITY CASCADE, so
 * `npm run db:seed` can be re-run any number of times.
 *
 * Passwords (dev only, documented in README): all meet the policy (>8, upper,
 * lower, special). Admin: Admin@Orbit1 · Staff/Priya: Staff@Orbit1 · all
 * customer logins: Cust@Orbit1 (one bcrypt hash computed ONCE and reused).
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
  OutboxKind,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_LOGINS } from "../../src/shared/lib/demo";

const prisma = new PrismaClient();

// ── Date helpers ─────────────────────────────────────────────────────────────
const daysFromNow = (days: number, from: Date = new Date()): Date => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};

const monthsFromNow = (months: number, from: Date = new Date()): Date => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addMonths = monthsFromNow;
const addDays = daysFromNow;

const dec2 = (n: number): number => Math.round(n * 100) / 100;

async function main() {
  console.log("🌱 Seeding Orbit demo data (seed v3 — the rich Brightloop story)…");

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

  // ── 1. Users (bcrypt 10 rounds, lowercase emails) ────────────────────────
  // Credentials come from src/shared/lib/demo.ts — the SINGLE source of truth
  // that also drives the UI's DemoCredentials card. The customer hash is
  // computed ONCE and reused for all 8 customer logins.
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
  const priya = await prisma.user.create({
    data: { email: "priya@orbit.local", passwordHash: staffHash, role: Role.STAFF },
  });

  // ── 2. Customers: 8 companies, each with its own CUSTOMER login ──────────
  const acmeUser = await prisma.user.create({
    data: { email: acmeLogin!.email, passwordHash: custHash, role: Role.CUSTOMER },
  });
  const acme = await prisma.customer.create({
    data: {
      userId: acmeUser.id,
      companyName: "Acme Stores Pvt Ltd",
      billingAddress: "MG Road, Kochi, Kerala 682001",
      taxId: "32AACCA1234F1Z5",
    },
  });

  const customerSpecs = [
    {
      email: "arjun@globex.test",
      companyName: "Globex Logistics Pvt Ltd",
      billingAddress: "Infopark Campus, Kakkanad, Kochi 682030",
      taxId: "32AAGCG5678K1Z2",
    },
    {
      email: "meera@nimbushealth.test",
      companyName: "Nimbus Health Care LLP",
      billingAddress: "Lissy Hospital Road, Kaloor, Kochi 682017",
      taxId: "32AAKFN2211Q1Z8",
    },
    {
      email: "saraswathi@kaveri.test",
      companyName: "Kaveri Textiles & Silks",
      billingAddress: "Mahatma Gandhi Road, Thrissur, Kerala 680001",
      taxId: "32AAJFK8845M1Z3",
    },
    {
      email: "thomas@pinnacleedu.test",
      companyName: "Pinnacle Edu Academy",
      billingAddress: "Palarivattom Junction, Kochi 682025",
      taxId: "32AAHCP3302B1Z6",
    },
    {
      email: "lakshmi@seaside.test",
      companyName: "Seaside Resorts & Spas",
      billingAddress: "Beach Road, Kovalam, Thiruvananthapuram 695527",
      taxId: "32AALCS7620D1Z9",
    },
    {
      email: "varghese@fortress.test",
      companyName: "Fortress Security Services",
      billingAddress: "NH Bypass, Vyttila, Kochi 682019",
      taxId: "32AAECF9917R1Z4",
    },
    {
      email: "ananya@lumenmedia.test",
      companyName: "Lumen Media Works",
      billingAddress: "Panampilly Nagar, Kochi 682036",
      taxId: "32AAGCL4488T1Z1",
    },
  ] as const;

  const customers: Record<string, { id: string; companyName: string }> = {
    acme: { id: acme.id, companyName: acme.companyName },
  };
  for (const spec of customerSpecs) {
    const user = await prisma.user.create({
      data: { email: spec.email, passwordHash: custHash, role: Role.CUSTOMER },
    });
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        companyName: spec.companyName,
        billingAddress: spec.billingAddress,
        taxId: spec.taxId,
      },
    });
    customers[spec.email.split("@")[0]!] = {
      id: customer.id,
      companyName: customer.companyName,
    };
  }
  const globex = customers["arjun"]!;
  const nimbus = customers["meera"]!;
  const kaveri = customers["saraswathi"]!;
  const pinnacle = customers["thomas"]!;
  const seaside = customers["lakshmi"]!;
  const fortress = customers["varghese"]!;
  const lumen = customers["ananya"]!;

  // ── 3. Attributes: Brand{Generic, Odoo}, Edition{Standard, Pro, Enterprise} ─
  const brand = await prisma.attribute.create({ data: { name: "Brand" } });
  const edition = await prisma.attribute.create({ data: { name: "Edition" } });
  const [generic, odoo] = await Promise.all(
    ["Generic", "Odoo"].map((value) =>
      prisma.attributeValue.create({ data: { attributeId: brand.id, value } }),
    ),
  );
  const [standard, pro, enterprise] = await Promise.all(
    ["Standard", "Pro", "Enterprise"].map((value) =>
      prisma.attributeValue.create({ data: { attributeId: edition.id, value } }),
    ),
  );

  // ── 4. Products + variants (sensible subset per product) ─────────────────
  const crm = await prisma.product.create({
    data: {
      name: "Brightloop CRM",
      type: "service",
      salesPrice: 999,
      costPrice: 320,
      notes: "Core CRM subscription, per seat. The flagship.",
    },
  });
  const analytics = await prisma.product.create({
    data: {
      name: "Brightloop Analytics",
      type: "service",
      salesPrice: 1499,
      costPrice: 450,
      notes: "Reporting & dashboards workspace, per workspace.",
    },
  });
  const desk = await prisma.product.create({
    data: {
      name: "Brightloop Desk",
      type: "service",
      salesPrice: 699,
      costPrice: 210,
      notes: "Helpdesk & ticketing, per agent.",
    },
  });
  const vault = await prisma.product.create({
    data: {
      name: "Brightloop Vault",
      type: "service",
      salesPrice: 5999,
      costPrice: 1800,
      notes: "Secure document vault with e-sign, per org.",
    },
  });
  const pulse = await prisma.product.create({
    data: {
      name: "Brightloop Pulse",
      type: "service",
      salesPrice: 49,
      costPrice: 12,
      notes: "Daily uptime & status monitoring, per monitor.",
    },
  });

  // CRM carries Brand variants (Odoo brand carries the +₹560 premium).
  const crmGeneric = await prisma.productVariant.create({
    data: { productId: crm.id, attributeValueId: generic.id, priceExtra: 0 },
  });
  const crmOdoo = await prisma.productVariant.create({
    data: { productId: crm.id, attributeValueId: odoo.id, priceExtra: 560 },
  });
  // Every other product carries Edition variants (Pro +₹300, Enterprise +₹800).
  const analyticsStandard = await prisma.productVariant.create({
    data: { productId: analytics.id, attributeValueId: standard.id, priceExtra: 0 },
  });
  const analyticsPro = await prisma.productVariant.create({
    data: { productId: analytics.id, attributeValueId: pro.id, priceExtra: 300 },
  });
  const analyticsEnterprise = await prisma.productVariant.create({
    data: { productId: analytics.id, attributeValueId: enterprise.id, priceExtra: 800 },
  });
  const deskStandard = await prisma.productVariant.create({
    data: { productId: desk.id, attributeValueId: standard.id, priceExtra: 0 },
  });
  const deskPro = await prisma.productVariant.create({
    data: { productId: desk.id, attributeValueId: pro.id, priceExtra: 300 },
  });
  const deskEnterprise = await prisma.productVariant.create({
    data: { productId: desk.id, attributeValueId: enterprise.id, priceExtra: 800 },
  });
  const vaultStandard = await prisma.productVariant.create({
    data: { productId: vault.id, attributeValueId: standard.id, priceExtra: 0 },
  });
  const vaultPro = await prisma.productVariant.create({
    data: { productId: vault.id, attributeValueId: pro.id, priceExtra: 300 },
  });
  const vaultEnterprise = await prisma.productVariant.create({
    data: { productId: vault.id, attributeValueId: enterprise.id, priceExtra: 800 },
  });
  const pulseStandard = await prisma.productVariant.create({
    data: { productId: pulse.id, attributeValueId: standard.id, priceExtra: 0 },
  });
  const pulsePro = await prisma.productVariant.create({
    data: { productId: pulse.id, attributeValueId: pro.id, priceExtra: 300 },
  });

  // ── 5. Plans (window: −9mo … +365d so backdated subscriptions are valid) ──
  const crmMonthly = await prisma.plan.create({
    data: {
      productId: crm.id,
      price: 999,
      period: Period.MONTHLY,
      minQuantity: 1,
      availableFrom: monthsFromNow(-9),
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
      availableFrom: monthsFromNow(-9),
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
      availableFrom: monthsFromNow(-9),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: false,
    },
  });
  const analyticsMonthly = await prisma.plan.create({
    data: {
      productId: analytics.id,
      price: 1499,
      period: Period.MONTHLY,
      minQuantity: 1,
      availableFrom: monthsFromNow(-9),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
    },
  });
  const deskMonthly = await prisma.plan.create({
    data: {
      productId: desk.id,
      price: 699,
      period: Period.MONTHLY,
      minQuantity: 1,
      availableFrom: monthsFromNow(-9),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
    },
  });
  const vaultYearly = await prisma.plan.create({
    data: {
      productId: vault.id,
      price: 5999,
      period: Period.YEARLY,
      minQuantity: 1,
      availableFrom: monthsFromNow(-9),
      availableTo: daysFromNow(365),
      autoClose: true, // closes itself at expiry — the compliance story
      closableEarly: false,
      pausable: false,
      renewable: true,
    },
  });
  const pulseDaily = await prisma.plan.create({
    data: {
      productId: pulse.id,
      price: 49,
      period: Period.DAILY,
      minQuantity: 1,
      availableFrom: monthsFromNow(-9),
      availableTo: daysFromNow(365),
      autoClose: false,
      closableEarly: true,
      pausable: false,
      renewable: true,
    },
  });

  // ── 6. Taxes ─────────────────────────────────────────────────────────────
  const gst18 = await prisma.tax.create({ data: { name: "GST 18%", ratePercent: 18 } });
  const gst12 = await prisma.tax.create({ data: { name: "GST 12%", ratePercent: 12 } });
  const gst5 = await prisma.tax.create({ data: { name: "GST 5%", ratePercent: 5 } });

  // ── 7. Quotation templates (4 across plans, with lines + validity) ────────
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
        create: [{ variantId: crmOdoo.id, quantity: 5, unitPrice: 10559 }], // 9999 + 560
      },
    },
  });
  const analyticsProKickstart = await prisma.quotationTemplate.create({
    data: {
      name: "Analytics Pro Kickstart",
      planId: analyticsMonthly.id,
      validityDays: 21,
      lines: {
        create: [{ variantId: analyticsPro.id, quantity: 2, unitPrice: 1799 }], // 1499 + 300
      },
    },
  });
  const helpdeskLaunch = await prisma.quotationTemplate.create({
    data: {
      name: "Helpdesk Launch — 3 Agents",
      planId: deskMonthly.id,
      validityDays: 10,
      lines: {
        create: [{ variantId: deskStandard.id, quantity: 3, unitPrice: 699 }],
      },
    },
  });

  // ── 8. Discount rules (5 — one expired, must NOT apply) ──────────────────
  const seat10 = await prisma.discountRule.create({
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
  await prisma.discountRule.create({
    data: {
      name: "FESTIVE15",
      kind: DiscountKind.PERCENT,
      value: 15,
      minPurchase: 2000,
      usageLimit: 10,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: daysFromNow(-5),
      endDate: daysFromNow(60), // festive window: next 60 days
    },
  });
  await prisma.discountRule.create({
    data: {
      name: "OLDFRIEND",
      kind: DiscountKind.FIXED,
      value: 500,
      usageLimit: null,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: monthsFromNow(-6),
      endDate: monthsFromNow(-1), // EXPIRED last month → must never apply
    },
  });
  await prisma.discountRule.create({
    data: {
      name: "ENTERPRISE5",
      kind: DiscountKind.PERCENT,
      value: 5,
      minQuantity: 10,
      usageLimit: null,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: daysFromNow(-15),
      endDate: daysFromNow(180),
    },
  });

  // ── 9. Subscriptions (SUB-2026-00001..30 — the full lifecycle story) ─────
  // Start dates spread over the LAST 9 MONTHS so MRR trajectory & movement
  // curves are real; a couple created within the last 30 days for newMRR.
  // createdAt mirrors the moment the subscription entered the system.
  let subSeq = 0;
  const subNumber = () => `SUB-2026-${String(++subSeq).padStart(5, "0")}`;

  interface LineSpec {
    variantId: string;
    productName: string;
    variantLabel: string;
    unitLabel: string; // e.g. "seat", "workspace", "agent"
    quantity: number;
    unitPrice: number; // snapshot at confirm time
    taxIds: string[];
  }
  interface SubSpec {
    customerId: string;
    planId: string;
    templateId?: string;
    start: Date;
    expiry: Date;
    createdAt: Date;
    status: SubscriptionStatus;
    nextBilling: Date | null;
    pausedOn?: Date;
    paymentTermsDays?: number;
    lines: LineSpec[];
  }

  // The canonical status transition chain; PAUSED/CLOSED append their own hop.
  const chainFor = (status: SubscriptionStatus): Array<[SubscriptionStatus, SubscriptionStatus]> => {
    const chain: Array<[SubscriptionStatus, SubscriptionStatus]> = [
      ["DRAFT", "QUOTATION"],
      ["QUOTATION", "CONFIRMED"],
      ["CONFIRMED", "ACTIVE"],
    ];
    if (status === "QUOTATION") return chain.slice(0, 1);
    if (status === "CONFIRMED") return chain.slice(0, 2);
    if (status === "ACTIVE") return chain;
    if (status === "PAUSED") return [...chain, ["ACTIVE", "PAUSED"]];
    if (status === "CLOSED") return [...chain, ["ACTIVE", "CLOSED"]];
    return [];
  };

  const createdSubs: Array<{
    id: string;
    number: string;
    spec: SubSpec;
    companyName: string;
    period: Period;
  }> = [];

  async function createSub(spec: SubSpec, forcedNumber?: string) {
    const number = forcedNumber ?? subNumber();
    const companyName =
      spec.customerId === acme.id
        ? acme.companyName
        : (Object.values(customers) as Array<{ id: string; companyName: string }>).find(
            (c) => c.id === spec.customerId,
          )?.companyName ?? "?";
    const sub = await prisma.subscription.create({
      data: {
        number,
        customerId: spec.customerId,
        planId: spec.planId,
        templateId: spec.templateId ?? null,
        startDate: spec.start,
        expiryDate: spec.expiry,
        paymentTermsDays: spec.paymentTermsDays ?? 15,
        status: spec.status,
        nextBillingDate: spec.nextBilling,
        pausedOn: spec.pausedOn ?? null,
        createdAt: spec.createdAt,
        lines: {
          create: spec.lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxes: { create: l.taxIds.map((taxId) => ({ taxId })) },
          })),
        },
        statusHistory: {
          create: chainFor(spec.status).map(([fromStatus, toStatus], i) => ({
            fromStatus,
            toStatus,
            changedById: i % 2 === 0 ? staff.id : priya.id,
            changedAt: addDays(i + 1, spec.createdAt),
            note:
              toStatus === "PAUSED"
                ? "Customer requested pause — seasonal slowdown."
                : toStatus === "CLOSED"
                  ? "Contract ended / closed early by staff."
                  : undefined,
          })),
        },
      },
    });
    const planPeriod =
      spec.planId === crmMonthly.id || spec.planId === analyticsMonthly.id || spec.planId === deskMonthly.id
        ? Period.MONTHLY
        : spec.planId === crmYearly.id || spec.planId === vaultYearly.id
          ? Period.YEARLY
          : spec.planId === analyticsWeekly.id
            ? Period.WEEKLY
            : Period.DAILY;
    createdSubs.push({ id: sub.id, number, spec, companyName, period: planPeriod });
    return sub;
  }

  // L = line shorthand
  const L = (
    variantId: string,
    productName: string,
    variantLabel: string,
    unitLabel: string,
    quantity: number,
    unitPrice: number,
    taxIds: string[],
  ): LineSpec => ({ variantId, productName, variantLabel, unitLabel, quantity, unitPrice, taxIds });

  // ── The two demo hooks FIRST so numbering matches the original story ─────
  // SUB-2026-00001: Acme, ACTIVE monthly Odoo CRM, due TODAY (billing-day demo).
  await createSub(
    {
      customerId: acme.id,
      planId: crmMonthly.id,
      templateId: stdMonthlyOdoo.id,
      start: monthsFromNow(-3),
      expiry: monthsFromNow(9),
      createdAt: monthsFromNow(-3),
      status: SubscriptionStatus.ACTIVE,
      nextBilling: daysFromNow(0),
      lines: [L(crmOdoo.id, "Brightloop CRM", "Odoo", "seat", 1, 1559, [gst18.id])],
    },
    "SUB-2026-00001",
  );

  // SUB-2026-00002: Globex, ACTIVE, catch-up demo — due 2 months ago.
  await createSub(
    {
      customerId: globex.id,
      planId: crmMonthly.id,
      start: monthsFromNow(-4),
      expiry: monthsFromNow(8),
      createdAt: monthsFromNow(-4),
      status: SubscriptionStatus.ACTIVE,
      nextBilling: monthsFromNow(-2), // 2 periods overdue → billing run catches up
      lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 3, 999, [gst18.id])],
    },
    "SUB-2026-00002",
  );
  subSeq = 2; // both forced numbers consumed — auto-numbering continues at 00003

  // ── ACTIVE fleet (13 more → 15 total) ────────────────────────────────────
  // nextBilling mix: today / +7d / +30d (renewal forecast) / a few PAST
  // (catch-up fuel). qty ≥ 5 on a couple so SEAT10 could fire at next billing.
  await createSub({
    customerId: nimbus.id,
    planId: crmMonthly.id,
    start: monthsFromNow(-6),
    expiry: monthsFromNow(6),
    createdAt: monthsFromNow(-6),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(7),
    lines: [L(crmOdoo.id, "Brightloop CRM", "Odoo", "seat", 5, 1559, [gst18.id])], // SEAT10 candidate
  });
  await createSub({
    customerId: kaveri.id,
    planId: analyticsMonthly.id,
    templateId: analyticsProKickstart.id,
    start: monthsFromNow(-5),
    expiry: monthsFromNow(7),
    createdAt: monthsFromNow(-5),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(12),
    lines: [L(analyticsPro.id, "Brightloop Analytics", "Pro", "workspace", 2, 1799, [gst18.id])],
  });
  await createSub({
    customerId: pinnacle.id,
    planId: deskMonthly.id,
    templateId: helpdeskLaunch.id,
    start: monthsFromNow(-7),
    expiry: monthsFromNow(5),
    createdAt: monthsFromNow(-7),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(18),
    lines: [L(deskStandard.id, "Brightloop Desk", "Standard", "agent", 3, 699, [gst12.id])],
  });
  await createSub({
    customerId: seaside.id,
    planId: vaultYearly.id,
    start: monthsFromNow(-2),
    expiry: monthsFromNow(10),
    createdAt: monthsFromNow(-2),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: monthsFromNow(10), // yearly → far out
    lines: [L(vaultPro.id, "Brightloop Vault", "Pro", "org", 1, 6299, [gst18.id])],
  });
  await createSub({
    customerId: fortress.id,
    planId: crmMonthly.id,
    start: monthsFromNow(-8),
    expiry: monthsFromNow(4),
    createdAt: monthsFromNow(-8),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(-7), // past → catch-up fuel
    lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 10, 999, [gst18.id])], // ENTERPRISE5 candidate
  });
  await createSub({
    customerId: lumen.id,
    planId: analyticsMonthly.id,
    start: monthsFromNow(-1),
    expiry: monthsFromNow(11),
    createdAt: daysFromNow(-25), // created within last 30d → newMRR
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(0), // also due TODAY
    lines: [L(analyticsEnterprise.id, "Brightloop Analytics", "Enterprise", "workspace", 1, 2299, [gst18.id])],
  });
  await createSub({
    customerId: acme.id,
    planId: deskMonthly.id,
    start: monthsFromNow(-2),
    expiry: monthsFromNow(10),
    createdAt: monthsFromNow(-2),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(25),
    lines: [L(deskPro.id, "Brightloop Desk", "Pro", "agent", 4, 999, [gst12.id])],
  });
  await createSub({
    customerId: globex.id,
    planId: pulseDaily.id,
    start: monthsFromNow(-3),
    expiry: monthsFromNow(9),
    createdAt: monthsFromNow(-3),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(1),
    lines: [L(pulseStandard.id, "Brightloop Pulse", "Standard", "monitor", 20, 49, [gst5.id])],
  });
  await createSub({
    customerId: nimbus.id,
    planId: analyticsWeekly.id,
    start: monthsFromNow(-9),
    expiry: monthsFromNow(3),
    createdAt: monthsFromNow(-9),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(3),
    lines: [L(analyticsStandard.id, "Brightloop Analytics", "Standard", "workspace", 1, 499, [gst5.id])],
  });
  await createSub({
    customerId: kaveri.id,
    planId: crmYearly.id,
    templateId: enterpriseYearly.id,
    start: monthsFromNow(-4),
    expiry: monthsFromNow(8),
    createdAt: monthsFromNow(-4),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: monthsFromNow(8),
    lines: [L(crmOdoo.id, "Brightloop CRM", "Odoo", "seat", 5, 10559, [gst18.id])],
  });
  await createSub({
    customerId: pinnacle.id,
    planId: crmMonthly.id,
    start: daysFromNow(-18), // brand new — fresh MRR
    expiry: monthsFromNow(11),
    createdAt: daysFromNow(-18),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(12),
    lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 2, 999, [gst18.id])],
  });
  await createSub({
    customerId: seaside.id,
    planId: pulseDaily.id,
    start: monthsFromNow(-1),
    expiry: monthsFromNow(11),
    createdAt: monthsFromNow(-1),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(-3), // past → catch-up fuel
    lines: [L(pulsePro.id, "Brightloop Pulse", "Pro", "monitor", 8, 349, [gst5.id])],
  });
  await createSub({
    customerId: fortress.id,
    planId: analyticsMonthly.id,
    start: monthsFromNow(-3),
    expiry: monthsFromNow(9),
    createdAt: monthsFromNow(-3),
    status: SubscriptionStatus.ACTIVE,
    nextBilling: daysFromNow(30), // renewal forecast, end of the 30-day window
    lines: [L(analyticsPro.id, "Brightloop Analytics", "Pro", "workspace", 2, 1799, [gst18.id])],
  });

  // ── PAUSED (3) — pausedOn set, resume dates in the near future ───────────
  await createSub({
    customerId: globex.id,
    planId: analyticsWeekly.id,
    start: monthsFromNow(-5),
    expiry: monthsFromNow(7),
    createdAt: monthsFromNow(-5),
    status: SubscriptionStatus.PAUSED,
    pausedOn: daysFromNow(-5),
    nextBilling: daysFromNow(10),
    lines: [L(analyticsStandard.id, "Brightloop Analytics", "Standard", "workspace", 1, 499, [gst5.id])],
  });
  await createSub({
    customerId: fortress.id,
    planId: deskMonthly.id,
    start: monthsFromNow(-6),
    expiry: monthsFromNow(6),
    createdAt: monthsFromNow(-6),
    status: SubscriptionStatus.PAUSED,
    pausedOn: daysFromNow(-12),
    nextBilling: daysFromNow(16),
    lines: [L(deskStandard.id, "Brightloop Desk", "Standard", "agent", 6, 699, [gst12.id])],
  });
  await createSub({
    customerId: kaveri.id,
    planId: crmMonthly.id,
    start: monthsFromNow(-7),
    expiry: monthsFromNow(5),
    createdAt: monthsFromNow(-7),
    status: SubscriptionStatus.PAUSED,
    pausedOn: daysFromNow(-20),
    nextBilling: daysFromNow(5),
    lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 4, 999, [gst18.id])],
  });

  // ── CLOSED (5) — expired or closed early, history shows the full arc ─────
  await createSub({
    customerId: acme.id,
    planId: crmYearly.id,
    start: monthsFromNow(-14),
    expiry: monthsFromNow(-2),
    createdAt: monthsFromNow(-14),
    status: SubscriptionStatus.CLOSED,
    nextBilling: null,
    lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 2, 9999, [gst18.id])],
  });
  await createSub({
    customerId: nimbus.id,
    planId: pulseDaily.id,
    start: monthsFromNow(-9),
    expiry: monthsFromNow(-1),
    createdAt: monthsFromNow(-9),
    status: SubscriptionStatus.CLOSED,
    nextBilling: null,
    lines: [L(pulseStandard.id, "Brightloop Pulse", "Standard", "monitor", 5, 49, [gst5.id])],
  });
  await createSub({
    customerId: lumen.id,
    planId: analyticsWeekly.id,
    start: monthsFromNow(-6),
    expiry: monthsFromNow(-1),
    createdAt: monthsFromNow(-6),
    status: SubscriptionStatus.CLOSED,
    nextBilling: null,
    lines: [L(analyticsStandard.id, "Brightloop Analytics", "Standard", "workspace", 2, 499, [gst5.id])],
  });
  await createSub({
    customerId: seaside.id,
    planId: crmMonthly.id,
    start: monthsFromNow(-8),
    expiry: monthsFromNow(-3),
    createdAt: monthsFromNow(-8),
    status: SubscriptionStatus.CLOSED,
    nextBilling: null,
    lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 1, 999, [gst18.id])],
  });
  await createSub({
    customerId: fortress.id,
    planId: vaultYearly.id,
    start: monthsFromNow(-13),
    expiry: monthsFromNow(-1),
    createdAt: monthsFromNow(-13),
    status: SubscriptionStatus.CLOSED,
    nextBilling: null,
    lines: [L(vaultStandard.id, "Brightloop Vault", "Standard", "org", 1, 5999, [gst18.id])],
  });

  // ── CONFIRMED (2) — signed, first billing upcoming ───────────────────────
  await createSub({
    customerId: acme.id,
    planId: analyticsWeekly.id,
    start: daysFromNow(-14),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(-14),
    status: SubscriptionStatus.CONFIRMED,
    nextBilling: daysFromNow(7),
    lines: [L(analyticsStandard.id, "Brightloop Analytics", "Standard", "workspace", 1, 499, [gst5.id])],
  });
  await createSub({
    customerId: pinnacle.id,
    planId: analyticsMonthly.id,
    start: daysFromNow(-6),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(-6),
    status: SubscriptionStatus.CONFIRMED,
    nextBilling: daysFromNow(9),
    lines: [L(analyticsPro.id, "Brightloop Analytics", "Pro", "workspace", 1, 1799, [gst18.id])],
  });

  // ── QUOTATION (3) — out the door, awaiting signature ─────────────────────
  await createSub({
    customerId: globex.id,
    planId: crmYearly.id,
    templateId: enterpriseYearly.id,
    start: daysFromNow(0),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(-2),
    status: SubscriptionStatus.QUOTATION,
    nextBilling: null,
    lines: [L(crmOdoo.id, "Brightloop CRM", "Odoo", "seat", 5, 10559, [gst18.id])],
  });
  await createSub({
    customerId: lumen.id,
    planId: deskMonthly.id,
    start: daysFromNow(0),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(-3),
    status: SubscriptionStatus.QUOTATION,
    nextBilling: null,
    lines: [L(deskEnterprise.id, "Brightloop Desk", "Enterprise", "agent", 2, 1499, [gst12.id])],
  });
  await createSub({
    customerId: seaside.id,
    planId: analyticsMonthly.id,
    start: daysFromNow(0),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(-1),
    status: SubscriptionStatus.QUOTATION,
    nextBilling: null,
    lines: [L(analyticsPro.id, "Brightloop Analytics", "Pro", "workspace", 3, 1799, [gst18.id])],
  });

  // ── DRAFT (2) — still being composed by staff ────────────────────────────
  await createSub({
    customerId: acme.id,
    planId: crmMonthly.id,
    start: daysFromNow(0),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(0),
    status: SubscriptionStatus.DRAFT,
    nextBilling: null,
    lines: [L(crmGeneric.id, "Brightloop CRM", "Generic", "seat", 1, 999, [gst18.id])],
  });
  await createSub({
    customerId: nimbus.id,
    planId: vaultYearly.id,
    start: daysFromNow(0),
    expiry: monthsFromNow(12),
    createdAt: daysFromNow(0),
    status: SubscriptionStatus.DRAFT,
    nextBilling: null,
    lines: [L(vaultEnterprise.id, "Brightloop Vault", "Enterprise", "org", 1, 6799, [gst18.id])],
  });

  if (subSeq !== 30) throw new Error(`Expected 30 subscriptions, numbered ${subSeq}`);

  // ── 10. Invoices + payments (dashboard, aging buckets, renewals) ──────────
  // History for ACTIVE subs: 1–4 monthly periods each, period dates derived
  // from next_billing_date so they never collide with periods the billing
  // engine will generate (UNIQUE(subscription_id, period_start)).
  // Aging: CONFIRMED (unpaid) invoices crafted so EVERY bucket has data:
  //   current (due in future) · 1–30 · 31–60 · 61–90 · 90+ days overdue.
  let invSeq = 0;
  const invNumber = () => `INV-2026-${String(++invSeq).padStart(5, "0")}`;

  // Payment method cycle — UPI heavy, then card / bank transfer / cash / cheque.
  const methodCycle: PaymentMethod[] = [
    PaymentMethod.UPI,
    PaymentMethod.UPI,
    PaymentMethod.CARD,
    PaymentMethod.UPI,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.UPI,
    PaymentMethod.CASH,
    PaymentMethod.UPI,
    PaymentMethod.CARD,
    PaymentMethod.CHEQUE,
  ];
  let methodIdx = 0;
  const nextMethod = () => methodCycle[methodIdx++ % methodCycle.length]!;
  const paymentRefs: Record<PaymentMethod, string> = {
    UPI: "UPI ref",
    CARD: "card auth",
    CASH: "cash receipt",
    BANK_TRANSFER: "NEFT UTR",
    CHEQUE: "cheque no",
  };

  const gstById: Record<string, number> = {
    [gst18.id]: 18,
    [gst12.id]: 12,
    [gst5.id]: 5,
  };

  interface InvoiceSpec {
    subNumber: string;
    issue: Date;
    status: InvoiceStatus;
    periodStart: Date;
    periodEnd: Date;
    discount?: { ruleId: string; amount: number };
    paidDaysAfterIssue?: number; // PAID only
  }

  let firstPaidInvoice: { id: string; grand: number; number: string } | null = null;
  let discountedInvoice: { id: string; number: string; ruleId: string; amount: number } | null =
    null;

  async function createInvoice(spec: InvoiceSpec) {
    const sub = createdSubs.find((s) => s.number === spec.subNumber);
    if (!sub) throw new Error(`Invoice spec references unknown subscription ${spec.subNumber}`);
    const { lines } = sub.spec;
    const subtotal = dec2(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
    const taxTotal = dec2(
      lines.reduce((sum, l) => {
        const rate = l.taxIds.reduce((r, id) => r + (gstById[id] ?? 0), 0);
        return sum + (l.quantity * l.unitPrice * rate) / 100;
      }, 0),
    );
    const discountTotal = spec.discount?.amount ?? 0;
    const grandTotal = dec2(subtotal + taxTotal - discountTotal);
    const terms = sub.spec.paymentTermsDays ?? 15;
    const due = addDays(terms, spec.issue);
    const number = invNumber();
    const periodLabel = `${spec.periodStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${spec.periodEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;

    const invoice = await prisma.invoice.create({
      data: {
        number,
        customerId: sub.spec.customerId,
        subscriptionId: sub.id,
        issueDate: spec.issue,
        dueDate: due,
        status: spec.status,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        amountPaid: spec.status === InvoiceStatus.PAID ? grandTotal : 0,
        periodStart: spec.periodStart,
        periodEnd: spec.periodEnd,
        createdAt: spec.issue,
        lines: {
          create: [
            ...lines.map((l) => {
              const lineBase = dec2(l.quantity * l.unitPrice);
              const rate = l.taxIds.reduce((r, id) => r + (gstById[id] ?? 0), 0);
              return {
                variantId: l.variantId,
                kind: InvoiceLineKind.PRODUCT,
                description: `${l.productName} (${l.variantLabel}) — ${l.quantity} ${l.unitLabel}${l.quantity > 1 ? "s" : ""}, ${periodLabel}`,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                taxAmount: dec2((lineBase * rate) / 100),
                lineTotal: lineBase,
              };
            }),
            ...(spec.discount
              ? [
                  {
                    variantId: null,
                    kind: InvoiceLineKind.DISCOUNT,
                    description: "SEAT10 — 10% volume discount (≥5 seats)",
                    quantity: 1,
                    unitPrice: -spec.discount.amount,
                    taxAmount: 0,
                    lineTotal: -spec.discount.amount,
                  },
                ]
              : []),
          ],
        },
        payments:
          spec.status === InvoiceStatus.PAID
            ? {
                create: [
                  (() => {
                    const method = nextMethod();
                    const refNo = String(10_000_000 + invSeq * 137 + 42);
                    return {
                      method,
                      amount: grandTotal,
                      paidAt: addDays(spec.paidDaysAfterIssue ?? 8, spec.issue),
                      note: `${paymentRefs[method]} ${refNo} — ${sub.companyName}`,
                      recordedById: methodIdx % 2 === 0 ? staff.id : priya.id,
                    };
                  })(),
                ],
              }
            : undefined,
        discountUsages: spec.discount
          ? { create: [{ ruleId: spec.discount.ruleId, appliedAmount: spec.discount.amount }] }
          : undefined,
      },
    });
    if (spec.status === InvoiceStatus.PAID && !firstPaidInvoice) {
      firstPaidInvoice = { id: invoice.id, grand: grandTotal, number };
    }
    if (spec.discount && !discountedInvoice) {
      discountedInvoice = {
        id: invoice.id,
        number,
        ruleId: spec.discount.ruleId,
        amount: spec.discount.amount,
      };
    }
    return invoice;
  }

  // History generator: for a sub with monthly billing, walks periodStart back
  // from nextBilling (skipping the current open period) and issues PAID
  // invoices for each of the last `count` periods.
  async function seedPaidHistory(subNumber: string, count: number, skipRecent = 1) {
    const sub = createdSubs.find((s) => s.number === subNumber);
    if (!sub?.spec.nextBilling) return;
    for (let i = 0; i < count; i++) {
      const n = skipRecent + i;
      const periodStart = addMonths(-n - 1, sub.spec.nextBilling);
      const periodEnd = addMonths(-n, sub.spec.nextBilling);
      await createInvoice({
        subNumber,
        issue: periodStart,
        status: InvoiceStatus.PAID,
        periodStart,
        periodEnd,
        paidDaysAfterIssue: 5 + ((i * 3) % 9), // varied paid_at
      });
    }
  }

  // ── PAID history for the ACTIVE fleet (1–4 periods each) ─────────────────
  await seedPaidHistory("SUB-2026-00001", 2); // Acme monthly Odoo
  await seedPaidHistory("SUB-2026-00002", 2); // Globex monthly ×3 seats
  await seedPaidHistory("SUB-2026-00003", 4); // Nimbus 5-seat Odoo CRM
  await seedPaidHistory("SUB-2026-00004", 3); // Kaveri Analytics Pro
  await seedPaidHistory("SUB-2026-00005", 4); // Pinnacle Desk 3 agents
  await seedPaidHistory("SUB-2026-00007", 3); // Fortress 10-seat Generic CRM
  await seedPaidHistory("SUB-2026-00009", 2); // Acme Desk Pro
  await seedPaidHistory("SUB-2026-00011", 2); // Nimbus Analytics weekly-ish (monthly periods)
  await seedPaidHistory("SUB-2026-00013", 1); // Pinnacle CRM 2 seats (new-ish)
  await seedPaidHistory("SUB-2026-00016", 2); // Globex Analytics weekly (paused now)
  await seedPaidHistory("SUB-2026-00017", 1); // Fortress Desk (paused now)
  await seedPaidHistory("SUB-2026-00018", 2); // Kaveri CRM (paused now)
  await seedPaidHistory("SUB-2026-00019", 2); // Fortress Analytics Pro
  // One-shot PAID invoices for yearly subs (single period each).
  await createInvoice({
    subNumber: "SUB-2026-00006", // Seaside Vault Pro yearly
    issue: monthsFromNow(-2),
    status: InvoiceStatus.PAID,
    periodStart: monthsFromNow(-2),
    periodEnd: monthsFromNow(10),
    paidDaysAfterIssue: 4,
  });
  await createInvoice({
    subNumber: "SUB-2026-00012", // Kaveri Enterprise yearly (5 Odoo seats)
    issue: monthsFromNow(-4),
    status: InvoiceStatus.PAID,
    periodStart: monthsFromNow(-4),
    periodEnd: monthsFromNow(8),
    paidDaysAfterIssue: 6,
    // SEAT10 fired on this invoice: 5 seats ≥ 5 → 10% off the 52,795 base.
    discount: { ruleId: seat10.id, amount: 5279.5 },
  });

  // ── CONFIRMED unpaid invoices — aging buckets (due = issue + 15d) ─────────
  // Bucket "current" (due in future):
  await createInvoice({
    subNumber: "SUB-2026-00001", // Acme — last month's period, still inside terms
    issue: daysFromNow(-8),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addMonths(-1, daysFromNow(0)),
    periodEnd: daysFromNow(0),
  });
  await createInvoice({
    subNumber: "SUB-2026-00010", // Globex Pulse — fresh invoice, due in 10 days
    issue: daysFromNow(-5),
    status: InvoiceStatus.CONFIRMED,
    periodStart: daysFromNow(-30),
    periodEnd: daysFromNow(1),
  });
  // Bucket 1–30 days overdue:
  await createInvoice({
    subNumber: "SUB-2026-00003", // Nimbus 5-seat — due 10 days ago
    issue: daysFromNow(-25),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-40, daysFromNow(7)),
    periodEnd: addDays(-10, daysFromNow(7)),
  });
  await createInvoice({
    subNumber: "SUB-2026-00009", // Acme Desk Pro — due 22 days ago
    issue: daysFromNow(-37),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-67, daysFromNow(25)),
    periodEnd: addDays(-37, daysFromNow(25)),
  });
  // Bucket 31–60 days overdue:
  await createInvoice({
    subNumber: "SUB-2026-00005", // Pinnacle Desk — due 30 days ago
    issue: daysFromNow(-45),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-75, daysFromNow(18)),
    periodEnd: addDays(-45, daysFromNow(18)),
  });
  await createInvoice({
    subNumber: "SUB-2026-00007", // Fortress 10-seat — due 38 days ago
    issue: daysFromNow(-53),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-83, daysFromNow(-7)),
    periodEnd: addDays(-53, daysFromNow(-7)),
  });
  // Bucket 61–90 days overdue:
  await createInvoice({
    subNumber: "SUB-2026-00004", // Kaveri Analytics Pro — due 61 days ago
    issue: daysFromNow(-76),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-106, daysFromNow(12)),
    periodEnd: addDays(-76, daysFromNow(12)),
  });
  await createInvoice({
    subNumber: "SUB-2026-00013", // Pinnacle CRM — due 63 days ago
    issue: daysFromNow(-78),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-108, daysFromNow(12)),
    periodEnd: addDays(-78, daysFromNow(12)),
  });
  // Bucket 90+ days overdue:
  await createInvoice({
    subNumber: "SUB-2026-00002", // Globex catch-up sub — due 97 days ago
    issue: daysFromNow(-112),
    status: InvoiceStatus.CONFIRMED,
    periodStart: addDays(-142, daysFromNow(-112)),
    periodEnd: addDays(-112, daysFromNow(-112)),
  });
  await createInvoice({
    subNumber: "SUB-2026-00016", // Globex weekly Analytics (paused, still owes) — due 111 days ago
    issue: daysFromNow(-126),
    status: InvoiceStatus.CONFIRMED,
    periodStart: daysFromNow(-156),
    periodEnd: daysFromNow(-126),
  });

  // ── 11. Email outbox (3 staged mails, queued — sentAt NULL, offline mode) ─
  await prisma.emailOutbox.createMany({
    data: [
      {
        toEmail: acmeLogin!.email,
        subject: "Reset your Orbit password",
        bodyHtml:
          "<p>Hi Acme team,</p><p>Someone (hopefully you) asked to reset the Orbit portal password for <strong>Acme Stores Pvt Ltd</strong>.</p><p><a href=\"http://localhost:3000/reset?token=demo\">Reset password</a> — the link expires in 1 hour.</p><p>— Orbit Billing</p>",
        kind: OutboxKind.RESET,
      },
      {
        toEmail: "arjun@globex.test",
        subject: "Your Orbit invoice is ready",
        bodyHtml:
          "<p>Hi Arjun,</p><p>Your latest Brightloop CRM invoice for <strong>Globex Logistics Pvt Ltd</strong> is ready in the portal.</p><p><a href=\"http://localhost:3000/portal/invoices\">View invoice</a></p><p>— Orbit Billing</p>",
        kind: OutboxKind.INVOICE_SENT,
      },
      {
        toEmail: "saraswathi@kaveri.test",
        subject: "Gentle reminder: payment overdue",
        bodyHtml:
          "<p>Hi Saraswathi,</p><p>This is a friendly reminder that a Brightloop Analytics invoice for <strong>Kaveri Textiles &amp; Silks</strong> is past its due date. You can pay securely from the portal.</p><p><a href=\"http://localhost:3000/portal/invoices\">Pay now</a></p><p>— Orbit Billing</p>",
        kind: OutboxKind.REMINDER,
      },
    ],
  });

  // ── 12. Audit log (a handful, tied to real entities) ─────────────────────
  const paidAnchor = firstPaidInvoice as { id: string; grand: number; number: string } | null;
  const discounted = discountedInvoice as {
    id: string;
    number: string;
    ruleId: string;
    amount: number;
  } | null;
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        entity: "user",
        entityId: priya.id,
        action: "STAFF_CREATED",
        meta: { email: "priya@orbit.local", role: "STAFF", note: "Second staff seat for the billing desk." },
        at: monthsFromNow(-2),
      },
      {
        userId: staff.id,
        entity: "subscription",
        entityId: createdSubs[0]!.id,
        action: "TRANSITION",
        meta: { number: "SUB-2026-00001", from: "CONFIRMED", to: "ACTIVE", note: "Acme go-live." },
        at: addDays(3, monthsFromNow(-3)),
      },
      ...(discounted
        ? [
            {
              userId: priya.id,
              entity: "invoice",
              entityId: discounted.id,
              action: "DISCOUNT_APPLIED",
              meta: {
                number: discounted.number,
                rule: "SEAT10",
                ruleId: discounted.ruleId,
                appliedAmount: discounted.amount,
              },
              at: monthsFromNow(-4),
            },
          ]
        : []),
      ...(paidAnchor
        ? [
            {
              userId: staff.id,
              entity: "invoice",
              entityId: paidAnchor.id,
              action: "PAYMENT_RECORDED",
              meta: { number: paidAnchor.number, amount: paidAnchor.grand, method: "UPI" },
              at: daysFromNow(-60),
            },
          ]
        : []),
      {
        userId: priya.id,
        entity: "subscription",
        entityId: createdSubs.find((s) => s.spec.status === SubscriptionStatus.PAUSED)!.id,
        action: "TRANSITION",
        meta: { from: "ACTIVE", to: "PAUSED", note: "Seasonal slowdown — resume after Onam." },
        at: daysFromNow(-5),
      },
    ],
  });

  // ── 13. Sequences (numbering continues from seed values) ─────────────────
  await prisma.sequence.createMany({
    data: [
      { docType: "SUB", year: 2026, lastNumber: subSeq },
      { docType: "INV", year: 2026, lastNumber: invSeq },
    ],
  });

  // ── 14. Summary ──────────────────────────────────────────────────────────
  console.log("✅ Seed v3 complete:");
  console.log("   users:       11 (admin@orbit.local · staff@orbit.local · priya@orbit.local · 8 customer logins)");
  console.log("   customers:   8 (Acme · Globex · Nimbus Health · Kaveri Textiles · Pinnacle Edu · Seaside · Fortress · Lumen Media)");
  console.log("   attributes:  2 (Brand{Generic, Odoo} · Edition{Standard, Pro, Enterprise})");
  console.log("   products:    5 (CRM ₹999 · Analytics ₹1499 · Desk ₹699 · Vault ₹5999 · Pulse ₹49)");
  console.log("   variants:    13 (CRM Generic +₹0 / Odoo +₹560 · Pro +₹300 · Enterprise +₹800 on others)");
  console.log("   plans:       7 (CRM Monthly ₹999 · CRM Yearly ₹9999 · Analytics Weekly ₹499 · Analytics Monthly ₹1499 · Desk Monthly ₹699 · Vault Yearly ₹5999 · Pulse Daily ₹49)");
  console.log("   taxes:       3 (GST 18% · GST 12% · GST 5%)");
  console.log("   templates:   4 (Standard Monthly Odoo · Enterprise Yearly · Analytics Pro Kickstart · Helpdesk Launch)");
  console.log("   discounts:   5 (SEAT10 · LAUNCH200 · FESTIVE15 · OLDFRIEND expired · ENTERPRISE5)");
  console.log(`   subscriptions: ${subSeq} (2 DRAFT · 3 QUOTATION · 2 CONFIRMED · 15 ACTIVE · 3 PAUSED · 5 CLOSED)`);
  console.log(`   status_history rows for every non-DRAFT subscription (staff/priya authored)`);
  console.log(`   invoices:    ${invSeq} (PAID history + CONFIRMED unpaid across all 5 aging buckets)`);
  console.log("   payments:    one per PAID invoice (UPI heavy · card · bank transfer · cash · cheque)");
  console.log("   outbox:      3 queued mails (RESET · INVOICE_SENT · REMINDER — offline mode)");
  console.log("   audit_log:   5 rows (staff created · transitions · discount applied · payment recorded)");
  console.log(`   sequences:   SUB/2026 → ${subSeq} · INV/2026 → ${invSeq}`);
  console.log("   demo hooks:  SUB-2026-00001 due TODAY · SUB-2026-00002 catch-up due 2 months ago");
  void admin;
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
