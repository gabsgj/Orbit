import {
  getDashboardKPIs,
  getAgingBuckets,
  getRevenueByPlan,
  getRenewalForecast,
  getMRRMovement,
  type DashboardKPIs,
  type AgingBucketItem,
  type RevenueByPlanItem,
  type RenewalForecastItem,
  type MRRMovement,
} from "./queries";
import { DashboardFilterInput, RenewalForecastFilterInput } from "./schemas";

/**
 * DashboardService — pure business logic layer (PLAN §1 modular anatomy).
 * Zero framework imports (no next / trpc); fully unit-testable.
 */
export class DashboardService {
  /**
   * Top-level summary KPIs (active subs, revenue received, amount owed, overdue, MRR, ARR).
   */
  static async getSummaryKPIs(filter?: DashboardFilterInput): Promise<DashboardKPIs> {
    return getDashboardKPIs(filter);
  }

  /**
   * Aging buckets for overdue and outstanding receivables (FR-PAY-05).
   */
  static async getAgingAnalysis(): Promise<AgingBucketItem[]> {
    return getAgingBuckets();
  }

  /**
   * Revenue breakdown by plan and product.
   */
  static async getPlanRevenueBreakdown(): Promise<RevenueByPlanItem[]> {
    return getRevenueByPlan();
  }

  /**
   * Upcoming subscription renewal forecast (FR-DASH-05).
   */
  static async getUpcomingRenewals(
    input?: RenewalForecastFilterInput
  ): Promise<RenewalForecastItem[]> {
    const days = input?.daysAhead ? parseInt(input.daysAhead, 10) : 30;
    return getRenewalForecast(days);
  }

  /**
   * MRR Movement breakdown (New, Expansion, Contraction, Churn).
   */
  static async getMRRMovementSummary(): Promise<MRRMovement> {
    return getMRRMovement();
  }
}
