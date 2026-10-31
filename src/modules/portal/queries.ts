import type { Prisma, PrismaClient, SubscriptionStatus, InvoiceStatus } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function findCustomerByUserId(tx: Tx, userId: string) {
  return tx.customer.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export interface ListCustomerSubscriptionsParams {
  customerId: string;
  status?: SubscriptionStatus;
  limit?: number;
  offset?: number;
}

export async function listCustomerSubscriptions(
  tx: Tx,
  params: ListCustomerSubscriptionsParams,
) {
  const { customerId, status, limit = 50, offset = 0 } = params;

  return tx.subscription.findMany({
    where: {
      customerId,
      ...(status ? { status } : {}),
    },
    include: {
      plan: {
        include: {
          product: true,
        },
      },
      lines: {
        include: {
          variant: true,
        },
      },
      _count: {
        select: {
          invoices: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getCustomerSubscription(
  tx: Tx,
  customerId: string,
  subscriptionId: string,
) {
  return tx.subscription.findFirst({
    where: {
      id: subscriptionId,
      customerId, // Scoped to customer
    },
    include: {
      plan: {
        include: {
          product: true,
        },
      },
      lines: {
        include: {
          variant: true,
          taxes: true,
        },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        include: {
          payments: {
            orderBy: { paidAt: "desc" },
          },
        },
      },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: {
          changedBy: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

export interface ListCustomerInvoicesParams {
  customerId: string;
  status?: InvoiceStatus;
  limit?: number;
  offset?: number;
}

export async function listCustomerInvoices(
  tx: Tx,
  params: ListCustomerInvoicesParams,
) {
  const { customerId, status, limit = 50, offset = 0 } = params;

  return tx.invoice.findMany({
    where: {
      customerId,
      ...(status ? { status } : {}),
    },
    include: {
      subscription: {
        select: {
          id: true,
          number: true,
        },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: { issueDate: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getCustomerInvoice(
  tx: Tx,
  customerId: string,
  invoiceId: string,
) {
  return tx.invoice.findFirst({
    where: {
      id: invoiceId,
      customerId, // Scoped to customer
    },
    include: {
      customer: true,
      subscription: {
        include: {
          plan: {
            include: {
              product: true,
            },
          },
        },
      },
      lines: true,
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });
}
