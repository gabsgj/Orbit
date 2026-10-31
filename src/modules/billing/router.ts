import { z } from "zod";
import { router, publicProcedure, requireRole } from "@/shared/trpc";
import { run } from "./service";

/**
 * billing router — thin layer over BillingService. Both staff and admin may
 * trigger a billing day; customers never see this module.
 */
export const billingRouter = router({
  /** "Run billing day" button (FR-BILL-02a). Returns the run summary. */
  run: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(z.object({ asOf: z.coerce.date().optional() }).optional())
    .mutation(({ ctx, input }) =>
      run(ctx.prisma, {
        asOf: input?.asOf ?? new Date(),
        triggerType: "MANUAL",
        triggeredById: ctx.session!.user.id, // requireRole guarantees a session
      }),
    ),

  /** Billing runs audit page (FR-BILL-06 / FR-ADM-02). */
  runs: publicProcedure.use(requireRole("ADMIN", "STAFF")).query(({ ctx }) =>
    ctx.prisma.billingRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { triggeredBy: { select: { email: true } } },
    }),
  ),
});
