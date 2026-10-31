import type { Prisma, PrismaClient, DiscountRule } from "@prisma/client";

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
 *
 * TODO(Catherine, Phase 2): implement per SRS §6 rules 3–4 and the eligibility
 * matrix below; cover with unit tests (window, precedence, limit race, caps).
 */
export async function evaluate(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tx: Tx,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  input: { subscriptionId: string; lines: EngineLine[]; asOf: Date },
): Promise<DiscountEvaluation> {
  // Eligibility + precedence implemented in Phase 2. Returns no discounts for now
  // so billing can integrate against the stable contract immediately.
  return { discountLines: [], usages: [], total: 0 };
}

/** Re-exported rule type for consumers of the contract. */
export type { DiscountRule };
