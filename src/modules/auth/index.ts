/**
 * modules/auth — PUBLIC API barrel.
 * Other modules may import ONLY from this file (eslint no-restricted-imports).
 * Exports:
 *   authRouter   — the tRPC router (consumed by shared/trpc/root.ts)
 *   passwordSchema — the zod password policy (used by client forms)
 *   signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema — client form schemas
 */
export { authRouter } from "./router";
export {
  passwordSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema,
  deactivateStaffSchema,
} from "./schemas";
export type {
  SignupInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreateStaffInput,
  DeactivateStaffInput,
} from "./schemas";
export { getLatestEmail, listPendingEmails } from "./queries";
