import { Prisma, type PrismaClient, type PaymentMethod, type Payment, type Invoice } from "@prisma/client";
import { findInvoiceForPayment } from "./queries";

type Tx = Prisma.TransactionClient | PrismaClient;

export class PaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export interface RecordPaymentParams {
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  paidAt?: Date;
  note?: string;
  recordedById: string;
}

export interface RecordPaymentResult {
  payment: Payment;
  invoice: Invoice;
  settled: boolean;
}

/**
 * PaymentService.record — transactional settlement & overpayment guard (FR-PAY-01…03).
 */
export async function recordPayment(
  tx: Tx,
  input: RecordPaymentParams,
): Promise<RecordPaymentResult> {
  const { invoiceId, method, amount, paidAt = new Date(), note, recordedById } = input;

  if (amount <= 0) {
    throw new PaymentError("INVALID_AMOUNT", "Payment amount must be strictly positive.", {
      amount,
    });
  }

  const invoice = await findInvoiceForPayment(tx, invoiceId);
  if (!invoice) {
    throw new PaymentError("INVOICE_NOT_FOUND", "Invoice not found.", { invoiceId });
  }

  if (invoice.status === "PAID") {
    throw new PaymentError("ALREADY_PAID", "Invoice is already fully paid.", {
      invoiceId,
    });
  }

  if (invoice.status === "CANCELLED") {
    throw new PaymentError("INVOICE_CANCELLED", "Cannot record payment on a cancelled invoice.", {
      invoiceId,
    });
  }

  const grandTotal = Number(invoice.grandTotal);
  const currentPaid = Number(invoice.amountPaid);
  const outstanding = Math.round((grandTotal - currentPaid) * 100) / 100;

  // Overpayment guard: amount cannot exceed outstanding balance
  if (amount > outstanding) {
    throw new PaymentError(
      "OVERPAYMENT",
      `Payment amount (₹${amount.toFixed(2)}) exceeds outstanding balance (₹${outstanding.toFixed(2)}).`,
      { amount, outstanding },
    );
  }

  const payment = await tx.payment.create({
    data: {
      invoiceId,
      method,
      amount: new Prisma.Decimal(amount),
      paidAt,
      note: note ?? null,
      recordedById,
    },
  });

  const newPaid = Math.round((currentPaid + amount) * 100) / 100;
  const isSettled = newPaid >= grandTotal;

  const updatedInvoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: new Prisma.Decimal(newPaid),
      status: isSettled ? "PAID" : invoice.status,
    },
  });

  return {
    payment,
    invoice: updatedInvoice,
    settled: isSettled,
  };
}
