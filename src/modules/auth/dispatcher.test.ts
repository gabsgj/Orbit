/**
 * modules/auth — FR-MAIL-03 dispatcher unit tests (vitest).
 * Runs against orbit_test DB (TEST_DATABASE_URL) per the project test infra.
 *
 * Uses a fake `send` fn: two rows succeed, one throws →
 * sent=2, failed=1, and the failed row stays queued (sentAt IS NULL).
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  dispatchPendingEmails,
  type OutboxRow,
  type SendFn,
} from "./dispatcher";

const testDb = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

async function truncateOutbox() {
  await testDb.emailOutbox.deleteMany();
}

async function stageRow(
  toEmail: string,
  kind: "RESET" | "INVOICE_SENT" | "REMINDER" = "RESET",
) {
  return testDb.emailOutbox.create({
    data: { toEmail, subject: `subj-${toEmail}`, bodyHtml: "<p>hi</p>", kind },
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe("dispatchPendingEmails — FR-MAIL-03", () => {
  beforeEach(truncateOutbox);
  afterAll(async () => {
    await truncateOutbox();
    await testDb.$disconnect();
  });

  it("sends 2, fails 1, leaves the failed row queued", async () => {
    const a = await stageRow("a@orbit.test");
    const b = await stageRow("b@orbit.test");
    const c = await stageRow("c@orbit.test");

    // Fake transport: succeed for a and b, throw for c.
    const fakeSend: SendFn = async (row: OutboxRow) => {
      if (row.id === c.id) throw new Error("simulated SMTP failure");
    };

    const result = await dispatchPendingEmails(testDb, fakeSend);
    expect(result).toEqual({ sent: 2, failed: 1 });

    // The two successful rows are marked sent.
    const aRow = await testDb.emailOutbox.findUnique({ where: { id: a.id } });
    const bRow = await testDb.emailOutbox.findUnique({ where: { id: b.id } });
    expect(aRow?.sentAt).not.toBeNull();
    expect(bRow?.sentAt).not.toBeNull();

    // The failed row is still queued.
    const cRow = await testDb.emailOutbox.findUnique({ where: { id: c.id } });
    expect(cRow?.sentAt).toBeNull();
  });

  it("returns { sent: 0, failed: 0 } when the queue is empty", async () => {
    const noop: SendFn = async () => {};
    const result = await dispatchPendingEmails(testDb, noop);
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("does not send rows that are already sent (sentAt set)", async () => {
    await stageRow("queued@orbit.test");
    await testDb.emailOutbox.create({
      data: {
        toEmail: "already@orbit.test",
        subject: "old",
        bodyHtml: "<p>old</p>",
        kind: "RESET",
        sentAt: new Date(),
      },
    });

    const calls: string[] = [];
    const spy: SendFn = async (row: OutboxRow) => {
      calls.push(row.toEmail);
    };

    const result = await dispatchPendingEmails(testDb, spy);
    expect(result).toEqual({ sent: 1, failed: 0 });
    expect(calls).toEqual(["queued@orbit.test"]);
  });
});
