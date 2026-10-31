import { describe, it, expect } from "vitest";
import {
  calculateMonthlyLineValue,
  DEMO_SUBSCRIPTIONS,
  DEMO_INVOICES,
  DEMO_PROFILE,
  getCustomerSubscriptions,
  getCustomerInvoices,
  getCustomerProfile,
} from "./service";
import type { PrismaClient } from "@prisma/client";

describe("portal service unit tests", () => {
  describe("calculateMonthlyLineValue (SRS §1.3 and §6 rule 7)", () => {
    it("normalizes daily subscription line values (quantity × unitPrice × 30)", () => {
      // 2 units at ₹100/day = ₹200/day × 30 = ₹6,000/month
      const mrr = calculateMonthlyLineValue(2, 100, "DAILY");
      expect(mrr).toBe(6000);
    });

    it("normalizes weekly subscription line values (quantity × unitPrice × 52/12)", () => {
      // 1 unit at ₹1,200/week = ₹1,200 × (52/12) = ₹5,200/month
      const mrr = calculateMonthlyLineValue(1, 1200, "WEEKLY");
      expect(mrr).toBe(5200);
    });

    it("normalizes monthly subscription line values (quantity × unitPrice × 1)", () => {
      // 3 units at ₹1,500/month = ₹4,500/month
      const mrr = calculateMonthlyLineValue(3, 1500, "MONTHLY");
      expect(mrr).toBe(4500);
    });

    it("normalizes yearly subscription line values (quantity × unitPrice / 12)", () => {
      // 1 unit at ₹120,000/year = ₹10,000/month
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
});
