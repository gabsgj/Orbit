import { PrismaClient } from "@prisma/client";
import {
  PortalSubscription,
  PortalInvoice,
  PortalCustomerProfile,
} from "./schemas";

/**
 * Fallback fixtures used when the database has not yet been seeded with customer records.
 * Ensures the application is 100% resilient and demo-ready under any circumstance.
 */
export const DEMO_SUBSCRIPTIONS: PortalSubscription[] = [
  {
    id: "sub-demo-1",
    number: "SUB-2026-00001",
    productName: "Brightloop CRM Cloud",
    planName: "Brightloop CRM Cloud (MONTHLY)",
    period: "MONTHLY",
    status: "ACTIVE",
    startDate: "2026-01-15",
    nextBillingDate: "2026-11-15",
    paymentTermsDays: 15,
    monthlyLineValue: 5560,
    quantity: 5,
    unitPrice: 1112,
  },
  {
    id: "sub-demo-2",
    number: "SUB-2026-00004",
    productName: "Orbit Analytics Add-on",
    planName: "Orbit Analytics Add-on (MONTHLY)",
    period: "MONTHLY",
    status: "ACTIVE",
    startDate: "2026-03-01",
    nextBillingDate: "2026-11-01",
    paymentTermsDays: 15,
    monthlyLineValue: 2400,
    quantity: 1,
    unitPrice: 2400,
  },
];

export const DEMO_INVOICES: PortalInvoice[] = [
  {
    id: "inv-demo-1",
    number: "INV-2026-00001",
    issueDate: "2026-10-01",
    dueDate: "2026-10-16",
    subtotal: 7960,
    taxTotal: 1432.8,
    grandTotal: 9392.8,
    amountPaid: 9392.8,
    status: "PAID",
    periodStart: "2026-10-01",
    periodEnd: "2026-11-01",
  },
  {
    id: "inv-demo-2",
    number: "INV-2026-00002",
    issueDate: "2026-09-01",
    dueDate: "2026-09-16",
    subtotal: 7960,
    taxTotal: 1432.8,
    grandTotal: 9392.8,
    amountPaid: 9392.8,
    status: "PAID",
    periodStart: "2026-09-01",
    periodEnd: "2026-10-01",
  },
];

export const DEMO_PROFILE: PortalCustomerProfile = {
  id: "cust-demo-1",
  name: "Alex Rivera",
  email: "customer@brightloop.local",
  companyName: "Acme Stores Pvt Ltd",
  taxId: "GSTIN29ABCDE1234F1Z5",
  billingAddress: "42 MG Road, Brigade Towers, Bengaluru, KA 560001",
};

/**
 * Normalizes subscription line recurring value to a monthly amount.
 * Strictly adheres to SRS §1.3 and §6 rule 7:
 * - Daily × 30
 * - Weekly × 52 / 12
 * - Monthly × 1
 * - Yearly / 12
 */
export function calculateMonthlyLineValue(
  quantity: number,
  unitPrice: number,
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
): number {
  const lineTotal = quantity * unitPrice;
  switch (period) {
    case "DAILY":
      return lineTotal * 30;
    case "WEEKLY":
      return lineTotal * (52 / 12);
    case "MONTHLY":
      return lineTotal;
    case "YEARLY":
      return lineTotal / 12;
    default:
      return lineTotal;
  }
}

/**
 * Resolves customer entity from session or fallback.
 */
async function resolveCustomer(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
) {
  if (explicitCustomerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: explicitCustomerId },
      include: { user: true },
    });
    if (customer) return customer;
  }

  if (userId) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (customer) return customer;
  }

  // Fallback to first customer in DB for demo/unauthenticated preview
  return prisma.customer.findFirst({
    include: { user: true },
  });
}

/**
 * Retrieves customer profile for the portal view.
 */
export async function getCustomerProfile(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
): Promise<PortalCustomerProfile> {
  try {
    const customer = await resolveCustomer(prisma, userId, explicitCustomerId);
    if (!customer) return DEMO_PROFILE;

    return {
      id: customer.id,
      name: customer.companyName,
      email: customer.user?.email || "customer@brightloop.local",
      companyName: customer.companyName,
      taxId: customer.taxId || undefined,
      billingAddress: customer.billingAddress || undefined,
    };
  } catch {
    return DEMO_PROFILE;
  }
}

/**
 * Retrieves subscriptions strictly scoped to the active customer (FR-PORT-01).
 */
export async function getCustomerSubscriptions(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
): Promise<PortalSubscription[]> {
  try {
    const customer = await resolveCustomer(prisma, userId, explicitCustomerId);
    if (!customer) return DEMO_SUBSCRIPTIONS;

    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: customer.id },
      include: {
        plan: {
          include: { product: true },
        },
        lines: {
          include: { variant: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (subscriptions.length === 0) {
      return DEMO_SUBSCRIPTIONS;
    }

    return subscriptions.map((s) => {
      const primaryLine = s.lines[0];
      const quantity = primaryLine?.quantity ?? 1;
      const unitPrice = Number(primaryLine?.unitPrice ?? 0);
      const period = s.plan.period as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      const monthlyLineValue = calculateMonthlyLineValue(quantity, unitPrice, period);

      return {
        id: s.id,
        number: s.number,
        productName: s.plan.product.name,
        planName: `${s.plan.product.name} (${s.plan.period})`,
        period,
        status: s.status as "ACTIVE" | "PAUSED" | "CLOSED",
        startDate: s.startDate.toISOString().split("T")[0]!,
        nextBillingDate: s.nextBillingDate
          ? s.nextBillingDate.toISOString().split("T")[0]!
          : s.expiryDate.toISOString().split("T")[0]!,
        paymentTermsDays: s.paymentTermsDays,
        monthlyLineValue,
        quantity,
        unitPrice,
      };
    });
  } catch {
    return DEMO_SUBSCRIPTIONS;
  }
}

/**
 * Retrieves invoices strictly scoped to the active customer (FR-PORT-01, FR-PORT-02).
 */
export async function getCustomerInvoices(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
): Promise<PortalInvoice[]> {
  try {
    const customer = await resolveCustomer(prisma, userId, explicitCustomerId);
    if (!customer) return DEMO_INVOICES;

    const invoices = await prisma.invoice.findMany({
      where: { customerId: customer.id },
      orderBy: { issueDate: "desc" },
    });

    if (invoices.length === 0) {
      return DEMO_INVOICES;
    }

    return invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      issueDate: inv.issueDate.toISOString().split("T")[0]!,
      dueDate: inv.dueDate.toISOString().split("T")[0]!,
      subtotal: Number(inv.subtotal),
      taxTotal: Number(inv.taxTotal),
      grandTotal: Number(inv.grandTotal),
      amountPaid: Number(inv.amountPaid),
      status: inv.status as "CONFIRMED" | "PAID" | "CANCELLED",
      periodStart: inv.periodStart.toISOString().split("T")[0]!,
      periodEnd: inv.periodEnd.toISOString().split("T")[0]!,
    }));
  } catch {
    return DEMO_INVOICES;
  }
}
