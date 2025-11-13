// AI Assistance Disclosure:
// Tool: GitHub Copilot (Claude 4.5 Haiku), date: 2025‑11-1
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

/**
 * Authentication types and interfaces.
 *
 * Defines all types used throughout the authentication flow.
 */

/**
 * User information returned from the authentication service.
 * MongoDB returns _id, which we map to userId for consistency.
 */
export interface User {
  _id?: string; // MongoDB ObjectId as string
  userId?: string; // Alias for _id for backwards compatibility
  username: string;
  email: string;
  gender?: 'Male' | 'Female' | 'Nil';
  displayName?: string;
  headline?: string;
  aboutMeInformation?: string;
  pronouns?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredTopics?: string[];
  questionsCompleted?: string[];
  profilePictureUrl?: string;
  socialLinks?: Array<{
    id?: string;
    platform?: string;
    url?: string;
  }>;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Response from user service registration endpoint.
 */
export interface RegisterResponse {
  message: string;
  userId: string;
}

/**
 * Response from user service login endpoint.
 */
export interface LoginResponse {
  userId: string;
  token: string;
}

/**
 * Response from user service OTP verification endpoint.
 */
export interface VerifyOtpResponse {
  message: string;
  userId?: string;
  token?: string;
}

/**
 * Response from user service password reset endpoint.
 */
export interface PasswordResetResponse {
  message: string;
}

/**
 * Server action result type for consistent error handling.
 */
export interface ServerActionResult<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Server action result for authentication flow.
 */
export interface AuthResult extends ServerActionResult<{ userId: string }> {
  redirectUrl?: string;
}

/**
 * Form state for React server actions with validation errors.
 */
export interface FormState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
}

/**
 * User information stored in the session.
 * These fields are always present in a valid session.
 */
export interface SessionUser {
  userId: string;
  email: string;
  username: string;
}
