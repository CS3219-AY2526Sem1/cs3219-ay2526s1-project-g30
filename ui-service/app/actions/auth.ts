/**
 * Authentication Server Actions
 *
 * These are secure server-only functions that handle authentication operations.
 * They validate input, communicate with user-service, manage sessions, and redirect users.
 *
 * Server Actions are invoked from client components and always run on the server,
 * providing a secure environment for handling authentication logic.
 *
 * Usage from client components:
 * ```tsx
 * 'use client';
 * import { signUp } from '@/app/actions/auth';
 *
 * async function SignupForm() {
 *   async function handleSubmit(formData: FormData) {
 *     const result = await signUp(formData);
 *     if (!result.success) {
 *       console.error(result.error);
 *     }
 *   }
 *   return <form action={handleSubmit}>...</form>;
 * }
 * ```
 */

'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import * as userServiceClient from '@/lib/userServiceClient';
import { createSession, deleteSession, generateAuthToken } from '@/lib/session';
import { verifyAuth, requireAuth, getSessionUserInfo, getSessionJWTToken } from '@/lib/dal';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  type RegisterInput,
  type LoginInput,
  type VerifyOtpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@/lib/schemas';
import type { AuthResult, FormState } from '@/types/auth';
import type { User } from '@/types/auth';

/**
 * Validates input data against a Zod schema.
 *
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns Validation result with parsed data or errors
 */
function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _form: ['An unexpected validation error occurred'] },
    };
  }
}

/**
 * Registers a new user account.
 *
 * Server Action that:
 * 1. Validates registration input (username, email, passwords)
 * 2. Calls user-service to create account
 * 3. Creates session cookie on success
 * 4. Redirects to OTP verification page
 *
 * @param formData FormData from registration form
 * @returns Result with success status and error messages if validation fails
 */
export async function signUp(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Extract and validate form input
    const input = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    const validation = validateInput(registerSchema, input);
    if (!validation.success) {
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { username, email, password } = validation.data;

    // Call user service to register
    try {
      const response = await userServiceClient.registerUser(
        username,
        email,
        password
      );

      // Create session immediately after registration
      await createSession(response.userId, email, username);

      // Return success without redirecting - let the client handle the view transition
      return {
        success: true,
        message: 'Registration successful',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    return {
      message: 'An unexpected error occurred during registration',
      success: false,
    };
  }
}

/**
 * Authenticates a user with email and password.
 *
 * Server Action that:
 * 1. Validates login input (email, password)
 * 2. Calls user-service to authenticate
 * 3. Creates session cookie on success
 * 4. Redirects to home page
 *
 * @param formData FormData from login form
 * @returns Result with success status and error messages if validation fails
 */
export async function signIn(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const validation = validateInput(loginSchema, input);
    if (!validation.success) {
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { email, password } = validation.data;

    // Call user service to authenticate
    try {
      const response = await userServiceClient.loginUser(email, password);

      // Extract username from token or fetch from user service
      // For now, using email as fallback username
      const username = email.split('@')[0];

      // Create session with the JWT token from user-service
      await createSession(response.userId, email, username, response.token);

      // Redirect to home page
      redirect('/home');
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    // Re-throw redirect errors and other special Next.js errors
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('NEXT_REDIRECT') || message.includes('NEXT_NOT_FOUND') || message.includes('redirect')) {
        throw error;
      }
    } else if (typeof error === 'object' && error !== null) {
      // Next.js redirect might throw a non-standard error object
      throw error;
    }
    return {
      message: 'An unexpected error occurred during login',
      success: false,
    };
  }
}

/**
 * Verifies a user's email using an OTP.
 *
 * Server Action that:
 * 1. Validates OTP input
 * 2. Calls user-service to verify email
 * 3. Redirects to home page on success
 *
 * @param formData FormData from OTP verification form
 * @returns Result with success status and error messages
 */
export async function verifyOTP(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Ensure user is authenticated
    const session = await verifyAuth();
    if (!session) {
      return {
        message: 'You must be logged in to verify your email',
        success: false,
      };
    }

    // Extract and validate form input
    const input = {
      userId: session.userId,
      otp: formData.get('otp'),
    };

    const validation = validateInput(verifyOtpSchema, input);
    if (!validation.success) {
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { userId, otp } = validation.data;

    // Get email and password from form data (needed for login after verification)
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Call user service to verify OTP
    try {
      await userServiceClient.verifyUserEmail(userId, otp);

      // After successful OTP verification, login to get a JWT token
      if (email && password) {
        const loginResponse = await userServiceClient.loginUser(email, password);
        
        // Update session with the JWT token from login
        await createSession(
          loginResponse.userId,
          email,
          session.username,
          loginResponse.token
        );
      }

      // Return success without redirecting - let the client handle the view transition
      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    return {
      message: 'An unexpected error occurred during OTP verification',
      success: false,
    };
  }
}

/**
 * Requests a password reset by sending an OTP to the user's email.
 *
 * Server Action that:
 * 1. Validates email input
 * 2. Calls user-service to send reset OTP
 * 3. Redirects to password reset page
 *
 * @param formData FormData from forgot password form
 * @returns Result with success status and error messages
 */
export async function requestPasswordReset(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
    };

    const validation = validateInput(forgotPasswordSchema, input);
    if (!validation.success) {
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { email } = validation.data;

    // Call user service to send reset OTP
    try {
      await userServiceClient.requestPasswordReset(email);

      // Redirect to password reset form
      redirect(`/login?step=reset-password&email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    return {
      message: 'An unexpected error occurred',
      success: false,
    };
  }
}

/**
 * Resets a user's password using an OTP.
 *
 * Server Action that:
 * 1. Validates reset password input (email, OTP, new password)
 * 2. Calls user-service to reset password
 * 3. Redirects to login page
 *
 * @param formData FormData from reset password form
 * @returns Result with success status and error messages
 */
export async function resetPassword(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
      otp: formData.get('otp'),
      newPassword: formData.get('newPassword'),
    };

    const validation = validateInput(resetPasswordSchema, input);
    if (!validation.success) {
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { email, otp, newPassword } = validation.data;

    // Call user service to reset password
    try {
      await userServiceClient.resetUserPassword(email, otp, newPassword);

      // Redirect to login page
      redirect('/login?step=email-entry');
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    return {
      message: 'An unexpected error occurred during password reset',
      success: false,
    };
  }
}

/**
 * Changes the logged-in user's password.
 *
 * Server Action that:
 * 1. Ensures user is authenticated
 * 2. Validates input (current password, new password)
 * 3. Calls user-service to change password
 *
 * @param formData FormData from change password form
 * @returns Result with success status and error messages
 */
export async function changePassword(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Ensure user is authenticated
    const session = await requireAuth();

    // Extract and validate form input
    const input = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    };

    const validation = validateInput(changePasswordSchema, input);
    if (!validation.success) {
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(session.userId);
    }

    // Call user service to change password with Bearer token
    try {
      await userServiceClient.changeUserPassword(
        authToken,
        validation.data.currentPassword,
        validation.data.newPassword
      );

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return {
        message: 'You must be logged in to change your password',
        success: false,
      };
    }
    return {
      message: 'An unexpected error occurred while changing password',
      success: false,
    };
  }
}

/**
 * Updates the authenticated user's profile information.
 *
 * Server Action that:
 * 1. Requires authentication (checks session)
 * 2. Validates profile input (display name, language, experience level)
 * 3. Calls user-service to update user profile
 * 4. Redirects to home page on success
 *
 * @param formData FormData from profile completion form
 * @returns Result with success status and error messages if validation fails
 */
export async function updateUserProfile(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    // Verify user is authenticated
    const session = await requireAuth();

    // Extract and validate form input
    const displayName = formData.get('displayName');
    const preferredLanguage = formData.get('preferredLanguage');
    const experienceLevel = formData.get('experienceLevel');

    const validation = validateInput(updateProfileSchema, {
      displayName,
      preferredLanguage,
      experienceLevel,
    });

    if (!validation.success) {
      return {
        message: 'Please provide valid profile information',
        errors: validation.errors,
        success: false,
      };
    }

    // Map form values to user profile fields
    const profileUpdates = {
      displayName: validation.data.displayName,
      skillLevel: validation.data.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      preferredTopics: [validation.data.preferredLanguage],
    };

    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(session.userId);
    }

    // Update user profile via user-service with Bearer token
    await userServiceClient.updateUserProfile(
      authToken,
      profileUpdates
    );

    // Return success without redirecting - let the client handle navigation
    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return {
        message: 'You must be logged in to update your profile',
        success: false,
      };
    }
    if (error instanceof userServiceClient.UserServiceError) {
      return {
        message: error.message || 'Failed to update profile',
        success: false,
      };
    }
    return {
      message: 'An unexpected error occurred while updating your profile',
      success: false,
    };
  }
}

/**
 * Retrieves the current authenticated user's profile information.
 *
 * Server Action that:
 * 1. Verifies the user is authenticated
 * 2. Fetches the full user profile from user-service
 * 3. Returns the user profile or null if not authenticated
 *
 * @returns User profile object or null if not authenticated
 * @throws Redirect to login if session is invalid
 */
export async function getUserProfile(): Promise<User | null> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    return null;
  }

  try {
    const userProfile = await userServiceClient.getUserProfile(sessionUserInfo.username);
    return userProfile;
  } catch (error) {
    // If user not found (404), clear the invalid session
    if (error instanceof userServiceClient.UserServiceError && error.statusCode === 404) {
      await deleteSession();
      return null;
    }
    
    // For other errors, log but don't crash
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Logs out the current user.
 *
 * Server Action that:
 * 1. Deletes the session cookie
 * 2. Redirects to login page
 */
export async function logout(): Promise<never> {
  await deleteSession();
  redirect('/login');
}
