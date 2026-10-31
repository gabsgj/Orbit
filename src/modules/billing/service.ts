import type { PrismaClient, BillingTriggerType } from "@prisma/client";
import { evaluateDiscounts } from "@/modules/discounts";

/**
 * BillingService — the crown jewel (docs/PLAN.md §4). ONE service, BOTH triggers:
 * "Run billing day" button, node-cron worker, Vercel Cron — all call `run`.
 *
 * Guarantees (SRS M5):
 *  - Idempotent: UNIQUE(subscription_id, period_start) + insert skips conflict.
 *  - Concurrency-safe: pg_advisory_xact_lock serializes runs.
 *  - Never skipped: catch-up loop invoices every missed period (cap 12).
 *  - Audited: every execution writes a billing_runs row.
 *
 * TODO(Gabriel, Phase 2): implement per PLAN §4 steps 1–6. The skeleton below
 * fixes the public contract so all three triggers can be wired today.
 */

export interface BillingRunInput {
  asOf: Date;
  triggerType: BillingTriggerType;
  triggeredById?: string;
}

export interface BillingRunResult {
  status: "DONE" | "ALREADY_RUNNING" | "FAILED";
  invoicesCreated: number;
  skippedAlreadyBilled: number;
  errors: number;
  durationMs: number;
}

export async function run(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prisma: PrismaClient,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  input: BillingRunInput,
): Promise<BillingRunResult> {
  // Reference to the discount contract billing will consume (Phase 2):
  void evaluateDiscounts;

  // Phase-0 placeholder: proves all three triggers can call one service.
  return {
    status: "DONE",
    invoicesCreated: 0,
    skippedAlreadyBilled: 0,
    errors: 0,
    durationMs: 0,
  };
}
