import { z } from "zod";

export const subscriptionStatusSchema = z.enum([
  "DRAFT",
  "QUOTATION",
  "CONFIRMED",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionLineInputSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  taxIds: z.array(z.string().uuid()).optional(),
});

export type SubscriptionLineInput = z.infer<typeof subscriptionLineInputSchema>;

export const createSubscriptionSchema = z
  .object({
    customerId: z.string().uuid("Invalid customer ID"),
    planId: z.string().uuid("Invalid plan ID"),
    templateId: z.string().uuid().optional().nullable(),
    startDate: z.coerce.date(),
    expiryDate: z.coerce.date(),
    paymentTermsDays: z.number().int().min(0, "Payment terms days must be non-negative").default(15),
    status: subscriptionStatusSchema.default("DRAFT").optional(),
    lines: z.array(subscriptionLineInputSchema).min(1, "At least one line item is required"),
  })
  .refine((data) => data.expiryDate > data.startDate, {
    message: "Expiry date must be strictly after start date",
    path: ["expiryDate"],
  });

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  id: z.string().uuid(),
  paymentTermsDays: z.number().int().min(0).optional(),
  expiryDate: z.coerce.date().optional(),
  lines: z.array(subscriptionLineInputSchema).min(1).optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const createFromTemplateSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  templateId: z.string().uuid("Invalid template ID"),
  startDate: z.coerce.date(),
  paymentTermsDays: z.number().int().min(0).default(15).optional(),
});

export type CreateFromTemplateInput = z.infer<typeof createFromTemplateSchema>;

export const transitionSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  toStatus: subscriptionStatusSchema,
  note: z.string().max(500).optional(),
});

export type TransitionSubscriptionInput = z.infer<typeof transitionSubscriptionSchema>;

export const renewSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  note: z.string().max(500).optional(),
});

export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;

export const listSubscriptionsSchema = z.object({
  customerId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  status: subscriptionStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListSubscriptionsInput = z.infer<typeof listSubscriptionsSchema>;
