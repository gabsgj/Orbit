/**
 * modules/auth — CLIENT-SAFE surface (browser bundles).
 * Client components/pages import auth zod schemas from here, NOT from the
 * barrel: the barrel re-exports authRouter, which pulls @trpc/server into the
 * browser bundle and breaks the page (caught by the Gate-3 detector).
 * This file must stay free of any server-only imports.
 */
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
