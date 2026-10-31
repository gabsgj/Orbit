/**
 * modules/dashboard — PUBLIC API.
 * Other modules may import ONLY from this barrel (enforced by eslint no-restricted-imports).
 */

export { dashboardRouter } from "./router";
export { DashboardService } from "./service";
export {
  dashboardFilterSchema,
  renewalForecastFilterSchema,
  type DashboardFilterInput,
  type RenewalForecastFilterInput,
} from "./schemas";
export type {
  DashboardKPIs,
  AgingBucketItem,
  RevenueByPlanItem,
  RenewalForecastItem,
  MRRMovement,
} from "./queries";
export * from "./components";
