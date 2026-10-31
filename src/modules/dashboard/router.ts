import { router, publicProcedure, requireRole } from "@/shared/trpc";
import {
  dashboardFilterSchema,
  renewalForecastFilterSchema,
} from "./schemas";
import * as service from "./service";
import { DashboardService } from "./service";

/**
 * dashboard router — thin layer: parse (zod) → guard (requireRole) → call service → shape.
 * Business logic lives in ./service.ts. Registered in shared/trpc/root.ts.
 */
export const dashboardRouter = router({
  _health: publicProcedure.query(() => ({ module: "dashboard", ok: true })),

  /** Top-level KPI metrics: active subs, revenue, owed, overdue, MRR & ARR */
  kpis: publicProcedure
    .input(dashboardFilterSchema.optional())
    .query(async ({ input }) => {
      return DashboardService.getSummaryKPIs(input);
    }),

  /** MRR / ARR cards (FR-DASH-03, SRS §6 rule 7) */
  mrr: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .query(({ ctx }) => service.mrr(ctx.prisma)),

  /** Aging buckets (FR-PAY-05) */
  aging: publicProcedure.query(async () => {
    return DashboardService.getAgingAnalysis();
  }),

  /** Revenue breakdown by plan (FR-DASH-04) */
  revenueByPlan: publicProcedure.query(async () => {
    return DashboardService.getPlanRevenueBreakdown();
  }),

  /** Renewal forecast (FR-DASH-05) */
  renewals: publicProcedure
    .input(renewalForecastFilterSchema.optional())
    .query(async ({ input }) => {
      return DashboardService.getUpcomingRenewals(input);
    }),

  /** MRR movement (FR-DASH-03) */
  mrrMovement: publicProcedure.query(async () => {
    return DashboardService.getMRRMovementSummary();
  }),

  /** MRR & Revenue 6-month historical trend (FR-DASH-03) */
  mrrTrend: publicProcedure.query(async () => {
    return DashboardService.getMRRTrend();
  }),
});
