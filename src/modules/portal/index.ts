/**
 * modules/portal — PUBLIC API. Other modules may import ONLY from this barrel
 * (enforced by eslint no-restricted-imports; see docs/PLAN.md §1).
 */
export { portalRouter } from "./router";
export * from "./schemas";
export * from "./service";
export * from "./components";
