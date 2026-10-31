/**
 * modules/dashboard — PUBLIC API.
 * Other modules may import ONLY from this barrel (enforced by eslint no-restricted-imports).
 */

export { dashboardRouter } from "./router";
export {
  kpis,
  mrr,
  aging,
  renewals,
  DashboardService,
  type KpisResult,
  type MrrResult,
  type AgingBucketResult,
  type RenewalWeekResult,
} from "./service";
export {
  asOfSchema,
  renewalsSchema,
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
  MRRTrendItem,
} from "./queries";
export * from "./components";
