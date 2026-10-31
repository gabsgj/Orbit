/**
 * shared/lib/audit — FR-ADM-03: Global audit log for sensitive actions.
 *
 * Every module (auth, billing, discounts, …) calls logAudit() with the
 * Prisma client or transaction it already holds.  Framework-free — no
 * next/trpc imports — so services stay pure and unit-testable.
 *
 * Action constants are exported as a const object so callers never
 * hand-type strings (typo-safe by construction).
 */
import type { PrismaClient, Prisma } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

// ── Action constants ────────────────────────────────────────────────────────

/** Canonical audit-action strings. Import this object, never hand-type. */
export const AuditAction = {
  STAFF_CREATED: "STAFF_CREATED",
  STAFF_DEACTIVATED: "STAFF_DEACTIVATED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  SUBSCRIPTION_TRANSITION: "SUBSCRIPTION_TRANSITION",
  PAYMENT_RECORDED: "PAYMENT_RECORDED",
  DISCOUNT_APPLIED: "DISCOUNT_APPLIED",
  BILLING_RUN: "BILLING_RUN",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

// ── Input / output ──────────────────────────────────────────────────────────

export interface LogAuditInput {
  /** The user who performed the action. */
  userId: string;
  /** Domain entity name, e.g. "user", "subscription", "invoice". */
  entity: string;
  /** Primary key of the affected row. */
  entityId: string;
  /** One of AuditAction.* constants. */
  action: AuditActionValue;
  /** Optional JSON-serialisable metadata (diffs, reasons, amounts, …). */
  meta?: Prisma.InputJsonValue;
}

/**
 * Writes one row to audit_log.  Pass the prisma client (or an active
 * transaction) so the audit row commits atomically with the business write.
 */
export async function logAudit(db: Db, input: LogAuditInput) {
  return (db as PrismaClient).auditLog.create({
    data: {
      userId: input.userId,
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      meta: input.meta ?? undefined,
    },
  });
}
