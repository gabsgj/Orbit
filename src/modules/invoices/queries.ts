import type { Prisma, PrismaClient } from "@prisma/client";
import type { ListInvoicesInput } from "./schemas";
import { dateOnly } from "@/shared/lib/dates";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function findInvoiceById(tx: Tx, id: string) {
  return tx.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      subscription: {
        include: {
          plan: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
      lines: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
              attributeValue: { select: { value: true } },
            },
          },
        },
        orderBy: { kind: "asc" },
      },
      payments: {
        include: {
          recordedBy: { select: { email: true } },
        },
        orderBy: { paidAt: "desc" },
      },
      discountUsages: {
        include: {
          rule: { select: { name: true, kind: true, value: true } },
        },
      },
    },
  });
}

export async function listInvoices(tx: Tx, input: ListInvoicesInput) {
  const where: Prisma.InvoiceWhereInput = {};
  const today = dateOnly(new Date());

  if (input.customerId) {
    where.customerId = input.customerId;
  }
  if (input.subscriptionId) {
    where.subscriptionId = input.subscriptionId;
  }
  if (input.status) {
    where.status = input.status;
  }
  if (input.fromDate || input.toDate) {
    where.issueDate = {};
    if (input.fromDate) where.issueDate.gte = input.fromDate;
    if (input.toDate) where.issueDate.lte = input.toDate;
  }
  if (input.overdueOnly) {
    // SRS §6 rule 6: status = CONFIRMED AND due_date < today AND amount_paid < grand_total
    where.status = "CONFIRMED";
    where.dueDate = { lt: today };
    // Prisma does not support comparing columns directly in where object,
    // but grandTotal > amountPaid is guaranteed for CONFIRMED invoices unless amountPaid == grandTotal (which auto-flips to PAID)
  }
  if (input.search) {
    where.OR = [
      { number: { contains: input.search, mode: "insensitive" } },
      { customer: { companyName: { contains: input.search, mode: "insensitive" } } },
    ];
  }

  const items = await tx.invoice.findMany({
    where,
    include: {
      customer: { select: { companyName: true, user: { select: { email: true } } } },
      subscription: { select: { number: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { issueDate: "desc" },
    take: input.limit,
  });

  // Calculate totals footer summary
  const totals = await tx.invoice.aggregate({
    where,
    _sum: {
      subtotal: true,
      taxTotal: true,
      discountTotal: true,
      grandTotal: true,
      amountPaid: true,
    },
  });

  const sumGrandTotal = Number(totals._sum.grandTotal ?? 0);
  const sumAmountPaid = Number(totals._sum.amountPaid ?? 0);
  const sumOutstanding = Math.max(0, sumGrandTotal - sumAmountPaid);

  return {
    items,
    totals: {
      subtotal: Number(totals._sum.subtotal ?? 0),
      taxTotal: Number(totals._sum.taxTotal ?? 0),
      discountTotal: Number(totals._sum.discountTotal ?? 0),
      grandTotal: sumGrandTotal,
      amountPaid: sumAmountPaid,
      outstanding: sumOutstanding,
    },
  };
}
