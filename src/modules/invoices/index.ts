/**
 * modules/invoices — PUBLIC API. Other modules may import ONLY from this barrel
 * (enforced by eslint no-restricted-imports; see docs/PLAN.md §1).
 */
export { invoicesRouter } from "./router";
export {
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  sendReminder,
  InvoiceError,
  LEGAL_INVOICE_TRANSITIONS,
} from "./service";
export {
  listInvoicesSchema,
  confirmInvoiceSchema,
  cancelInvoiceSchema,
  sendInvoiceSchema,
  sendReminderSchema,
  invoiceStatusSchema,
} from "./schemas";
export type {
  ListInvoicesInput,
  InvoiceStatus,
} from "./schemas";

// UI Components
export { InvoiceStatusBadge } from "./components/InvoiceStatusBadge";
export { InvoiceList } from "./components/InvoiceList";
export { InvoiceDetail } from "./components/InvoiceDetail";
