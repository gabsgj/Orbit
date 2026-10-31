import { router, protectedProcedure, requireRole } from "@/shared/trpc";
import { TRPCError } from "@trpc/server";
import { recordPaymentSchema, listPaymentsSchema } from "./schemas";
import { recordPayment, PaymentError } from "./service";
import { listPayments, listOverdueInvoices } from "./queries";

function mapPaymentError(err: unknown): never {
  if (err instanceof PaymentError) {
    if (err.code === "OVERPAYMENT" || err.code === "ALREADY_PAID" || err.code === "INVOICE_CANCELLED") {
      throw new TRPCError({ code: "CONFLICT", message: err.message });
    }
    if (err.code === "INVOICE_NOT_FOUND") {
      throw new TRPCError({ code: "NOT_FOUND", message: err.message });
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
  }
  throw err;
}

export const paymentsRouter = router({
  record: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(recordPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
        }
        return await ctx.prisma.$transaction(async (tx) => {
          return recordPayment(tx, {
            ...input,
            recordedById: userId,
          });
        });
      } catch (err) {
        mapPaymentError(err);
      }
    }),

  list: protectedProcedure
    .input(listPaymentsSchema)
    .query(async ({ ctx, input }) => {
      return listPayments(ctx.prisma, input);
    }),

  overdue: protectedProcedure
    .query(async ({ ctx }) => {
      return listOverdueInvoices(ctx.prisma);
    }),
});
