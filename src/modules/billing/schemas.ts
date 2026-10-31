import { z } from "zod";

/**
 * billing zod schemas — single source of truth, imported by BOTH the tRPC router
 * and the client forms (zodResolver).
 */

/** FR-BILL-02a: "Run billing day" — optional as-of date (defaults to today). */
export const billingRunSchema = z
  .object({
    asOf: z.coerce.date().optional(),
  })
  .optional();

export type BillingRunInput = z.infer<typeof billingRunSchema>;
