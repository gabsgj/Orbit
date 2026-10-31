import type { Prisma, PrismaClient, DiscountRule } from "@prisma/client";
import { dateOnly } from "@/shared/lib/dates";

/**
 * DiscountEngine — pure, framework-free rule evaluation.
 *
 * THE CONTRACT (docs/PLAN.md §4 step f): modules/billing calls `evaluate`
 * inside its per-subscription transaction. This function MUST NOT commit
 * anything outside the `tx` it is given — the caller owns the transaction.
 *
 * Rules (SRS §6):
 *  3. Precedence: product-scope rules apply per matching line first; then
 *     subscription-scope rules on the reduced subtotal. Fixed amounts are
 *     capped at the remaining subtotal. Never below zero.
 *  4. Eligibility: start_date ≤ asOf ≤ end_date ∧ usedCount < usage_limit
 *     (NULL = unlimited) ∧ min_purchase / min_quantity satisfied.
 */

export interface EngineLine {
  variantId: string;
  productId: string;
  quantity: number;
  /** Line amount BEFORE discount: quantity × unitPrice (snapshot). */
  amount: number;
}

export interface DiscountLineOut {
  ruleId: string;
  ruleName: string;
  description: string;
  /** Negative: reduces the invoice. */
  amount: number;
}

export interface UsageOut {
  ruleId: string;
  appliedAmount: number;
}

export interface DiscountEvaluation {
  discountLines: DiscountLineOut[];
  usages: UsageOut[];
  /** Sum of discountLines (negative or zero). */
  total: number;
}

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Evaluate all ACTIVE rules against a subscription's lines for a billing date.
 * Usage counts are read inside the caller's transaction (`tx`), so the
 * usage-limit check and the invoice insert are atomic.
 */
export async function evaluate(
  tx: Tx,
  input: { subscriptionId: string; lines: EngineLine[]; asOf: Date },
): Promise<DiscountEvaluation> {
  const { lines, asOf } = input;
  if (!lines || lines.length === 0) {
    return { discountLines: [], usages: [], total: 0 };
  }

  const asOfDate = dateOnly(asOf);

  const activeRules = await tx.discountRule.findMany({
    where: {
      isActive: true,
      startDate: { lte: asOfDate },
      endDate: { gte: asOfDate },
    },
    include: {
      products: true,
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const eligibleRules = activeRules.filter((rule) => {
    if (rule.usageLimit !== null && rule._count.usages >= rule.usageLimit) {
      return false;
    }
    return true;
  });

  const discountLines: DiscountLineOut[] = [];
  const usages: UsageOut[] = [];

  const workingLines = lines.map((l) => ({
    ...l,
    remainingAmount: l.amount,
  }));

  const productRules = eligibleRules.filter((r) => r.scope === "PRODUCT");
  const subscriptionRules = eligibleRules.filter((r) => r.scope === "SUBSCRIPTION");

  // Step 1: Evaluate Product-scope rules first (per matching line)
  for (const rule of productRules) {
    const productIds = new Set(rule.products.map((p) => p.productId));
    const matchingLines = workingLines.filter(
      (l) => productIds.has(l.productId) && l.remainingAmount > 0,
    );

    if (matchingLines.length === 0) continue;

    const totalMatchingQty = matchingLines.reduce((acc, l) => acc + l.quantity, 0);
    const totalMatchingAmount = matchingLines.reduce((acc, l) => acc + l.remainingAmount, 0);

    if (rule.minQuantity && totalMatchingQty < rule.minQuantity) continue;
    if (rule.minPurchase && totalMatchingAmount < Number(rule.minPurchase)) continue;

    let appliedForRule = 0;

    for (const line of matchingLines) {
      if (line.remainingAmount <= 0) continue;
      let lineDiscount = 0;
      if (rule.kind === "PERCENT") {
        const rate = Number(rule.value) / 100;
        lineDiscount = Math.round(line.remainingAmount * rate * 100) / 100;
      } else {
        lineDiscount = Math.min(Number(rule.value), line.remainingAmount);
      }

      lineDiscount = Math.min(lineDiscount, line.remainingAmount);
      if (lineDiscount > 0) {
        line.remainingAmount = Math.round((line.remainingAmount - lineDiscount) * 100) / 100;
        appliedForRule += lineDiscount;
      }
    }

    if (appliedForRule > 0) {
      discountLines.push({
        ruleId: rule.id,
        ruleName: rule.name,
        description: rule.name,
        amount: -appliedForRule,
      });
      usages.push({
        ruleId: rule.id,
        appliedAmount: appliedForRule,
      });
    }
  }

  // Step 2: Evaluate Subscription-scope rules second (on reduced subtotal)
  let remainingSubtotal = workingLines.reduce((acc, l) => acc + l.remainingAmount, 0);
  const totalQuantity = lines.reduce((acc, l) => acc + l.quantity, 0);

  for (const rule of subscriptionRules) {
    if (remainingSubtotal <= 0) break;

    if (rule.minQuantity && totalQuantity < rule.minQuantity) continue;
    if (rule.minPurchase && remainingSubtotal < Number(rule.minPurchase)) continue;

    let discountAmount = 0;
    if (rule.kind === "PERCENT") {
      const rate = Number(rule.value) / 100;
      discountAmount = Math.round(remainingSubtotal * rate * 100) / 100;
    } else {
      discountAmount = Math.min(Number(rule.value), remainingSubtotal);
    }

    discountAmount = Math.min(discountAmount, remainingSubtotal);

    if (discountAmount > 0) {
      remainingSubtotal = Math.round((remainingSubtotal - discountAmount) * 100) / 100;
      discountLines.push({
        ruleId: rule.id,
        ruleName: rule.name,
        description: rule.name,
        amount: -discountAmount,
      });
      usages.push({
        ruleId: rule.id,
        appliedAmount: discountAmount,
      });
    }
  }

  const total = discountLines.reduce((acc, dl) => acc + dl.amount, 0);

  return {
    discountLines,
    usages,
    total: Math.round(total * 100) / 100,
  };
}

/** Re-exported rule type for consumers of the contract. */
export type { DiscountRule };
