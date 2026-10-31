import type { Prisma, PrismaClient, InvoiceStatus } from "@prisma/client";
import { findInvoiceById } from "./queries";
import { formatINR, formatDate } from "@/shared/lib/money";
import { dateOnly } from "@/shared/lib/dates";
import { logAudit } from "@/shared/lib/audit";

type Tx = Prisma.TransactionClient | PrismaClient;

export class InvoiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "InvoiceError";
  }
}

export const LEGAL_INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

/**
 * Confirm invoice: moves DRAFT → CONFIRMED (FR-INV-01).
 */
export async function confirmInvoice(tx: Tx, input: { invoiceId: string }) {
  const inv = await findInvoiceById(tx, input.invoiceId);
  if (!inv) {
    throw new InvoiceError("NOT_FOUND", "Invoice not found.", { id: input.invoiceId });
  }

  if (inv.status !== "DRAFT") {
    throw new InvoiceError(
      "ILLEGAL_TRANSITION",
      `Cannot confirm invoice in status ${inv.status}. Only DRAFT invoices can be confirmed.`,
      { from: inv.status, to: "CONFIRMED" },
    );
  }

  return tx.invoice.update({
    where: { id: inv.id },
    data: { status: "CONFIRMED" },
    include: { customer: true, subscription: true },
  });
}

/**
 * Cancel invoice: moves DRAFT/CONFIRMED → CANCELLED (gated on amountPaid == 0).
 */
export async function cancelInvoice(
  tx: Tx,
  input: { invoiceId: string; reason?: string },
) {
  const inv = await findInvoiceById(tx, input.invoiceId);
  if (!inv) {
    throw new InvoiceError("NOT_FOUND", "Invoice not found.", { id: input.invoiceId });
  }

  if (inv.status !== "DRAFT" && inv.status !== "CONFIRMED") {
    throw new InvoiceError(
      "ILLEGAL_TRANSITION",
      `Cannot cancel invoice in status ${inv.status}.`,
      { status: inv.status },
    );
  }

  if (Number(inv.amountPaid) > 0) {
    throw new InvoiceError(
      "INVOICE_HAS_PAYMENTS",
      `Cannot cancel invoice with recorded payments (amount paid: ₹${Number(inv.amountPaid).toFixed(2)}).`,
      { amountPaid: inv.amountPaid },
    );
  }

  return tx.invoice.update({
    where: { id: inv.id },
    data: { status: "CANCELLED" },
    include: { customer: true, subscription: true },
  });
}

/**
 * Send invoice: stages email in email_outbox (FR-INV-02, offline wow).
 */
export async function sendInvoice(tx: Tx, input: { invoiceId: string }) {
  const inv = await findInvoiceById(tx, input.invoiceId);
  if (!inv) {
    throw new InvoiceError("NOT_FOUND", "Invoice not found.", { id: input.invoiceId });
  }

  const toEmail = inv.customer.user.email;
  const subject = `Invoice ${inv.number} from Brightloop Software`;
  const grandTotalStr = formatINR(inv.grandTotal);
  const dueDateStr = formatDate(inv.dueDate);

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Invoice ${inv.number}</h2>
      <p>Dear ${inv.customer.companyName},</p>
      <p>Your subscription invoice for ${grandTotalStr} has been issued and is due on <strong>${dueDateStr}</strong>.</p>
      <p>Thank you for partnering with Brightloop Software.</p>
    </div>
  `.trim();

  const outbox = await tx.emailOutbox.create({
    data: {
      toEmail,
      subject,
      bodyHtml,
      kind: "INVOICE_SENT",
    },
  });

  return {
    invoiceId: inv.id,
    outboxId: outbox.id,
    toEmail,
  };
}

/**
 * Send payment reminder: stages a professional overdue notice in email_outbox
 * (FR-PAY-06 — offline dunning; kind=REMINDER, queued until SMTP is configured).
 *
 * Guard mirrors SRS §6 rule 6 exactly: an invoice is overdue (and therefore
 * dunnable) only when status = CONFIRMED ∧ due_date < today ∧ outstanding > 0.
 */
export async function sendReminder(
  tx: Tx,
  input: { invoiceId: string; sentByUserId: string; baseUrl?: string },
) {
  const inv = await findInvoiceById(tx, input.invoiceId);
  if (!inv) {
    throw new InvoiceError("NOT_FOUND", "Invoice not found.", { id: input.invoiceId });
  }

  // Rule 6 guard — every violation gets a clear, specific error message.
  if (inv.status !== "CONFIRMED") {
    throw new InvoiceError(
      "NOT_OVERDUE",
      `Cannot send a reminder for invoice ${inv.number}: status is ${inv.status}. Only CONFIRMED (posted) invoices can be overdue.`,
      { status: inv.status },
    );
  }

  const outstanding = Math.max(0, Number(inv.grandTotal) - Number(inv.amountPaid));
  if (outstanding <= 0) {
    throw new InvoiceError(
      "NOT_OVERDUE",
      `Cannot send a reminder for invoice ${inv.number}: nothing is outstanding (already fully paid).`,
      { grandTotal: inv.grandTotal, amountPaid: inv.amountPaid },
    );
  }

  const today = dateOnly(new Date());
  if (dateOnly(new Date(inv.dueDate)) >= today) {
    throw new InvoiceError(
      "NOT_OVERDUE",
      `Cannot send a reminder for invoice ${inv.number}: it is not overdue yet (due ${formatDate(inv.dueDate)}).`,
      { dueDate: inv.dueDate },
    );
  }

  const toEmail = inv.customer.user.email;
  const subject = `Payment reminder: Invoice ${inv.number} is overdue`;
  const outstandingStr = formatINR(outstanding);
  const grandTotalStr = formatINR(inv.grandTotal);
  const dueDateStr = formatDate(inv.dueDate);
  const termsDays = inv.subscription.paymentTermsDays;
  // baseUrl is accepted for signature parity with other mail services (reset
  // links, portal deep links); the offline reminder body needs no link today.
  void input.baseUrl;

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Payment Reminder — Invoice ${inv.number}</h2>
      <p>Dear ${inv.customer.companyName},</p>
      <p>
        This is a friendly reminder that invoice <strong>${inv.number}</strong> for
        <strong>${grandTotalStr}</strong> was due on <strong>${dueDateStr}</strong> and
        remains unpaid. The outstanding balance is <strong>${outstandingStr}</strong>.
      </p>
      <p>
        Our records show the payment terms for this subscription are net ${termsDays} days.
        Kindly arrange payment at your earliest convenience to keep your subscription in good standing.
      </p>
      <p>If you have already made the payment, please disregard this notice.</p>
      <p>Thank you for partnering with Brightloop Software.</p>
    </div>
  `.trim();

  const outbox = await tx.emailOutbox.create({
    data: {
      toEmail,
      subject,
      bodyHtml,
      kind: "REMINDER",
    },
  });

  // shared/lib/audit.ts has no REMINDER_SENT constant and shared/ is off-limits
  // to this change — AuditLog.action is a free text column, so we log the
  // canonical string directly (cast to satisfy the const-object type).
  await logAudit(tx, {
    userId: input.sentByUserId,
    entity: "invoice",
    entityId: inv.id,
    action: "REMINDER_SENT" as never,
    meta: {
      invoiceNumber: inv.number,
      toEmail,
      outboxId: outbox.id,
      outstanding,
      dueDate: dateOnly(new Date(inv.dueDate)).toISOString().slice(0, 10),
    },
  });

  return { ok: true as const, outboxId: outbox.id };
}
