/**
 * modules/catalog — Zod schemas (single source of truth, shared by router + client forms).
 *
 * Covers FR-CAT-01…05:
 *  - Product CRUD (name, type, salesPrice, costPrice, notes, isActive)
 *  - Attribute + AttributeValue CRUD (e.g. Brand → Odoo)
 *  - ProductVariant CRUD (priceExtra, e.g. +560 for Odoo brand)
 *  - Plan CRUD (price, period, minQuantity, availableFrom/To, lifecycle flags)
 *  - Tax CRUD (name, ratePercent, isActive)
 */
import { z } from "zod";

// ── Product (FR-CAT-01) ────────────────────────────────────────────────────────

export const productTypeSchema = z.enum(["service", "good"]);

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: productTypeSchema,
  salesPrice: z
    .number({ required_error: "Sales price is required" })
    .nonnegative("Sales price must be ≥ 0"),
  costPrice: z
    .number({ required_error: "Cost price is required" })
    .nonnegative("Cost price must be ≥ 0"),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Attribute + AttributeValue (FR-CAT-02) ────────────────────────────────────

export const createAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required").max(100),
});

export const createAttributeValueSchema = z.object({
  attributeId: z.string().uuid(),
  value: z.string().min(1, "Value is required").max(100),
});

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type CreateAttributeValueInput = z.infer<typeof createAttributeValueSchema>;

// ── ProductVariant (FR-CAT-02) ────────────────────────────────────────────────

export const createVariantSchema = z.object({
  productId: z.string().uuid(),
  attributeValueId: z.string().uuid(),
  priceExtra: z.number().nonnegative("Price extra must be ≥ 0").default(0),
});

export const updateVariantSchema = z.object({
  id: z.string().uuid(),
  priceExtra: z.number().nonnegative("Price extra must be ≥ 0"),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// ── Plan (FR-CAT-03, FR-CAT-04) ──────────────────────────────────────────────

export const periodSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const createPlanBaseSchema = z.object({
  productId: z.string().uuid(),
  price: z.number({ required_error: "Price is required" }).nonnegative(),
  period: periodSchema,
  minQuantity: z.number().int().min(1, "Min quantity must be ≥ 1").default(1),
  availableFrom: z.string().date("Must be a valid date (YYYY-MM-DD)"),
  availableTo: z.string().date("Must be a valid date (YYYY-MM-DD)"),
  // Lifecycle flags (FR-CAT-04) — these drive which transitions are legal
  autoClose: z.boolean().default(false),
  closableEarly: z.boolean().default(false),
  pausable: z.boolean().default(false),
  renewable: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const createPlanSchema = createPlanBaseSchema.refine(
  (d) => new Date(d.availableTo) > new Date(d.availableFrom),
  {
    message: "Available-to date must be after available-from date",
    path: ["availableTo"],
  },
);

export const updatePlanSchema = createPlanBaseSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ── Tax (FR-CAT-05) ───────────────────────────────────────────────────────────

export const createTaxSchema = z.object({
  name: z.string().min(1, "Tax name is required").max(100),
  ratePercent: z
    .number({ required_error: "Rate is required" })
    .gt(0, "Rate must be > 0")
    .max(100, "Rate must be ≤ 100"),
  isActive: z.boolean().default(true),
});

export const updateTaxSchema = createTaxSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;

// ── List/filter inputs ─────────────────────────────────────────────────────────

export const listProductsSchema = z.object({
  cursor: z.string().optional(),
  take: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const listPlansSchema = z.object({
  cursor: z.string().optional(),
  take: z.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const listTaxesSchema = z.object({
  cursor: z.string().uuid().optional(),
  take: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  isActive: z.boolean().optional(),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type ListPlansInput = z.infer<typeof listPlansSchema>;
export type ListTaxesInput = z.infer<typeof listTaxesSchema>;
