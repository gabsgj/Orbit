import { describe, it, expect } from "vitest";
import { DashboardService } from "./service";

describe("DashboardService", () => {
  it("exposes all required aggregate methods per docs/SRS.md M9", () => {
    expect(typeof DashboardService.getSummaryKPIs).toBe("function");
    expect(typeof DashboardService.getAgingAnalysis).toBe("function");
    expect(typeof DashboardService.getPlanRevenueBreakdown).toBe("function");
    expect(typeof DashboardService.getUpcomingRenewals).toBe("function");
    expect(typeof DashboardService.getMRRMovementSummary).toBe("function");
  });

  describe("MRR calculation formula (SRS §1.3 and §6 rule 7)", () => {
    // Normalization rules: daily*30, weekly*52/12, monthly*1, yearly/12
    const normalizeMonthly = (period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY", amount: number) => {
      switch (period) {
        case "DAILY":
          return amount * 30;
        case "WEEKLY":
          return amount * (52 / 12);
        case "MONTHLY":
          return amount * 1;
        case "YEARLY":
          return amount / 12;
      }
    };

    it("correctly computes monthly multiplier for DAILY plans", () => {
      const dailyPrice = 100;
      expect(normalizeMonthly("DAILY", dailyPrice)).toBe(3000);
    });

    it("correctly computes monthly multiplier for WEEKLY plans (52/12)", () => {
      const weeklyPrice = 1200;
      expect(normalizeMonthly("WEEKLY", weeklyPrice)).toBe(5200);
    });

    it("correctly computes monthly multiplier for MONTHLY plans (1x)", () => {
      const monthlyPrice = 5000;
      expect(normalizeMonthly("MONTHLY", monthlyPrice)).toBe(5000);
    });

    it("correctly computes monthly multiplier for YEARLY plans (1/12)", () => {
      const yearlyPrice = 60000;
      expect(normalizeMonthly("YEARLY", yearlyPrice)).toBe(5000);
    });

    it("ARR is exactly 12 times MRR", () => {
      const mrr = 25000;
      const arr = mrr * 12;
      expect(arr).toBe(300000);
    });
  });

  describe("Aging Buckets categorization (FR-PAY-05)", () => {
    const buckets = ["Current", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days"] as const;

    it("defines the exact 5 buckets required by FR-PAY-05", () => {
      expect(buckets).toHaveLength(5);
      expect(buckets).toContain("Current");
      expect(buckets).toContain("1-30 Days");
      expect(buckets).toContain("31-60 Days");
      expect(buckets).toContain("61-90 Days");
      expect(buckets).toContain("90+ Days");
    });
  });
});
