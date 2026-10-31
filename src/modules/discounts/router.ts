import { router, protectedProcedure, requireRole } from "@/shared/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createDiscountRuleSchema,
  updateDiscountRuleSchema,
  listDiscountRulesSchema,
} from "./schemas";
import {
  listRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
} from "./queries";

export const discountsRouter = router({
  list: protectedProcedure
    .input(listDiscountRulesSchema)
    .query(async ({ ctx, input }) => {
      return listRules(ctx.prisma, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rule = await getRuleById(ctx.prisma, input.id);
      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Discount rule not found." });
      }
      return rule;
    }),

  create: protectedProcedure
    .use(requireRole("ADMIN"))
    .input(createDiscountRuleSchema)
    .mutation(async ({ ctx, input }) => {
      return createRule(ctx.prisma, input);
    }),

  update: protectedProcedure
    .use(requireRole("ADMIN"))
    .input(updateDiscountRuleSchema)
    .mutation(async ({ ctx, input }) => {
      return updateRule(ctx.prisma, input);
    }),

  delete: protectedProcedure
    .use(requireRole("ADMIN"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deleteRule(ctx.prisma, input.id);
    }),
});
