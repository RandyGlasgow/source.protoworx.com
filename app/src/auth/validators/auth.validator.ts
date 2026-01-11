import { z } from 'zod';

// Password validation regex patterns
const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/,
};

// Base password schema with all requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    passwordRegex.uppercase,
    'Password must contain at least one uppercase letter',
  )
  .regex(
    passwordRegex.lowercase,
    'Password must contain at least one lowercase letter',
  )
  .regex(passwordRegex.number, 'Password must contain at least one number')
  .regex(
    passwordRegex.special,
    'Password must contain at least one special character',
  );

// Email schema
const emailSchema = z.string().email('Invalid email address');

// UUID v4 schema for tokens
const uuidSchema = z.string().uuid('Invalid token format');

// Sign up schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

// Sign in schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Verify token schema
export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Verify email schema
export const verifyEmailSchema = z.object({
  token: uuidSchema,
});

// Request password reset schema
export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: uuidSchema,
  newPassword: passwordSchema,
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Validate user schema
export const validateUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Onboarding schema
export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens',
    )
    .transform((val) => val.toLowerCase()),
});

// Export types inferred from schemas
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ValidateUserInput = z.infer<typeof validateUserSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
