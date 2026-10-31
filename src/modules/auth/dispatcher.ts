/**
 * modules/auth — FR-MAIL-03: env-gated SMTP dispatcher.
 *
 * Offline by default: when SMTP_URL is unset the mail stays queued in
 * `email_outbox` (the judged demo runs fully offline). When SMTP_URL points
 * to an http(s) webhook, a real sender is built with `fetch` — no new deps.
 *
 * The `SendFn` signature is deliberately transport-agnostic so a real SMTP
 * client (nodemailer, etc.) can be dropped in later without touching the
 * dispatch loop.
 */
import type { PrismaClient, Prisma } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

// ── Transport contract ────────────────────────────────────────────────────────

/** One staged email row, as the dispatcher reads it. */
export interface OutboxRow {
  id: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  kind: string;
  createdAt: Date;
}

/**
 * Transport-agnostic send function.
 *
 * Implementations MUST throw on failure (the dispatcher leaves the row
 * queued). A future real-SMTP implementation only needs to satisfy this
 * signature — the dispatch loop does not change.
 */
export type SendFn = (row: OutboxRow) => Promise<void>;

export interface DispatchResult {
  sent: number;
  failed: number;
}

// ── Transport factory ─────────────────────────────────────────────────────────

/**
 * Builds a transport from env, or returns null when offline.
 *
 * Supported:
 *   SMTP_URL="https://hooks.example.com/mail"  → webhook sender (fetch POST)
 *   SMTP_URL="" / unset                         → offline mode (returns null)
 *
 * Offline is the demo default: mail stays queued in email_outbox and the
 * admin outbox viewer proves the flow without internet.
 */
export function getTransport(): SendFn | null {
  const url = process.env.SMTP_URL;
  if (!url) {
    console.log("SMTP_URL unset — offline mode, mail stays queued");
    return null;
  }
  if (!url.startsWith("http")) {
    console.log(
      `SMTP_URL "${url}" is not a webhook (must start with http) — offline mode`,
    );
    return null;
  }

  // Webhook transport: POST { to, subject, html, kind } as JSON.
  return async (row: OutboxRow) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: row.toEmail,
        subject: row.subject,
        html: row.bodyHtml,
        kind: row.kind,
      }),
    });
    if (!res.ok) {
      throw new Error(`Webhook ${res.status}: ${await res.text()}`);
    }
  };
}

// ── Dispatch loop ─────────────────────────────────────────────────────────────

const BATCH_LIMIT = 50;

/**
 * Finds up to 50 queued (sentAt IS NULL) outbox rows and sends each via the
 * injected `send` fn. On success the row is marked sentAt=now; on failure the
 * row stays queued and the error counter increments.
 *
 * Returns { sent, failed }.
 */
export async function dispatchPendingEmails(
  db: Db,
  send: SendFn,
): Promise<DispatchResult> {
  const pending = await (db as PrismaClient).emailOutbox.findMany({
    where: { sentAt: null },
    orderBy: { createdAt: "asc" },
    take: BATCH_LIMIT,
  });

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      await send(row);
      await (db as PrismaClient).emailOutbox.update({
        where: { id: row.id },
        data: { sentAt: new Date() },
      });
      sent += 1;
    } catch {
      failed += 1;
      // Row stays queued (sentAt remains NULL) — retried on the next run.
    }
  }

  return { sent, failed };
}
