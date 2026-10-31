import type { Prisma, PrismaClient } from "@prisma/client";
import { dateOnly } from "@/shared/lib/dates";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function findInvoiceForPayment(tx: Tx, invoiceId: string) {
  return tx.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      number: true,
      status: true,
      grandTotal: true,
      amountPaid: true,
      dueDate: true,
    },
  });
}

export async function listPayments(
  tx: Tx,
  params: { invoiceId?: string; customerId?: string; limit?: number },
) {
  const where: Prisma.PaymentWhereInput = {};
  if (params.invoiceId) {
    where.invoiceId = params.invoiceId;
  }
  if (params.customerId) {
    where.invoice = { customerId: params.customerId };
  }

  return tx.payment.findMany({
    where,
    include: {
      invoice: {
        select: {
          id: true,
          number: true,
          grandTotal: true,
          customer: { select: { companyName: true } },
        },
      },
      recordedBy: { select: { email: true } },
    },
    orderBy: { paidAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function listOverdueInvoices(tx: Tx) {
  const today = dateOnly(new Date());

  return tx.invoice.findMany({
    where: {
      status: "CONFIRMED",
      dueDate: { lt: today },
    },
    include: {
      customer: { select: { companyName: true } },
      subscription: { select: { number: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}
