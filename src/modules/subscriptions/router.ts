import { router, protectedProcedure, requireRole } from "@/shared/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createSubscriptionSchema,
  createFromTemplateSchema,
  transitionSubscriptionSchema,
  renewSubscriptionSchema,
  listSubscriptionsSchema,
} from "./schemas";
import {
  createSubscription,
  createFromTemplate,
  transitionSubscription,
  renewSubscription,
  SubscriptionError,
} from "./service";
import { findSubscriptionById, listSubscriptions } from "./queries";

function mapSubscriptionError(err: unknown): never {
  if (err instanceof SubscriptionError) {
    if (err.code === "ILLEGAL_TRANSITION") {
      throw new TRPCError({ code: "CONFLICT", message: err.message });
    }
    if (err.code.includes("NOT_FOUND")) {
      throw new TRPCError({ code: "NOT_FOUND", message: err.message });
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
  }
  throw err;
}

export const subscriptionsRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const sub = await findSubscriptionById(ctx.prisma, input.id);
      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found." });
      }

      // Customer role scoping: customer can only view their own subscription
      if (user.role === "CUSTOMER") {
        if (sub.customer.userId !== user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }
      }

      return sub;
    }),

  list: protectedProcedure
    .input(listSubscriptionsSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      let customerId = input.customerId;
      if (user.role === "CUSTOMER") {
        const customer = await ctx.prisma.customer.findUnique({
          where: { userId: user.id },
        });
        if (!customer) {
          return [];
        }
        customerId = customer.id;
      }

      return listSubscriptions(ctx.prisma, { ...input, customerId });
    }),

  create: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(createSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        return await ctx.prisma.$transaction(async (tx) => {
          return createSubscription(tx, {
            ...input,
            changedById: user.id,
          });
        });
      } catch (err) {
        mapSubscriptionError(err);
      }
    }),

  createFromTemplate: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(createFromTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        return await ctx.prisma.$transaction(async (tx) => {
          return createFromTemplate(tx, {
            ...input,
            changedById: user.id,
          });
        });
      } catch (err) {
        mapSubscriptionError(err);
      }
    }),

  transition: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(transitionSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        return await ctx.prisma.$transaction(async (tx) => {
          return transitionSubscription(tx, {
            ...input,
            changedById: user.id,
          });
        });
      } catch (err) {
        mapSubscriptionError(err);
      }
    }),

  renew: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(renewSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        return await ctx.prisma.$transaction(async (tx) => {
          return renewSubscription(tx, {
            ...input,
            changedById: user.id,
          });
        });
      } catch (err) {
        mapSubscriptionError(err);
      }
    }),

  timeline: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const sub = await findSubscriptionById(ctx.prisma, input.id);
      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found." });
      }

      if (user.role === "CUSTOMER" && sub.customer.userId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      interface TimelineEvent {
        id: string;
        type: "STATUS_CHANGE" | "INVOICE" | "PAYMENT";
        title: string;
        description: string;
        timestamp: Date;
        meta?: Record<string, unknown>;
      }

      const events: TimelineEvent[] = [];

      for (const h of sub.statusHistory) {
        events.push({
          id: `status-${h.id}`,
          type: "STATUS_CHANGE",
          title: `Status: ${h.fromStatus} → ${h.toStatus}`,
          description: h.note ? `${h.note} (by ${h.changedBy.email})` : `Changed by ${h.changedBy.email}`,
          timestamp: h.changedAt,
        });
      }

      for (const inv of sub.invoices) {
        events.push({
          id: `inv-${inv.id}`,
          type: "INVOICE",
          title: `Invoice ${inv.number}`,
          description: `Total: ₹${Number(inv.grandTotal).toFixed(2)} · Status: ${inv.status}`,
          timestamp: inv.issueDate,
        });
      }

      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return events;
    }),
});
