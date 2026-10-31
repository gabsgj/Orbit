import { PrismaClient } from "@prisma/client";
import {
  PortalSubscription,
  PortalInvoice,
  PortalCustomerProfile,
  SubscriptionActionInput,
} from "./schemas";

/**
 * NO MOCK DATA. The portal renders only real, session-scoped rows (FR-PORT-01).
 * A customer with no subscriptions sees a designed empty state in the UI —
 * never invented data. Errors propagate to the caller's error state.
 */

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
 * Resolves the customer for the signed-in user — and ONLY that customer
 * (FR-PORT-01 / FR-AUTH-07). There is deliberately NO "first customer in the
 * DB" fallback: a staff/admin or anonymous caller has no customer record, and
 * the portal must show an empty state, never someone else's data.
 */
async function resolveCustomer(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
) {
  if (explicitCustomerId) {
    return prisma.customer.findUnique({
      where: { id: explicitCustomerId },
      include: { user: true },
    });
  }
  if (!userId) return null;
  return prisma.customer.findUnique({
    where: { userId },
    include: { user: true },
  });
}

/**
 * Retrieves customer profile for the portal view. NULL when the signed-in
 * user has no customer record (staff/admin) — the UI renders its empty state.
 */
export async function getCustomerProfile(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
): Promise<PortalCustomerProfile | null> {
  const customer = await resolveCustomer(prisma, userId, explicitCustomerId);
  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.companyName,
    email: customer.user?.email ?? "",
    companyName: customer.companyName,
    taxId: customer.taxId || undefined,
    billingAddress: customer.billingAddress || undefined,
  };
}

/**
 * Retrieves subscriptions strictly scoped to the active customer (FR-PORT-01).
 * Empty array when none — the UI's empty state, never fabricated rows.
 */
export async function getCustomerSubscriptions(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
): Promise<PortalSubscription[]> {
  const customer = await resolveCustomer(prisma, userId, explicitCustomerId);
  if (!customer) return [];

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
      pausable: s.plan.pausable,
      renewable: s.plan.renewable,
      closableEarly: s.plan.closableEarly,
    };
  });
}

/**
 * Retrieves invoices strictly scoped to the active customer (FR-PORT-01, FR-PORT-02).
 */
export async function getCustomerInvoices(
  prisma: PrismaClient,
  userId?: string,
  explicitCustomerId?: string
): Promise<PortalInvoice[]> {
  const customer = await resolveCustomer(prisma, userId, explicitCustomerId);
  if (!customer) return [];

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { issueDate: "desc" },
  });

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
}

/**
 * Handles customer-initiated subscription actions (FR-PORT-03, DEMO Act 8).
 * Checks plan flags (pausable, renewable, closableEarly) before executing updates.
 */
export async function requestSubscriptionAction(
  prisma: PrismaClient,
  userId: string | undefined,
  input: SubscriptionActionInput
): Promise<{ success: boolean; message: string; newStatus?: string }> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: input.subscriptionId },
      include: { plan: true, customer: true },
    });

    if (!sub) {
      return {
        success: false,
        message: "Subscription record not found.",
      };
    }

    // Verify ownership if user is signed in
    if (userId && sub.customer.userId !== userId) {
      return {
        success: false,
        message: "Unauthorized: this subscription does not belong to your account.",
      };
    }

    if (input.action === "PAUSE") {
      if (!sub.plan.pausable) {
        return {
          success: false,
          message: "This subscription plan does not permit pausing (FR-SUB-04).",
        };
      }
      if (sub.status !== "ACTIVE") {
        return {
          success: false,
          message: `Cannot pause subscription in ${sub.status} state. Only ACTIVE subscriptions can be paused.`,
        };
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "PAUSED",
          pausedOn: new Date(),
        },
      });

      return {
        success: true,
        message: `Subscription ${sub.number} paused successfully. Billing cycle is on hold.`,
        newStatus: "PAUSED",
      };
    }

    if (input.action === "RESUME") {
      if (sub.status !== "PAUSED") {
        return {
          success: false,
          message: `Cannot resume subscription in ${sub.status} state. Only PAUSED subscriptions can be resumed.`,
        };
      }

      const now = new Date();
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          pausedOn: null,
          nextBillingDate:
            sub.nextBillingDate && sub.nextBillingDate <= now
              ? now
              : sub.nextBillingDate,
        },
      });

      return {
        success: true,
        message: `Subscription ${sub.number} resumed successfully. Active recurring billing restored.`,
        newStatus: "ACTIVE",
      };
    }

    if (input.action === "RENEW") {
      if (!sub.plan.renewable) {
        return {
          success: false,
          message: "This plan does not support customer-initiated renewal.",
        };
      }

      const nextExpiry = new Date(sub.expiryDate);
      nextExpiry.setFullYear(nextExpiry.getFullYear() + 1);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          expiryDate: nextExpiry,
        },
      });

      return {
        success: true,
        message: `Subscription ${sub.number} renewed successfully. Active through ${
          nextExpiry.toISOString().split("T")[0]
        }.`,
        newStatus: sub.status,
      };
    }

    if (input.action === "CLOSE") {
      if (!sub.plan.closableEarly) {
        return {
          success: false,
          message: "This plan does not permit early closure before the expiry date (FR-SUB-05).",
        };
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "CLOSED",
          nextBillingDate: null,
        },
      });

      return {
        success: true,
        message: `Subscription ${sub.number} has been closed per your request.`,
        newStatus: "CLOSED",
      };
    }

    return {
      success: true,
      message: `Request registered for subscription ${sub.number}.`,
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      message: `Unable to process request: ${errorMsg}`,
    };
  }
}
