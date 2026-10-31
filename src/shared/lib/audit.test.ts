/**
 * shared/lib/audit — Tests for the audit-log helper (FR-ADM-03).
 * Writes a real row to orbit_test and reads it back to prove meta JSON
 * round-trips intact.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { logAudit, AuditAction } from "./audit";

const testDb = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

async function cleanAuditLog() {
  await testDb.auditLog.deleteMany({
    where: { user: { email: { contains: "@orbit.test" } } },
  });
  await testDb.user.deleteMany({
    where: { email: { contains: "@orbit.test" } },
  });
}

describe("logAudit — FR-ADM-03", () => {
  beforeEach(cleanAuditLog);

  it("writes an audit_log row and reads it back with meta JSON intact", async () => {
    // Need a real user row for the FK
    const user = await testDb.user.create({
      data: {
        email: `audit+${Date.now()}@orbit.test`,
        passwordHash: "hash",
        role: "ADMIN",
      },
    });

    const meta = { oldPrice: "999.00", newPrice: "1299.00", reason: "Annual repricing" };

    const row = await logAudit(testDb, {
      userId: user.id,
      entity: "plan",
      entityId: user.id, // any uuid works for the round-trip test
      action: AuditAction.SUBSCRIPTION_TRANSITION,
      meta,
    });

    expect(row.id).toBeTruthy();
    expect(row.userId).toBe(user.id);
    expect(row.entity).toBe("plan");
    expect(row.action).toBe("SUBSCRIPTION_TRANSITION");
    expect(row.at).toBeInstanceOf(Date);

    // Read it back and verify meta JSON survived the round-trip
    const readBack = await testDb.auditLog.findUniqueOrThrow({
      where: { id: row.id },
    });
    expect(readBack.meta).toEqual(meta);
  });

  it("works with meta omitted (undefined)", async () => {
    const user = await testDb.user.create({
      data: {
        email: `audit-nometa+${Date.now()}@orbit.test`,
        passwordHash: "hash",
        role: "STAFF",
      },
    });

    const row = await logAudit(testDb, {
      userId: user.id,
      entity: "user",
      entityId: user.id,
      action: AuditAction.STAFF_CREATED,
    });

    expect(row.meta).toBeNull();
  });

  it("exposes all action constants", () => {
    expect(AuditAction.STAFF_CREATED).toBe("STAFF_CREATED");
    expect(AuditAction.STAFF_DEACTIVATED).toBe("STAFF_DEACTIVATED");
    expect(AuditAction.PASSWORD_RESET_REQUESTED).toBe("PASSWORD_RESET_REQUESTED");
    expect(AuditAction.SUBSCRIPTION_TRANSITION).toBe("SUBSCRIPTION_TRANSITION");
    expect(AuditAction.PAYMENT_RECORDED).toBe("PAYMENT_RECORDED");
    expect(AuditAction.DISCOUNT_APPLIED).toBe("DISCOUNT_APPLIED");
    expect(AuditAction.BILLING_RUN).toBe("BILLING_RUN");
  });
});
