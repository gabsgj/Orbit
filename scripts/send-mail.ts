/**
 * scripts/send-mail.ts — CLI for FR-MAIL-03.
 *
 * Usage:  npx tsx scripts/send-mail.ts
 *
 * Prints the transport status (offline vs webhook), dispatches any queued
 * email_outbox rows, and prints the { sent, failed } result. Never crashes
 * on an unset SMTP_URL — offline is the demo default.
 */
import { PrismaClient } from "@prisma/client";
import { dispatchPendingEmails, getTransport } from "../src/modules/auth/dispatcher";

async function main() {
  const db = new PrismaClient();
  try {
    const send = getTransport();
    if (!send) {
      // Offline default: nothing to do — mail stays queued.
      const queued = await db.emailOutbox.count({ where: { sentAt: null } });
      console.log(`Queued in email_outbox: ${queued}`);
      console.log({ sent: 0, failed: 0 });
      return;
    }

    console.log("Transport: webhook (SMTP_URL configured)");
    const result = await dispatchPendingEmails(db, send);
    console.log(result);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
