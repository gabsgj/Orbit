import { describe, it, expect, vi } from "vitest";
import {
  validateTransition,
  SubscriptionError,
  transitionSubscription,
  renewSubscription,
} from "./service";
import type { SubscriptionStatus, Plan, PrismaClient } from "@prisma/client";

describe("subscriptions state machine — validateTransition", () => {
  const basePlan: Pick<Plan, "id" | "minQuantity" | "pausable" | "closableEarly" | "renewable"> = {
    id: "plan-1",
    minQuantity: 5,
    pausable: true,
    closableEarly: true,
    renewable: true,
  };

  const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const pastExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000);

  it("permits same-state no-op", () => {
    expect(() =>
      validateTransition({
        currentStatus: "ACTIVE",
        targetStatus: "ACTIVE",
        plan: basePlan,
        totalQuantity: 10,
        expiryDate: futureExpiry,
      }),
    ).not.toThrow();
  });

  describe("legal transitions", () => {
    it("permits DRAFT -> QUOTATION", () => {
      expect(() =>
        validateTransition({
          currentStatus: "DRAFT",
          targetStatus: "QUOTATION",
          plan: basePlan,
          totalQuantity: 1,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits DRAFT -> CLOSED (abandoned)", () => {
      expect(() =>
        validateTransition({
          currentStatus: "DRAFT",
          targetStatus: "CLOSED",
          plan: basePlan,
          totalQuantity: 1,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits QUOTATION -> CONFIRMED when quantity >= minQuantity", () => {
      expect(() =>
        validateTransition({
          currentStatus: "QUOTATION",
          targetStatus: "CONFIRMED",
          plan: basePlan,
          totalQuantity: 5,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits QUOTATION -> CLOSED", () => {
      expect(() =>
        validateTransition({
          currentStatus: "QUOTATION",
          targetStatus: "CLOSED",
          plan: basePlan,
          totalQuantity: 1,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits CONFIRMED -> ACTIVE", () => {
      expect(() =>
        validateTransition({
          currentStatus: "CONFIRMED",
          targetStatus: "ACTIVE",
          plan: basePlan,
          totalQuantity: 10,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits CONFIRMED -> CLOSED", () => {
      expect(() =>
        validateTransition({
          currentStatus: "CONFIRMED",
          targetStatus: "CLOSED",
          plan: basePlan,
          totalQuantity: 10,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits ACTIVE -> PAUSED when plan.pausable = true", () => {
      expect(() =>
        validateTransition({
          currentStatus: "ACTIVE",
          targetStatus: "PAUSED",
          plan: { ...basePlan, pausable: true },
          totalQuantity: 10,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits PAUSED -> ACTIVE (resume)", () => {
      expect(() =>
        validateTransition({
          currentStatus: "PAUSED",
          targetStatus: "ACTIVE",
          plan: basePlan,
          totalQuantity: 10,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits ACTIVE -> CLOSED when plan.closableEarly = true", () => {
      expect(() =>
        validateTransition({
          currentStatus: "ACTIVE",
          targetStatus: "CLOSED",
          plan: { ...basePlan, closableEarly: true },
          totalQuantity: 10,
          expiryDate: futureExpiry,
        }),
      ).not.toThrow();
    });

    it("permits ACTIVE -> CLOSED when past expiry regardless of closableEarly", () => {
      expect(() =>
        validateTransition({
          currentStatus: "ACTIVE",
          targetStatus: "CLOSED",
          plan: { ...basePlan, closableEarly: false },
          totalQuantity: 10,
          expiryDate: pastExpiry,
        }),
      ).not.toThrow();
    });
  });

  describe("illegal transitions (SRS §6 Rule 1)", () => {
    const invalidPairs: Array<[SubscriptionStatus, SubscriptionStatus]> = [
      ["DRAFT", "ACTIVE"],
      ["DRAFT", "CONFIRMED"],
      ["DRAFT", "PAUSED"],
      ["QUOTATION", "ACTIVE"],
      ["QUOTATION", "PAUSED"],
      ["CONFIRMED", "PAUSED"],
      ["CONFIRMED", "QUOTATION"],
      ["ACTIVE", "DRAFT"],
      ["ACTIVE", "QUOTATION"],
      ["PAUSED", "DRAFT"],
      ["PAUSED", "QUOTATION"],
      ["PAUSED", "CONFIRMED"],
      ["CLOSED", "DRAFT"],
      ["CLOSED", "QUOTATION"],
      ["CLOSED", "CONFIRMED"],
      ["CLOSED", "ACTIVE"],
      ["CLOSED", "PAUSED"],
    ];

    it.each(invalidPairs)("rejects illegal transition %s -> %s", (from, to) => {
      expect(() =>
        validateTransition({
          currentStatus: from,
          targetStatus: to,
          plan: basePlan,
          totalQuantity: 10,
          expiryDate: futureExpiry,
        }),
      ).toThrowError(SubscriptionError);

      try {
        validateTransition({
          currentStatus: from,
          targetStatus: to,
          plan: basePlan,
          totalQuantity: 10,
          expiryDate: futureExpiry,
        });
      } catch (err) {
        expect(err).toBeInstanceOf(SubscriptionError);
        expect((err as SubscriptionError).code).toBe("ILLEGAL_TRANSITION");
      }
    });
  });

  describe("plan-flag gates (FR-SUB-04, FR-SUB-05, FR-SUB-07)", () => {
    it("rejects QUOTATION -> CONFIRMED if totalQuantity < plan.minQuantity", () => {
      expect(() =>
        validateTransition({
          currentStatus: "QUOTATION",
          targetStatus: "CONFIRMED",
          plan: { ...basePlan, minQuantity: 10 },
          totalQuantity: 4,
          expiryDate: futureExpiry,
        }),
      ).toThrowError(/below minimum/i);
    });

    it("rejects ACTIVE -> PAUSED if plan.pausable is false", () => {
      try {
        validateTransition({
          currentStatus: "ACTIVE",
          targetStatus: "PAUSED",
          plan: { ...basePlan, pausable: false },
          totalQuantity: 10,
          expiryDate: futureExpiry,
        });
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SubscriptionError);
        expect((err as SubscriptionError).code).toBe("PLAN_NOT_PAUSABLE");
      }
    });

    it("rejects ACTIVE -> CLOSED before expiry if plan.closableEarly is false", () => {
      try {
        validateTransition({
          currentStatus: "ACTIVE",
          targetStatus: "CLOSED",
          plan: { ...basePlan, closableEarly: false },
          totalQuantity: 10,
          expiryDate: futureExpiry,
        });
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SubscriptionError);
        expect((err as SubscriptionError).code).toBe("PLAN_NOT_CLOSABLE_EARLY");
      }
    });
  });
});

describe("subscriptions service — transitionSubscription transactional logic", () => {
  it("updates status and writes to status history table", async () => {
    const mockSub = {
      id: "sub-123",
      status: "DRAFT" as SubscriptionStatus,
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      nextBillingDate: null,
      plan: {
        id: "plan-1",
        minQuantity: 1,
        pausable: true,
        closableEarly: true,
        renewable: true,
        period: "MONTHLY",
      },
      lines: [{ quantity: 5 }],
    };

    const mockTx = {
      subscription: {
        findUnique: vi.fn().mockResolvedValue(mockSub),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockSub, ...data })),
      },
      subscriptionStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: "hist-1" }),
      },
    };

    const result = await transitionSubscription(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-123",
      toStatus: "QUOTATION",
      changedById: "user-abc",
      note: "Sent to client",
    });

    expect(result.status).toBe("QUOTATION");
    expect(mockTx.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-123" },
        data: expect.objectContaining({ status: "QUOTATION" }),
      }),
    );
    expect(mockTx.subscriptionStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionId: "sub-123",
          fromStatus: "DRAFT",
          toStatus: "QUOTATION",
          changedById: "user-abc",
          note: "Sent to client",
        }),
      }),
    );
  });

  it("re-anchors nextBillingDate when resuming from PAUSED", async () => {
    const asOf = new Date("2026-06-15");
    const mockSub = {
      id: "sub-paused",
      status: "PAUSED" as SubscriptionStatus,
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      nextBillingDate: new Date("2026-06-01"), // In the past relative to asOf
      pausedOn: new Date("2026-05-25"),
      plan: {
        id: "plan-1",
        minQuantity: 1,
        pausable: true,
        closableEarly: true,
        renewable: true,
        period: "MONTHLY",
      },
      lines: [{ quantity: 2 }],
    };

    const mockTx = {
      subscription: {
        findUnique: vi.fn().mockResolvedValue(mockSub),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockSub, ...data })),
      },
      subscriptionStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: "hist-2" }),
      },
    };

    await transitionSubscription(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-paused",
      toStatus: "ACTIVE",
      changedById: "user-abc",
      asOf,
    });

    expect(mockTx.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-paused" },
        data: expect.objectContaining({
          status: "ACTIVE",
          pausedOn: null,
          nextBillingDate: asOf,
        }),
      }),
    );
  });
});

describe("subscriptions service — renewSubscription", () => {
  it("extends expiry date by 1 period and writes to status history", async () => {
    const mockSub = {
      id: "sub-renewable",
      status: "ACTIVE" as SubscriptionStatus,
      expiryDate: new Date("2026-06-30T00:00:00.000Z"),
      plan: {
        id: "plan-monthly",
        period: "MONTHLY" as const,
        renewable: true,
      },
      lines: [{ quantity: 1 }],
    };

    const mockTx = {
      subscription: {
        findUnique: vi.fn().mockResolvedValue(mockSub),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockSub, ...data })),
      },
      subscriptionStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: "hist-renew" }),
      },
    };

    await renewSubscription(mockTx as unknown as PrismaClient, {
      subscriptionId: "sub-renewable",
      changedById: "user-abc",
    });

    expect(mockTx.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-renewable" },
        data: expect.objectContaining({
          expiryDate: expect.any(Date),
        }),
      }),
    );

    const callArg = mockTx.subscription.update.mock.calls[0][0];
    const newExpiryDate: Date = callArg.data.expiryDate;
    expect(newExpiryDate.getMonth()).toBe(6); // July (month 6, zero-indexed)
  });

  it("rejects renewal if plan is not renewable", async () => {
    const mockSub = {
      id: "sub-non-renewable",
      status: "ACTIVE" as SubscriptionStatus,
      expiryDate: new Date("2026-06-30"),
      plan: {
        id: "plan-fixed",
        period: "YEARLY" as const,
        renewable: false,
      },
      lines: [{ quantity: 1 }],
    };

    const mockTx = {
      subscription: {
        findUnique: vi.fn().mockResolvedValue(mockSub),
      },
    };

    await expect(
      renewSubscription(mockTx as unknown as PrismaClient, {
        subscriptionId: "sub-non-renewable",
        changedById: "user-abc",
      }),
    ).rejects.toThrowError(SubscriptionError);
  });
});
