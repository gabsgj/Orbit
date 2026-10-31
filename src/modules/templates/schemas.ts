/**
 * modules/templates — Zod schemas (FR-QT-01: quotation templates + lines).
 * Shared by tRPC router AND client forms.
 *
 * Template: name, planId, validityDays
 * Template lines: variantId, quantity, unitPrice (snapshot default)
 */
import { z } from "zod";

// ── Template ──────────────────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200),
  planId: z.string().uuid("Must be a valid plan ID"),
  validityDays: z
    .number()
    .int()
    .min(1, "Validity must be at least 1 day")
    .max(3650, "Validity cannot exceed 10 years"),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// ── Template lines ─────────────────────────────────────────────────────────────

export const templateLineSchema = z.object({
  variantId: z.string().uuid("Must be a valid variant ID"),
  quantity: z.number().int().min(1, "Quantity must be ≥ 1"),
  unitPrice: z
    .number({ required_error: "Unit price is required" })
    .nonnegative("Unit price must be ≥ 0"),
});

export const upsertTemplateLinesSchema = z.object({
  templateId: z.string().uuid(),
  /** Replace all lines for this template with these new lines. */
  lines: z.array(templateLineSchema).min(1, "At least one line is required"),
});

export type TemplateLine = z.infer<typeof templateLineSchema>;
export type UpsertTemplateLinesInput = z.infer<typeof upsertTemplateLinesSchema>;

// ── List/filter ────────────────────────────────────────────────────────────────

export const listTemplatesSchema = z.object({
  cursor: z.string().optional(),
  take: z.number().int().min(1).max(100).default(20),
  planId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;
