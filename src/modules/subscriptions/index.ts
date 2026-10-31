/**
 * modules/subscriptions — PUBLIC API. Other modules may import ONLY from this barrel
 * (enforced by eslint no-restricted-imports; see docs/PLAN.md §1).
 */
export { subscriptionsRouter } from "./router";
export {
  SubscriptionError,
  LEGAL_TRANSITIONS,
  validateTransition,
  transitionSubscription,
  renewSubscription,
  createSubscription,
  createFromTemplate,
} from "./service";
export {
  createSubscriptionSchema,
  createFromTemplateSchema,
  transitionSubscriptionSchema,
  renewSubscriptionSchema,
  listSubscriptionsSchema,
  subscriptionStatusSchema,
} from "./schemas";
export type {
  CreateSubscriptionInput,
  CreateFromTemplateInput,
  TransitionSubscriptionInput,
  RenewSubscriptionInput,
  ListSubscriptionsInput,
  SubscriptionStatus,
} from "./schemas";

// UI Components
export { SubscriptionStatusBadge } from "./components/SubscriptionStatusBadge";
export { SubscriptionList } from "./components/SubscriptionList";
export { SubscriptionDetail } from "./components/SubscriptionDetail";
export { SubscriptionCreateForm } from "./components/SubscriptionCreateForm";
