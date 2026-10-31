/**
 * modules/admin — PUBLIC API. Other modules may import ONLY from this barrel
 * (enforced by eslint no-restricted-imports; see docs/PLAN.md §1).
 * Owner: Gabriel.
 */
export { adminRouter } from "./router";
export { nextNumber } from "./service";
export type { DocType } from "./service";
