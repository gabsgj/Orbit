import { z } from "zod";

export const invoiceStatusSchema = z.enum(["DRAFT", "CONFIRMED", "PAID", "CANCELLED"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const listInvoicesSchema = z.object({
  customerId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  status: invoiceStatusSchema.optional(),
  overdueOnly: z.boolean().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>;

export const confirmInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
});

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  reason: z.string().max(500).optional(),
});

export const sendInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
});

export const sendReminderSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
});
