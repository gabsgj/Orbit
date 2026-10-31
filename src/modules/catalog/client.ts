/**
 * modules/catalog — CLIENT-SAFE barrel (PLAN §1 rule 1).
 * Browser pages import from here. NEVER import server-only code
 * (@trpc/server, prisma, service) into this file.
 */
export { ProductsView } from "./components/products-view";
export { PlansView } from "./components/plans-view";
export { TaxesView } from "./components/taxes-view";
export { VariantsPanel } from "./components/variants-panel";
