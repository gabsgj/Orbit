/**
 * modules/discounts — PUBLIC API. Other modules may import ONLY from this
 * barrel (enforced by eslint no-restricted-imports; see docs/PLAN.md §1).
 *
 * The DiscountEngine contract below is consumed by modules/billing at
 * billing time (PLAN §4 step f). Owner: Catherine.
 */
export { discountsRouter } from "./router";
export { evaluate as evaluateDiscounts } from "./service";
export type {
  EngineLine,
  DiscountEvaluation,
  DiscountLineOut,
  UsageOut,
} from "./service";
