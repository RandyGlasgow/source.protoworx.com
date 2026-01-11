import { z } from 'zod';

// Password validation regex patterns (matching backend)
const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/,
};

// Password schema with all requirements
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

// Sign up schema
export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Sign in schema
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
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

// Export types
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
