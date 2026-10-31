/**
 * modules/payments — CLIENT-SAFE barrel (browser bundles).
 * Exports only client components — never the router, service, or prisma.
 * Pages import from here, NOT from the module barrel (see PLAN §1 rule 1).
 */
export { RecordPaymentDialog } from "./components/RecordPaymentDialog";
export { recordPaymentSchema, paymentMethodSchema } from "./schemas";
export type { RecordPaymentInput, PaymentMethod } from "./schemas";
