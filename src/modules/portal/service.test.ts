import { describe, it, expect } from "vitest";
import {
  calculateMonthlyLineValue,
  DEMO_SUBSCRIPTIONS,
  DEMO_INVOICES,
  DEMO_PROFILE,
  getCustomerSubscriptions,
  getCustomerInvoices,
  getCustomerProfile,
  requestSubscriptionAction,
} from "./service";
import type { PrismaClient } from "@prisma/client";

describe("portal service unit tests", () => {
  describe("calculateMonthlyLineValue (SRS §1.3 and §6 rule 7)", () => {
    it("normalizes daily subscription line values (quantity × unitPrice × 30)", () => {
      const mrr = calculateMonthlyLineValue(2, 100, "DAILY");
      expect(mrr).toBe(6000);
    });

    it("normalizes weekly subscription line values (quantity × unitPrice × 52/12)", () => {
      const mrr = calculateMonthlyLineValue(1, 1200, "WEEKLY");
      expect(mrr).toBe(5200);
    });

    it("normalizes monthly subscription line values (quantity × unitPrice × 1)", () => {
      const mrr = calculateMonthlyLineValue(3, 1500, "MONTHLY");
      expect(mrr).toBe(4500);
    });

    it("normalizes yearly subscription line values (quantity × unitPrice / 12)", () => {
      const mrr = calculateMonthlyLineValue(1, 120000, "YEARLY");
      expect(mrr).toBe(10000);
    });
  });

  describe("graceful fallback behavior (FR-PORT-01 resilience)", () => {
    it("returns demo fixtures if database customer resolution produces no records", async () => {
      const mockPrisma = {
        customer: {
          findUnique: async () => null,
          findFirst: async () => null,
        },
      } as unknown as PrismaClient;

      const profile = await getCustomerProfile(mockPrisma, "non-existent-user");
      expect(profile).toEqual(DEMO_PROFILE);

      const subs = await getCustomerSubscriptions(mockPrisma, "non-existent-user");
      expect(subs).toEqual(DEMO_SUBSCRIPTIONS);

      const invs = await getCustomerInvoices(mockPrisma, "non-existent-user");
      expect(invs).toEqual(DEMO_INVOICES);
    });

    it("handles database exceptions gracefully without crashing the UI", async () => {
      const throwingPrisma = {
        customer: {
          findUnique: async () => {
            throw new Error("Connection lost");
          },
          findFirst: async () => {
            throw new Error("Connection lost");
          },
        },
      } as unknown as PrismaClient;

      const profile = await getCustomerProfile(throwingPrisma);
      expect(profile).toEqual(DEMO_PROFILE);

      const subs = await getCustomerSubscriptions(throwingPrisma);
      expect(subs).toEqual(DEMO_SUBSCRIPTIONS);

      const invs = await getCustomerInvoices(throwingPrisma);
      expect(invs).toEqual(DEMO_INVOICES);
    });
  });

  describe("requestSubscriptionAction (FR-PORT-03 and DEMO Act 8)", () => {
    it("returns error if subscription does not exist", async () => {
      const mockPrisma = {
        subscription: {
          findUnique: async () => null,
        },
      } as unknown as PrismaClient;

      const result = await requestSubscriptionAction(mockPrisma, undefined, {
        subscriptionId: "a0000000-0000-0000-0000-000000000001",
        action: "PAUSE",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
    });

    it("rejects PAUSE if plan.pausable is false (FR-SUB-04)", async () => {
      const mockPrisma = {
        subscription: {
          findUnique: async () => ({
            id: "sub-1",
            number: "SUB-001",
            status: "ACTIVE",
            customer: { userId: "user-1" },
            plan: { pausable: false, renewable: true, closableEarly: false },
          }),
        },
      } as unknown as PrismaClient;

      const result = await requestSubscriptionAction(mockPrisma, "user-1", {
        subscriptionId: "a0000000-0000-0000-0000-000000000001",
        action: "PAUSE",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("does not permit pausing");
    });

    it("rejects CLOSE if plan.closableEarly is false (FR-SUB-05)", async () => {
      const mockPrisma = {
        subscription: {
          findUnique: async () => ({
            id: "sub-1",
            number: "SUB-001",
            status: "ACTIVE",
            customer: { userId: "user-1" },
            plan: { pausable: true, renewable: true, closableEarly: false },
          }),
        },
      } as unknown as PrismaClient;

      const result = await requestSubscriptionAction(mockPrisma, "user-1", {
        subscriptionId: "a0000000-0000-0000-0000-000000000001",
        action: "CLOSE",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("does not permit early closure");
    });

    it("successfully pauses an active pausable subscription", async () => {
      let updatedData: unknown = null;
      const mockPrisma = {
        subscription: {
          findUnique: async () => ({
            id: "sub-1",
            number: "SUB-2026-00001",
            status: "ACTIVE",
            customer: { userId: "user-1" },
            plan: { pausable: true, renewable: true, closableEarly: true },
          }),
          update: async ({ data }: { data: unknown }) => {
            updatedData = data;
            return {};
          },
        },
      } as unknown as PrismaClient;

      const result = await requestSubscriptionAction(mockPrisma, "user-1", {
        subscriptionId: "a0000000-0000-0000-0000-000000000001",
        action: "PAUSE",
      });

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe("PAUSED");
      expect(updatedData).toMatchObject({ status: "PAUSED" });
    });
  });
});
