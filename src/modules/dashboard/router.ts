import { router, publicProcedure, requireRole } from "@/shared/trpc";
import { asOfSchema, renewalsSchema } from "./schemas";
import * as service from "./service";

/**
 * dashboard router — thin layer: parse (zod) → guard (requireRole) → call service → shape.
 * Business logic lives in ./service.ts. Registered in shared/trpc/root.ts.
 */
export const dashboardRouter = router({
  _health: publicProcedure.query(() => ({ module: "dashboard", ok: true })),

  /** KPI cards (FR-DASH-01): active subs, revenue received, amount owed, overdue. */
  kpis: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(asOfSchema.optional())
    .query(({ ctx, input }) =>
      service.kpis(ctx.prisma, input?.asOf ?? new Date()),
    ),

  /** MRR / ARR cards (FR-DASH-03, SRS §6 rule 7). */
  mrr: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .query(({ ctx }) => service.mrr(ctx.prisma)),

  /** Aging buckets (FR-PAY-05). */
  aging: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(asOfSchema.optional())
    .query(({ ctx, input }) =>
      service.aging(ctx.prisma, input?.asOf ?? new Date()),
    ),

  /** Renewal forecast (FR-DASH-05): upcoming renewals grouped by week. */
  renewals: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(renewalsSchema.optional())
    .query(({ ctx, input }) =>
      service.renewals(
        ctx.prisma,
        input?.asOf ?? new Date(),
        input?.withinDays ?? 30,
      ),
    ),
});
