import type { Prisma, PrismaClient } from "@prisma/client";
import type { ListSubscriptionsInput } from "./schemas";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function findSubscriptionById(tx: Tx, id: string) {
  return tx.subscription.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      plan: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
      template: {
        select: { id: true, name: true },
      },
      lines: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true } },
              attributeValue: { select: { id: true, value: true } },
            },
          },
          taxes: {
            include: {
              tax: true,
            },
          },
        },
      },
      statusHistory: {
        include: {
          changedBy: { select: { id: true, email: true } },
        },
        orderBy: { changedAt: "desc" },
      },
      invoices: {
        select: {
          id: true,
          number: true,
          issueDate: true,
          dueDate: true,
          status: true,
          grandTotal: true,
          amountPaid: true,
        },
        orderBy: { issueDate: "desc" },
      },
    },
  });
}

export async function listSubscriptions(tx: Tx, input: ListSubscriptionsInput) {
  const where: Prisma.SubscriptionWhereInput = {};

  if (input.customerId) {
    where.customerId = input.customerId;
  }
  if (input.planId) {
    where.planId = input.planId;
  }
  if (input.status) {
    where.status = input.status;
  }
  if (input.search) {
    where.OR = [
      { number: { contains: input.search, mode: "insensitive" } },
      { customer: { companyName: { contains: input.search, mode: "insensitive" } } },
    ];
  }

  return tx.subscription.findMany({
    where,
    include: {
      customer: { select: { id: true, companyName: true } },
      plan: {
        select: {
          id: true,
          period: true,
          price: true,
          product: { select: { name: true } },
        },
      },
      _count: { select: { lines: true, invoices: true } },
    },
    orderBy: { createdAt: "desc" },
    take: input.limit,
  });
}

export async function findPlanById(tx: Tx, planId: string) {
  return tx.plan.findUnique({
    where: { id: planId },
    include: { product: true },
  });
}

export async function findTemplateWithLines(tx: Tx, templateId: string) {
  return tx.quotationTemplate.findUnique({
    where: { id: templateId },
    include: {
      plan: true,
      lines: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
}
