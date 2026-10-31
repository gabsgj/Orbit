/**
 * modules/invoices — CLIENT-SAFE barrel (browser bundles).
 * Exports only client components — never the router, service, or prisma.
 * Pages import from here, NOT from the module barrel (see PLAN §1 rule 1).
 */
export { InvoiceStatusBadge } from "./components/InvoiceStatusBadge";
export { InvoiceList } from "./components/InvoiceList";
export { InvoiceDetail } from "./components/InvoiceDetail";
