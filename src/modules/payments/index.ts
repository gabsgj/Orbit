/**
 * modules/payments — PUBLIC API. Other modules may import ONLY from this barrel
 * (enforced by eslint no-restricted-imports; see docs/PLAN.md §1).
 */
export { paymentsRouter } from "./router";
export { recordPayment, PaymentError } from "./service";
export type { RecordPaymentParams, RecordPaymentResult } from "./service";
export { recordPaymentSchema, listPaymentsSchema, paymentMethodSchema } from "./schemas";
export type { RecordPaymentInput, PaymentMethod } from "./schemas";
export { RecordPaymentDialog } from "./components/RecordPaymentDialog";
