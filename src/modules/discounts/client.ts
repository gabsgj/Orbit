/**
 * modules/discounts — CLIENT-SAFE barrel (browser bundles).
 * Exports only client components — never the router, service, or prisma.
 * Pages import from here, NOT from the module barrel (see PLAN §1 rule 1).
 */
export { DiscountRuleList } from "./components/DiscountRuleList";
export { DiscountRuleForm } from "./components/DiscountRuleForm";
export { DiscountRuleDetail } from "./components/DiscountRuleDetail";
