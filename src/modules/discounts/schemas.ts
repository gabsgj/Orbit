import { z } from "zod";

export const discountKindSchema = z.enum(["PERCENT", "FIXED"]);
export const discountScopeSchema = z.enum(["PRODUCT", "SUBSCRIPTION"]);

export const createDiscountRuleSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    kind: discountKindSchema,
    value: z.number().positive("Value must be strictly positive"),
    minPurchase: z.number().min(0, "Min purchase must be non-negative").nullable().optional(),
    minQuantity: z.number().int().min(1, "Min quantity must be at least 1").nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    usageLimit: z.number().int().min(1, "Usage limit must be at least 1").nullable().optional(),
    scope: discountScopeSchema,
    productIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (data.kind === "PERCENT" && data.value > 100) return false;
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    },
  )
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.scope === "PRODUCT" && (!data.productIds || data.productIds.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "At least one product must be selected for product-scope discount",
      path: ["productIds"],
    },
  );

export type CreateDiscountRuleInput = z.infer<typeof createDiscountRuleSchema>;

export const updateDiscountRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  minPurchase: z.number().min(0).nullable().optional(),
  minQuantity: z.number().int().min(1).nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().uuid()).optional(),
});

export type UpdateDiscountRuleInput = z.infer<typeof updateDiscountRuleSchema>;

export const listDiscountRulesSchema = z.object({
  search: z.string().optional(),
  scope: discountScopeSchema.optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
