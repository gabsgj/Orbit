import type { Prisma, PrismaClient, SubscriptionStatus, Plan } from "@prisma/client";
import { addPeriod } from "@/shared/lib/dates";
import { nextSequenceNumber } from "@/shared/lib/sequence";
import type {
  CreateSubscriptionInput,
  CreateFromTemplateInput,
  TransitionSubscriptionInput,
  RenewSubscriptionInput,
} from "./schemas";
import {
  findPlanById,
  findSubscriptionById,
  findTemplateWithLines,
} from "./queries";

type Tx = Prisma.TransactionClient | PrismaClient;

export class SubscriptionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

/**
 * State machine legal transitions (docs/SRS.md §5 & §6).
 */
export const LEGAL_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  DRAFT: ["QUOTATION", "CLOSED"],
  QUOTATION: ["CONFIRMED", "CLOSED"],
  CONFIRMED: ["ACTIVE", "CLOSED"],
  ACTIVE: ["PAUSED", "CLOSED"],
  PAUSED: ["ACTIVE", "CLOSED"],
  CLOSED: [],
};

/**
 * Pure transition guard: checks legal transitions and plan-flag constraints.
 */
export function validateTransition(params: {
  currentStatus: SubscriptionStatus;
  targetStatus: SubscriptionStatus;
  plan: Pick<Plan, "id" | "minQuantity" | "pausable" | "closableEarly" | "renewable">;
  totalQuantity: number;
  expiryDate: Date;
  asOf?: Date;
  forceClose?: boolean;
}): void {
  const { currentStatus, targetStatus, plan, totalQuantity, expiryDate, asOf = new Date(), forceClose } = params;

  if (currentStatus === targetStatus) {
    return;
  }

  const allowed = LEGAL_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new SubscriptionError(
      "ILLEGAL_TRANSITION",
      `Cannot transition subscription from ${currentStatus} to ${targetStatus}.`,
      { from: currentStatus, to: targetStatus },
    );
  }

  // Confirm gate: quantity >= plan.min_quantity (FR-SUB-07)
  if (targetStatus === "CONFIRMED") {
    if (totalQuantity < plan.minQuantity) {
      throw new SubscriptionError(
        "BELOW_MIN_QUANTITY",
        `Total quantity (${totalQuantity}) is below minimum required (${plan.minQuantity}) for plan.`,
        { minQuantity: plan.minQuantity, actualQuantity: totalQuantity },
      );
    }
  }

  // Pause gate: plan.pausable (FR-SUB-04)
  if (targetStatus === "PAUSED") {
    if (!plan.pausable) {
      throw new SubscriptionError(
        "PLAN_NOT_PAUSABLE",
        "This plan does not permit pausing.",
        { planId: plan.id },
      );
    }
  }

  // Close early gate: plan.closable_early (FR-SUB-05)
  if (targetStatus === "CLOSED" && !forceClose) {
    const isEarly = asOf < new Date(expiryDate);
    if (isEarly && (currentStatus === "ACTIVE" || currentStatus === "PAUSED") && !plan.closableEarly) {
      throw new SubscriptionError(
        "PLAN_NOT_CLOSABLE_EARLY",
        "This plan does not permit closing early before the expiry date.",
        { planId: plan.id, expiryDate },
      );
    }
  }
}

/**
 * Execute state transition with atomic status history logging.
 */
export async function transitionSubscription(
  tx: Tx,
  input: TransitionSubscriptionInput & { changedById: string; asOf?: Date; forceClose?: boolean },
) {
  const asOf = input.asOf ?? new Date();

  const sub = await findSubscriptionById(tx, input.subscriptionId);
  if (!sub) {
    throw new SubscriptionError("NOT_FOUND", "Subscription not found.", { id: input.subscriptionId });
  }

  const totalQuantity = sub.lines.reduce((acc, l) => acc + l.quantity, 0);

  // Validate transition rules
  validateTransition({
    currentStatus: sub.status,
    targetStatus: input.toStatus,
    plan: sub.plan,
    totalQuantity,
    expiryDate: sub.expiryDate,
    asOf,
    forceClose: input.forceClose,
  });

  const updates: Prisma.SubscriptionUpdateInput = {
    status: input.toStatus,
  };

  if (input.toStatus === "PAUSED") {
    updates.pausedOn = asOf;
  } else if (sub.status === "PAUSED" && input.toStatus === "ACTIVE") {
    updates.pausedOn = null;
    // Re-anchor next_billing_date (SRS §6 rule 5): if billing date passed while paused, move to asOf
    if (sub.nextBillingDate && new Date(sub.nextBillingDate) <= asOf) {
      updates.nextBillingDate = asOf;
    }
  } else if (input.toStatus === "ACTIVE" && !sub.nextBillingDate) {
    // Initial activation: set first billing date to startDate or asOf
    updates.nextBillingDate = new Date(sub.startDate) <= asOf ? asOf : sub.startDate;
  } else if (input.toStatus === "CLOSED") {
    updates.nextBillingDate = null;
  }

  const updated = await tx.subscription.update({
    where: { id: sub.id },
    data: updates,
    include: {
      customer: true,
      plan: true,
      lines: true,
    },
  });

  await tx.subscriptionStatusHistory.create({
    data: {
      subscriptionId: sub.id,
      fromStatus: sub.status,
      toStatus: input.toStatus,
      changedById: input.changedById,
      note: input.note ?? null,
      changedAt: asOf,
    },
  });

  return updated;
}

/**
 * Renew subscription: extends expiry by 1 plan period (FR-SUB-05).
 */
export async function renewSubscription(
  tx: Tx,
  input: RenewSubscriptionInput & { changedById: string },
) {
  const sub = await findSubscriptionById(tx, input.subscriptionId);
  if (!sub) {
    throw new SubscriptionError("NOT_FOUND", "Subscription not found.", { id: input.subscriptionId });
  }

  if (!sub.plan.renewable) {
    throw new SubscriptionError(
      "PLAN_NOT_RENEWABLE",
      "This plan does not permit renewal.",
      { planId: sub.plan.id },
    );
  }

  if (sub.status !== "ACTIVE" && sub.status !== "CONFIRMED") {
    throw new SubscriptionError(
      "ILLEGAL_RENEWAL",
      `Only ACTIVE or CONFIRMED subscriptions can be renewed. Current status: ${sub.status}.`,
      { status: sub.status },
    );
  }

  const newExpiry = addPeriod(sub.expiryDate, sub.plan.period);

  const updated = await tx.subscription.update({
    where: { id: sub.id },
    data: {
      expiryDate: newExpiry,
    },
    include: {
      customer: true,
      plan: true,
    },
  });

  await tx.subscriptionStatusHistory.create({
    data: {
      subscriptionId: sub.id,
      fromStatus: sub.status,
      toStatus: sub.status,
      changedById: input.changedById,
      note: input.note ?? `Renewed: expiry extended to ${newExpiry.toISOString().slice(0, 10)}`,
    },
  });

  return updated;
}

/**
 * Create a new subscription from scratch.
 */
export async function createSubscription(
  tx: Tx,
  input: CreateSubscriptionInput & { changedById: string },
) {
  const plan = await findPlanById(tx, input.planId);
  if (!plan) {
    throw new SubscriptionError("PLAN_NOT_FOUND", "Plan not found.", { planId: input.planId });
  }

  const initialStatus: SubscriptionStatus = input.status ?? "DRAFT";
  const number = await nextSequenceNumber(tx, "SUB", input.startDate);

  // If initial status is CONFIRMED, validate min quantity
  const totalQuantity = input.lines.reduce((acc, l) => acc + l.quantity, 0);
  if (initialStatus === "CONFIRMED" && totalQuantity < plan.minQuantity) {
    throw new SubscriptionError(
      "BELOW_MIN_QUANTITY",
      `Total quantity (${totalQuantity}) is below minimum required (${plan.minQuantity}) for plan.`,
      { minQuantity: plan.minQuantity, actualQuantity: totalQuantity },
    );
  }

  const nextBillingDate = initialStatus === "ACTIVE" ? input.startDate : null;

  return tx.subscription.create({
    data: {
      number,
      customerId: input.customerId,
      planId: input.planId,
      templateId: input.templateId ?? null,
      startDate: input.startDate,
      expiryDate: input.expiryDate,
      paymentTermsDays: input.paymentTermsDays,
      status: initialStatus,
      nextBillingDate,
      lines: {
        create: input.lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxes: line.taxIds && line.taxIds.length > 0
            ? {
                create: line.taxIds.map((taxId) => ({ taxId })),
              }
            : undefined,
        })),
      },
      statusHistory: {
        create: {
          fromStatus: "DRAFT",
          toStatus: initialStatus,
          changedById: input.changedById,
          note: "Initial subscription created",
        },
      },
    },
    include: {
      customer: true,
      plan: true,
      lines: true,
    },
  });
}

/**
 * Create subscription pre-populated from quotation template (FR-QT-02).
 */
export async function createFromTemplate(
  tx: Tx,
  input: CreateFromTemplateInput & { changedById: string },
) {
  const template = await findTemplateWithLines(tx, input.templateId);
  if (!template) {
    throw new SubscriptionError("TEMPLATE_NOT_FOUND", "Quotation template not found.", {
      templateId: input.templateId,
    });
  }

  if (template.lines.length === 0) {
    throw new SubscriptionError("TEMPLATE_EMPTY", "Quotation template has no lines.", {
      templateId: input.templateId,
    });
  }

  const expiryDate = addPeriod(input.startDate, template.plan.period);
  const number = await nextSequenceNumber(tx, "SUB", input.startDate);

  return tx.subscription.create({
    data: {
      number,
      customerId: input.customerId,
      planId: template.planId,
      templateId: template.id,
      startDate: input.startDate,
      expiryDate,
      paymentTermsDays: input.paymentTermsDays ?? 15,
      status: "QUOTATION",
      lines: {
        create: template.lines.map((tl) => ({
          variantId: tl.variantId,
          quantity: tl.quantity,
          unitPrice: tl.unitPrice,
        })),
      },
      statusHistory: {
        create: {
          fromStatus: "DRAFT",
          toStatus: "QUOTATION",
          changedById: input.changedById,
          note: `Created from template: ${template.name}`,
        },
      },
    },
    include: {
      customer: true,
      plan: true,
      lines: true,
    },
  });
}
