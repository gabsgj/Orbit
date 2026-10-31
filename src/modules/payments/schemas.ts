import { z } from "zod";

export const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER", "CARD", "UPI", "CHEQUE"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  method: paymentMethodSchema,
  amount: z.number().positive("Payment amount must be strictly positive"),
  paidAt: z.coerce.date().default(() => new Date()),
  note: z.string().max(500).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const listPaymentsSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
