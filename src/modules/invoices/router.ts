import { router, protectedProcedure, requireRole } from "@/shared/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  listInvoicesSchema,
  confirmInvoiceSchema,
  cancelInvoiceSchema,
  sendInvoiceSchema,
  sendReminderSchema,
} from "./schemas";
import {
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  sendReminder,
  InvoiceError,
} from "./service";
import { findInvoiceById, listInvoices } from "./queries";

function mapInvoiceError(err: unknown): never {
  if (err instanceof InvoiceError) {
    if (
      err.code === "ILLEGAL_TRANSITION" ||
      err.code === "INVOICE_HAS_PAYMENTS" ||
      err.code === "NOT_OVERDUE"
    ) {
      throw new TRPCError({ code: "CONFLICT", message: err.message });
    }
    if (err.code === "NOT_FOUND") {
      throw new TRPCError({ code: "NOT_FOUND", message: err.message });
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
  }
  throw err;
}

export const invoicesRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const inv = await findInvoiceById(ctx.prisma, input.id);
      if (!inv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
      }

      if (ctx.session.user.role === "CUSTOMER") {
        if (inv.customer.userId !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }
      }

      return inv;
    }),

  list: protectedProcedure
    .input(listInvoicesSchema)
    .query(async ({ ctx, input }) => {
      let customerId = input.customerId;
      if (ctx.session.user.role === "CUSTOMER") {
        const cust = await ctx.prisma.customer.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (!cust) return { items: [], totals: { subtotal: 0, taxTotal: 0, discountTotal: 0, grandTotal: 0, amountPaid: 0, outstanding: 0 } };
        customerId = cust.id;
      }

      return listInvoices(ctx.prisma, { ...input, customerId });
    }),

  confirm: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(confirmInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await confirmInvoice(ctx.prisma, input);
      } catch (err) {
        mapInvoiceError(err);
      }
    }),

  cancel: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(cancelInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await cancelInvoice(ctx.prisma, input);
      } catch (err) {
        mapInvoiceError(err);
      }
    }),

  send: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(sendInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await sendInvoice(ctx.prisma, input);
      } catch (err) {
        mapInvoiceError(err);
      }
    }),

  // FR-PAY-06: offline dunning — stage a REMINDER in the mail outbox.
  sendReminder: protectedProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(sendReminderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
        }
        return await sendReminder(ctx.prisma, {
          invoiceId: input.invoiceId,
          sentByUserId: userId,
          baseUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        });
      } catch (err) {
        mapInvoiceError(err);
      }
    }),
});
