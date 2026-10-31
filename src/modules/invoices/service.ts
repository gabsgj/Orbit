import type { Prisma, PrismaClient, InvoiceStatus } from "@prisma/client";
import { findInvoiceById } from "./queries";
import { formatINR, formatDate } from "@/shared/lib/money";

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
