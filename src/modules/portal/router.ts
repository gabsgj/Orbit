import { router, publicProcedure } from "@/shared/trpc";
import {
  PortalFilterInputSchema,
  SubscriptionActionInputSchema,
} from "./schemas";
import {
  getCustomerSubscriptions,
  getCustomerInvoices,
  getCustomerProfile,
  requestSubscriptionAction,
} from "./service";

/**
 * portal router — customer-scoped data access (PLAN §5: portal.*).
 * Scopes all queries and actions to the authenticated customer (FR-PORT-01, FR-PORT-03).
 * Falls back to demo customer fixtures for offline demonstration resilience.
 */
export const portalRouter = router({
  _health: publicProcedure.query(() => ({ module: "portal", ok: true })),

  mySubscriptions: publicProcedure
    .input(PortalFilterInputSchema.optional())
    .query(async ({ ctx, input }) => {
      return getCustomerSubscriptions(
        ctx.prisma,
        ctx.session?.user?.id,
        input?.customerId
      );
    }),

  myInvoices: publicProcedure
    .input(PortalFilterInputSchema.optional())
    .query(async ({ ctx, input }) => {
      return getCustomerInvoices(
        ctx.prisma,
        ctx.session?.user?.id,
        input?.customerId
      );
    }),

  myProfile: publicProcedure
    .input(PortalFilterInputSchema.optional())
    .query(async ({ ctx, input }) => {
      return getCustomerProfile(
        ctx.prisma,
        ctx.session?.user?.id,
        input?.customerId
      );
    }),

  requestAction: publicProcedure
    .input(SubscriptionActionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return requestSubscriptionAction(
        ctx.prisma,
        ctx.session?.user?.id,
        input
      );
    }),
});
