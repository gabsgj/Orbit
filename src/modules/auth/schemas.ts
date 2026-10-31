/**
 * modules/auth — Zod schemas (single source of truth for FR-AUTH-01…04).
 * Imported by BOTH the tRPC router (server-side validation) and the client
 * forms via zodResolver.  No framework imports — pure zod.
 *
 * FR-AUTH-02 password policy:
 *   length > 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special char [^A-Za-z0-9]
 */
import { z } from "zod";

// ── Password policy (reused by signup AND reset) ──────────────────────────────

export const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// ── Signup ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: passwordSchema,
  /** Customer-facing display name / company name. */
  companyName: z.string().min(1, "Company name is required").max(120),
});

export type SignupInput = z.infer<typeof signupSchema>;

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Forgot password ───────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email address")
    .transform((v) => v.toLowerCase().trim()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ── Reset password ────────────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ── Staff create (admin-only — FR-AUTH-06, FR-ADM-01) ─────────────────────────

export const createStaffSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(120),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// ── Staff deactivate (admin-only) ─────────────────────────────────────────────

export const deactivateStaffSchema = z.object({
  userId: z.string().uuid("Must be a valid user ID"),
});

export type DeactivateStaffInput = z.infer<typeof deactivateStaffSchema>;
