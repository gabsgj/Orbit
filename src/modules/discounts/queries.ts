import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateDiscountRuleInput, UpdateDiscountRuleInput } from "./schemas";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function findActiveRulesForDate(tx: Tx, asOf: Date) {
  return tx.discountRule.findMany({
    where: {
      isActive: true,
      startDate: { lte: asOf },
      endDate: { gte: asOf },
    },
    include: {
      products: true,
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listRules(
  tx: Tx,
  params: { search?: string; scope?: "PRODUCT" | "SUBSCRIPTION"; isActive?: boolean; limit?: number },
) {
  const where: Prisma.DiscountRuleWhereInput = {};
  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }
  if (params.scope) {
    where.scope = params.scope;
  }
  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  return tx.discountRule.findMany({
    where,
    include: {
      products: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function getRuleById(tx: Tx, id: string) {
  return tx.discountRule.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
      usages: {
        include: {
          invoice: {
            select: { id: true, number: true, issueDate: true, grandTotal: true },
          },
        },
        orderBy: { appliedAt: "desc" },
        take: 100,
      },
      _count: {
        select: { usages: true },
      },
    },
  });
}

export async function createRule(tx: Tx, input: CreateDiscountRuleInput) {
  return tx.discountRule.create({
    data: {
      name: input.name,
      kind: input.kind,
      value: input.value,
      minPurchase: input.minPurchase ?? null,
      minQuantity: input.minQuantity ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      usageLimit: input.usageLimit ?? null,
      scope: input.scope,
      products:
        input.scope === "PRODUCT" && input.productIds && input.productIds.length > 0
          ? {
              create: input.productIds.map((productId) => ({ productId })),
            }
          : undefined,
    },
    include: {
      products: true,
      _count: { select: { usages: true } },
    },
  });
}

export async function updateRule(tx: Tx, input: UpdateDiscountRuleInput) {
  const { id, productIds, ...rest } = input;

  if (productIds !== undefined) {
    await tx.discountRuleProduct.deleteMany({ where: { ruleId: id } });
    if (productIds.length > 0) {
      await tx.discountRuleProduct.createMany({
        data: productIds.map((productId) => ({ ruleId: id, productId })),
      });
    }
  }

  return tx.discountRule.update({
    where: { id },
    data: rest,
    include: {
      products: true,
      _count: { select: { usages: true } },
    },
  });
}

export async function deleteRule(tx: Tx, id: string) {
  return tx.discountRule.delete({ where: { id } });
}
