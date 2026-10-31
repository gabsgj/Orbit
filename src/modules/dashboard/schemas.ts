import { z } from "zod";

/**
 * dashboard zod schemas — single source of truth, imported by BOTH the tRPC router
 * and the client forms (zodResolver).
 */

/** Shared input for KPI endpoints that operate "as of" a date. */
export const asOfSchema = z.object({
  asOf: z.coerce.date().optional(),
});

/** Renewal forecast input: asOf + lookahead window in days (1..90, default 30). */
export const renewalsSchema = z.object({
  asOf: z.coerce.date().optional(),
  withinDays: z.coerce.number().int().min(1).max(90).default(30),
});

export type AsOfInput = z.infer<typeof asOfSchema>;
export type RenewalsInput = z.infer<typeof renewalsSchema>;
