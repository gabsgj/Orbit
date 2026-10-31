import {
  Prisma,
  PrismaClient,
  BillingTriggerType,
  SubscriptionStatus,
  type Subscription,
  type SubscriptionLine,
  type Plan,
  type ProductVariant,
  type Product,
  type AttributeValue,
  type Tax,
} from "@prisma/client";
import { evaluateDiscounts, type EngineLine } from "@/modules/discounts";
import { nextNumber } from "@/modules/admin";
import { addPeriod, dateOnly, addDays } from "@/shared/lib/dates";

/**
 * BillingService — the crown jewel (docs/PLAN.md §4). ONE service, BOTH triggers:
 * "Run billing day" button, node-cron worker, Vercel Cron — all call `run`.
 *
 * Guarantees (SRS M5):
 *  - Idempotent (FR-BILL-03): UNIQUE(subscription_id, period_start) — a period
 *    already invoiced is skipped, never duplicated. The DB enforces it.
 *  - Concurrency-safe (FR-BILL-04): pg_try_advisory_xact_lock serializes runs;
 *    a second concurrent run reports ALREADY_RUNNING.
 *  - Never skipped (FR-BILL-05): catch-up loop invoices every missed period
 *    (cap MAX_CATCH_UP per run, one invoice per period — correct for MRR).
 *  - Audited (FR-BILL-06): every execution writes a billing_runs row.
 *  - Per-subscription isolation: each subscription's work runs under a
 *    SAVEPOINT, so one bad subscription can't abort the whole run.
 */

const ADVISORY_KEY = "orbit_billing_run";
const SAVEPOINT = "orbit_sub_sp";
const MAX_CATCH_UP = 12;

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

type Tx = Prisma.TransactionClient;

type DueSubscription = Subscription & {
  plan: Plan;
  lines: (SubscriptionLine & {
    taxes: { tax: Tax }[];
    variant: ProductVariant & { product: Product; attributeValue: AttributeValue };
  })[];
};

export async function run(
  prisma: PrismaClient,
  input: BillingRunInput,
): Promise<BillingRunResult> {
  const startedAt = Date.now();
  const asOf = dateOnly(input.asOf);

  try {
    return await prisma.$transaction(
      async (tx) => {
        // 1 ─ Serialize runs: only one billing run may execute at a time.
        const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`
          SELECT pg_try_advisory_xact_lock(hashtext(${ADVISORY_KEY})) AS locked`;
        if (!locked) {
          return {
            status: "ALREADY_RUNNING",
            invoicesCreated: 0,
            skippedAlreadyBilled: 0,
            errors: 0,
            durationMs: Date.now() - startedAt,
          };
        }

        // 2 ─ Audit row (status RUNNING; finalized at the end).
        const runRow = await tx.billingRun.create({
          data: { triggerType: input.triggerType, triggeredById: input.triggeredById },
        });

        // 3 ─ Due subscriptions (uses INDEX (status, next_billing_date)).
        const due = await tx.subscription.findMany({
          where: {
            status: SubscriptionStatus.ACTIVE,
            nextBillingDate: { not: null, lte: asOf },
          },
          include: {
            plan: true,
            lines: {
              include: {
                taxes: { include: { tax: true } },
                variant: { include: { product: true, attributeValue: true } },
              },
            },
          },
          orderBy: { nextBillingDate: "asc" },
        });

        // System actor for machine-initiated transitions (auto-close from cron).
        const systemUserId =
          input.triggeredById ??
          (await tx.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } }))!.id;

        let created = 0;
        let skipped = 0;
        let errors = 0;

        // 4 ─ Each subscription is an isolated failure domain (PLAN §4): a
        // per-subscription SAVEPOINT wraps the whole loop (catch-up advance,
        // auto-close, anchor update), so any failure rolls back to a clean
        // point and errors++ — never aborting the run or other subscriptions.
        for (const sub of due) {
          try {
            const outcome = await processSubscription(tx, sub, asOf, runRow.id, systemUserId);
            created += outcome.created;
            skipped += outcome.skipped;
          } catch (err) {
            errors++;
            console.error(`[billing] subscription ${sub.number} failed:`, err);
          }
        }

        // 5 ─ Finalize audit.
        await tx.billingRun.update({
          where: { id: runRow.id },
          data: {
            status: "DONE",
            finishedAt: new Date(),
            invoicesCreated: created,
            skippedAlreadyBilled: skipped,
            errors,
          },
        });

        return {
          status: "DONE",
          invoicesCreated: created,
          skippedAlreadyBilled: skipped,
          errors,
          durationMs: Date.now() - startedAt,
        };
      },
      { maxWait: 10_000, timeout: 300_000 },
    );
  } catch (err) {
    console.error("[billing] run failed:", err);
    return {
      status: "FAILED",
      invoicesCreated: 0,
      skippedAlreadyBilled: 0,
      errors: 1,
      durationMs: Date.now() - startedAt,
    };
  }
}

/**
 * Invoice every due period of one subscription (catch-up loop) and advance its
 * anchor. The whole subscription's work runs under a SAVEPOINT: a P2002 on the
 * invoice insert marks the transaction "in aborted state" (Postgres 25P02) —
 * without ROLLBACK TO SAVEPOINT every later statement in this tx would fail.
 * Rolling back to the per-subscription savepoint undoes ONLY this
 * subscription's work and restores a usable transaction state.
 */
async function processSubscription(
  tx: Tx,
  sub: DueSubscription,
  asOf: Date,
  billingRunId: string,
  systemUserId: string,
): Promise<{ created: number; skipped: number }> {
  await tx.$executeRawUnsafe(`SAVEPOINT ${SAVEPOINT}`);
  try {
    let created = 0;
    let skipped = 0;
    let periodStart = dateOnly(sub.nextBillingDate!);
    let closed = false;
    let iterations = 0;

    while (periodStart <= asOf && iterations < MAX_CATCH_UP) {
      const periodEnd = addPeriod(periodStart, sub.plan.period);

      try {
        await createInvoiceForPeriod(tx, sub, periodStart, periodEnd, asOf, billingRunId);
        created++;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Already-billed period (catch-up over partial history, or a raced
          // concurrent run): the UNIQUE constraint fired. UNDO this period's
          // partial work + clear the aborted state, count "skipped", advance
          // the anchor past it — idempotent and observable (FR-BILL-03).
          await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${SAVEPOINT}`);
          skipped++;
        } else {
          throw err; // real failure → outer catch rolls back to the savepoint
        }
      }

      // Auto-close after the final invoiced period (FR-SUB-06).
      if (sub.plan.autoClose && dateOnly(sub.expiryDate) <= periodEnd) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.CLOSED, nextBillingDate: null },
        });
        await tx.subscriptionStatusHistory.create({
          data: {
            subscriptionId: sub.id,
            fromStatus: SubscriptionStatus.ACTIVE,
            toStatus: SubscriptionStatus.CLOSED,
            changedById: systemUserId,
            note: "Auto-closed by billing run (plan auto_close, expiry reached).",
          },
        });
        closed = true;
        break;
      }

      periodStart = periodEnd;
      iterations++;
    }

    // Advance the anchor (FR-BILL-08) — even for skipped (already-billed) periods.
    if (!closed) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { nextBillingDate: periodStart },
      });
    }

    await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${SAVEPOINT}`);
    return { created, skipped };
  } catch (err) {
    // Undo everything this subscription did; the transaction stays usable for
    // the remaining subscriptions.
    await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${SAVEPOINT}`);
    await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${SAVEPOINT}`);
    throw err;
  }
}

/**
 * Build one invoice for one period: snapshot lines, taxes, discounts, totals,
 * gapless number. The UNIQUE(subscription_id, period_start) constraint turns a
 * duplicate attempt into a P2002 the caller treats as "skipped".
 */
async function createInvoiceForPeriod(
  tx: Tx,
  sub: DueSubscription,
  periodStart: Date,
  periodEnd: Date,
  asOf: Date,
  billingRunId: string,
): Promise<void> {
  const periodLabel = `${periodStart.toISOString().slice(0, 10)} → ${periodEnd
    .toISOString()
    .slice(0, 10)}`;

  // Snapshot product lines from the subscription's frozen unit prices.
  let subtotal = new Prisma.Decimal(0);
  let taxTotal = new Prisma.Decimal(0);

  const productLines = sub.lines.map((line) => {
    const amount = new Prisma.Decimal(line.unitPrice).mul(line.quantity);
    subtotal = subtotal.add(amount);

    // Tax rule (SRS §6 rule 2): per line, snapshot of assigned ACTIVE taxes.
    const lineTax = line.taxes
      .filter((lt) => lt.tax.isActive)
      .reduce(
        (sum, lt) => sum.add(amount.mul(lt.tax.ratePercent).div(100).toDecimalPlaces(2)),
        new Prisma.Decimal(0),
      );
    taxTotal = taxTotal.add(lineTax);

    return {
      kind: "PRODUCT" as const,
      variantId: line.variantId,
      description: `${line.variant.product.name} (${line.variant.attributeValue.value}) — ${periodLabel}`,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxAmount: lineTax,
      lineTotal: amount,
    };
  });

  // Discounts — the engine hook (PLAN §4 step f). Contract: modules/discounts.
  const engineLines: EngineLine[] = sub.lines.map((line) => ({
    variantId: line.variantId,
    productId: line.variant.productId,
    quantity: line.quantity,
    amount: Number(line.unitPrice) * line.quantity,
  }));
  const evaluation = await evaluateDiscounts(tx, {
    subscriptionId: sub.id,
    lines: engineLines,
    asOf,
  });

  const discountLines = evaluation.discountLines.map((dl) => ({
    kind: "DISCOUNT" as const,
    variantId: null,
    description: `Discount — ${dl.description}`,
    quantity: 1,
    unitPrice: new Prisma.Decimal(dl.amount), // negative
    taxAmount: new Prisma.Decimal(0),
    lineTotal: new Prisma.Decimal(dl.amount),
  }));

  const discountTotal = new Prisma.Decimal(evaluation.total).abs();
  const grandTotal = subtotal.add(taxTotal).sub(discountTotal);

  const number = await nextNumber(tx, "INV", asOf);

  await tx.invoice.create({
    data: {
      number,
      customerId: sub.customerId,
      subscriptionId: sub.id,
      billingRunId,
      issueDate: asOf,
      dueDate: addDays(asOf, sub.paymentTermsDays),
      status: "CONFIRMED", // billing-day invoices arrive confirmed (PLAN §4 g)
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      periodStart,
      periodEnd,
      lines: { create: [...productLines, ...discountLines] },
      discountUsages: evaluation.usages.length
        ? {
            create: evaluation.usages.map((u) => ({
              ruleId: u.ruleId,
              appliedAmount: new Prisma.Decimal(u.appliedAmount).abs(),
            })),
          }
        : undefined,
    },
  });
}
