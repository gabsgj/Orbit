import { router, publicProcedure } from "@/shared/trpc";
import { DashboardService } from "./service";
import { dashboardFilterSchema, renewalForecastFilterSchema } from "./schemas";

/**
 * Dashboard tRPC Router (PLAN §1 anatomy).
 * Thin layer: parse (zod) → call service → return shaped data.
 * Pure business logic lives in ./service.ts; SQL lives in ./queries.ts.
 */
export const dashboardRouter = router({
  _health: publicProcedure.query(() => ({ module: "dashboard", ok: true })),

  kpis: publicProcedure
    .input(dashboardFilterSchema.optional())
    .query(async ({ input }) => {
      return DashboardService.getSummaryKPIs(input);
    }),

  aging: publicProcedure.query(async () => {
    return DashboardService.getAgingAnalysis();
  }),

  revenueByPlan: publicProcedure.query(async () => {
    return DashboardService.getPlanRevenueBreakdown();
  }),

  renewals: publicProcedure
    .input(renewalForecastFilterSchema.optional())
    .query(async ({ input }) => {
      return DashboardService.getUpcomingRenewals(input);
    }),

  mrrMovement: publicProcedure.query(async () => {
    return DashboardService.getMRRMovementSummary();
  }),
});
