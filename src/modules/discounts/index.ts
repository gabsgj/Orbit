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
  DiscountRule,
} from "./service";

// UI Components
export { DiscountRuleList } from "./components/DiscountRuleList";
export { DiscountRuleForm } from "./components/DiscountRuleForm";
export { DiscountRuleDetail } from "./components/DiscountRuleDetail";
