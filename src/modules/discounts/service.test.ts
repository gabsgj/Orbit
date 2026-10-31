import { describe, it, expect, vi } from "vitest";
import { evaluate, type EngineLine } from "./service";
import type { PrismaClient } from "@prisma/client";

describe("DiscountEngine — evaluate (SRS §6 rules 3-4)", () => {
  const asOf = new Date("2026-06-15T00:00:00.000Z");

  const lines: EngineLine[] = [
    {
      productId: "prod-crm",
      variantId: "var-crm-1",
      quantity: 5,
      amount: 1000,
    },
    {
      productId: "prod-addon",
      variantId: "var-addon-1",
      quantity: 2,
      amount: 500,
    },
  ];

  it("applies product-scope discount to matching line only", async () => {
    const mockRules = [
      {
        id: "rule-prod-10pct",
        name: "10% off CRM",
        kind: "PERCENT" as const,
        value: 10,
        scope: "PRODUCT" as const,
        minQuantity: null,
        minPurchase: null,
        usageLimit: null,
        isActive: true,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        products: [{ productId: "prod-crm" }],
        _count: { usages: 0 },
      },
    ];

    const mockTx = {
      discountRule: {
        findMany: vi.fn().mockResolvedValue(mockRules),
      },
    };

    const result = await evaluate(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-1",
      lines,
      asOf,
    });

    expect(result.discountLines).toHaveLength(1);
    expect(result.discountLines[0].ruleId).toBe("rule-prod-10pct");
    expect(result.discountLines[0].amount).toBe(-100); // 10% of 1000
    expect(result.usages[0].appliedAmount).toBe(100);
    expect(result.total).toBe(-100);
  });

  it("enforces precedence: product-scope first, then subscription-scope on reduced subtotal", async () => {
    const mockRules = [
      {
        id: "rule-prod-fixed",
        name: "₹200 off CRM",
        kind: "FIXED" as const,
        value: 200,
        scope: "PRODUCT" as const,
        minQuantity: null,
        minPurchase: null,
        usageLimit: null,
        isActive: true,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        products: [{ productId: "prod-crm" }],
        _count: { usages: 0 },
      },
      {
        id: "rule-sub-10pct",
        name: "10% off whole subscription",
        kind: "PERCENT" as const,
        value: 10,
        scope: "SUBSCRIPTION" as const,
        minQuantity: null,
        minPurchase: null,
        usageLimit: null,
        isActive: true,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        products: [],
        _count: { usages: 0 },
      },
    ];

    const mockTx = {
      discountRule: {
        findMany: vi.fn().mockResolvedValue(mockRules),
      },
    };

    const result = await evaluate(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-1",
      lines, // Total: 1000 + 500 = 1500
      asOf,
    });

    // Product discount: ₹200 off CRM (remaining CRM: 800, remaining total: 800 + 500 = 1300)
    // Subscription discount: 10% of 1300 = 130
    // Total discount = -200 + -130 = -330
    expect(result.discountLines).toHaveLength(2);
    expect(result.discountLines[0].amount).toBe(-200);
    expect(result.discountLines[1].amount).toBe(-130);
    expect(result.total).toBe(-330);
  });

  it("caps fixed discount at remaining subtotal (never below zero)", async () => {
    const mockRules = [
      {
        id: "rule-huge-fixed",
        name: "Huge ₹5000 off",
        kind: "FIXED" as const,
        value: 5000,
        scope: "SUBSCRIPTION" as const,
        minQuantity: null,
        minPurchase: null,
        usageLimit: null,
        isActive: true,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        products: [],
        _count: { usages: 0 },
      },
    ];

    const mockTx = {
      discountRule: {
        findMany: vi.fn().mockResolvedValue(mockRules),
      },
    };

    const result = await evaluate(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-1",
      lines: [{ productId: "p1", variantId: "v1", quantity: 1, amount: 800 }],
      asOf,
    });

    expect(result.discountLines[0].amount).toBe(-800);
    expect(result.usages[0].appliedAmount).toBe(800);
    expect(result.total).toBe(-800);
  });

  it("skips rule if usage limit is reached (exhausted)", async () => {
    const mockRules = [
      {
        id: "rule-exhausted",
        name: "Limited Promo",
        kind: "PERCENT" as const,
        value: 20,
        scope: "SUBSCRIPTION" as const,
        minQuantity: null,
        minPurchase: null,
        usageLimit: 5,
        isActive: true,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        products: [],
        _count: { usages: 5 }, // already used 5 times out of 5
      },
    ];

    const mockTx = {
      discountRule: {
        findMany: vi.fn().mockResolvedValue(mockRules),
      },
    };

    const result = await evaluate(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-1",
      lines,
      asOf,
    });

    expect(result.discountLines).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("respects minQuantity and minPurchase thresholds", async () => {
    const mockRules = [
      {
        id: "rule-high-threshold",
        name: "High Volume",
        kind: "PERCENT" as const,
        value: 20,
        scope: "SUBSCRIPTION" as const,
        minQuantity: 100, // lines only have qty 7
        minPurchase: 10000,
        usageLimit: null,
        isActive: true,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        products: [],
        _count: { usages: 0 },
      },
    ];

    const mockTx = {
      discountRule: {
        findMany: vi.fn().mockResolvedValue(mockRules),
      },
    };

    const result = await evaluate(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-1",
      lines,
      asOf,
    });

    expect(result.discountLines).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
