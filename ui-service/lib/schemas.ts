/**
 * Zod schemas for validation across the authentication flow.
 *
 * Provides both server-side validation and type-safe form validation.
 * All validation rules should be defined here for consistency.
 */

import { z } from 'zod';

/**
 * Email validation schema.
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

/**
 * Username validation schema.
 * - 3-32 characters
 * - Alphanumeric, dashes, underscores, periods only
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username can only contain letters, numbers, periods, dashes, and underscores'
  );

/**
 * Password validation schema.
 * - Minimum 8 characters
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

/**
 * OTP validation schema.
 * - Exactly 6 digits
 */
export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

/**
 * Registration form schema.
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login form schema.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * OTP verification schema.
 */
export const verifyOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  otp: otpSchema,
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * Forgot password schema.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password schema.
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema,
}).refine((data) => data.newPassword.length > 0, {
  message: 'Password is required',
  path: ['newPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Change password schema (requires current password).
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Update profile schema (after successful signup).
 * Allows user to set display name, preferred language, and experience level.
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must not exceed 50 characters'),
  preferredLanguage: z
    .string()
    .min(1, 'Preferred language is required'),
  experienceLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .default('beginner'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

