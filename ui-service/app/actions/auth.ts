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
import { createSession, deleteSession, generateAuthToken, markProfileComplete } from '@/lib/session';
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
import {
  logServerActionStart,
  logServerActionSuccess,
  logServerActionError,
  logValidationError,
  logOutgoingRequest,
  logIncomingResponse,
  logServiceError,
} from '@/lib/logger';

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
  logServerActionStart('signUp');

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
      logValidationError('signUp', validation.errors);
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { username, email, password } = validation.data;

    logOutgoingRequest('userService', '/register', 'POST', {
      username,
      email,
      timestamp: new Date().toISOString(),
    });

    // Call user service to register
    try {
      const response = await userServiceClient.registerUser(
        username,
        email,
        password
      );

      logIncomingResponse('userService', '/register', 200, {
        userId: response.userId,
        timestamp: new Date().toISOString(),
      });

      // Create session immediately after registration
      await createSession(response.userId, email, username);

      logServerActionSuccess('signUp', {
        userId: response.userId,
        email,
        username,
      });

      // Return success without redirecting - let the client handle the view transition
      return {
        success: true,
        message: 'Registration successful',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/register', error, {
          statusCode: error.statusCode,
          email,
          username,
        });
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
    logServerActionError('signUp', error);
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
  logServerActionStart('signIn');

  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const validation = validateInput(loginSchema, input);
    if (!validation.success) {
      logValidationError('signIn', validation.errors);
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { email, password } = validation.data;

    logOutgoingRequest('userService', '/login', 'POST', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Call user service to authenticate
    try {
      const response = await userServiceClient.loginUser(email, password);

      logIncomingResponse('userService', '/login', 200, {
        userId: response.userId,
        timestamp: new Date().toISOString(),
      });

      // Extract username from token or fetch from user service
      // For now, using email as fallback username
      const username = email.split('@')[0];

      // Create session with the JWT token from user-service
      // Existing users have already completed their profile setup
      await createSession(response.userId, email, username, response.token, true);

      logServerActionSuccess('signIn', {
        userId: response.userId,
        email,
      });

      // Redirect to home page
      redirect('/home');
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/login', error, {
          statusCode: error.statusCode,
          email,
        });
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
    logServerActionError('signIn', error);
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
  logServerActionStart('verifyOTP');

  try {
    // Ensure user is authenticated
    const session = await verifyAuth();
    if (!session) {
      logServerActionError('verifyOTP', 'User not authenticated');
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
      logValidationError('verifyOTP', validation.errors);
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

    logOutgoingRequest('userService', '/verify-otp', 'POST', {
      userId,
      timestamp: new Date().toISOString(),
    });

    // Call user service to verify OTP
    try {
      await userServiceClient.verifyUserEmail(userId, otp);

      logIncomingResponse('userService', '/verify-otp', 200, {
        userId,
        timestamp: new Date().toISOString(),
      });

      // After successful OTP verification, login to get a JWT token
      if (email && password) {
        logOutgoingRequest('userService', '/login', 'POST', {
          email,
          timestamp: new Date().toISOString(),
        });

        const loginResponse = await userServiceClient.loginUser(email, password);

        logIncomingResponse('userService', '/login', 200, {
          userId: loginResponse.userId,
          timestamp: new Date().toISOString(),
        });

        // Update session with the JWT token from login
        await createSession(
          loginResponse.userId,
          email,
          session.username,
          loginResponse.token
        );
      }

      logServerActionSuccess('verifyOTP', { userId });

      // Return success without redirecting - let the client handle the view transition
      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/verify-otp', error, {
          statusCode: error.statusCode,
          userId,
        });
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
    logServerActionError('verifyOTP', error);
    return {
      message: 'An unexpected error occurred during OTP verification',
      success: false,
    };
  }
}

/**
 * Resends the email verification OTP to a user.
 *
 * Server Action that:
 * 1. Validates email input
 * 2. Calls user-service to resend OTP
 * 3. Returns confirmation message
 *
 * @param formData FormData containing the user's email
 * @returns Result with success status and message
 */
export async function resendOTP(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  logServerActionStart('resendOTP');

  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
    };

    const validation = validateInput(z.object({ email: z.string().email() }), input);
    if (!validation.success) {
      logValidationError('resendOTP', validation.errors);
      return {
        errors: validation.errors,
        message: 'Please provide a valid email address',
        success: false,
      };
    }

    const { email } = validation.data;

    logOutgoingRequest('userService', '/resend-otp', 'POST', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Call user service to resend OTP
    try {
      await userServiceClient.resendVerificationOtp(email);

      logIncomingResponse('userService', '/resend-otp', 200, {
        email,
        timestamp: new Date().toISOString(),
      });

      logServerActionSuccess('resendOTP', { email });

      return {
        success: true,
        message: 'Verification code has been resent to your email',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/resend-otp', error, {
          statusCode: error.statusCode,
          email,
        });
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
    logServerActionError('resendOTP', error);
    return {
      message: 'An unexpected error occurred while resending the OTP',
      success: false,
    };
  }
}

/**
 * Resends the password reset OTP without redirecting.
 *
 * Server Action that:
 * 1. Validates email input
 * 2. Calls user-service to resend reset OTP
 * 3. Returns confirmation (no redirect)
 *
 * @param formData FormData containing the user's email
 * @returns Result with success status and message
 */
export async function resendPasswordResetOtp(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  logServerActionStart('resendPasswordResetOtp');

  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
    };

    const validation = validateInput(z.object({ email: z.string().email() }), input);
    if (!validation.success) {
      logValidationError('resendPasswordResetOtp', validation.errors);
      return {
        errors: validation.errors,
        message: 'Please provide a valid email address',
        success: false,
      };
    }

    const { email } = validation.data;

    logOutgoingRequest('userService', '/forgot-password', 'POST', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Call user service to resend password reset OTP
    try {
      await userServiceClient.requestPasswordReset(email);

      logIncomingResponse('userService', '/forgot-password', 200, {
        email,
        timestamp: new Date().toISOString(),
      });

      logServerActionSuccess('resendPasswordResetOtp', { email });

      return {
        success: true,
        message: 'Password reset code has been resent to your email',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/forgot-password', error, {
          statusCode: error.statusCode,
          email,
        });
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
    logServerActionError('resendPasswordResetOtp', error);
    return {
      message: 'An unexpected error occurred while resending the code',
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
  logServerActionStart('requestPasswordReset');

  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
    };

    const validation = validateInput(forgotPasswordSchema, input);
    if (!validation.success) {
      logValidationError('requestPasswordReset', validation.errors);
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { email } = validation.data;

    logOutgoingRequest('userService', '/forgot-password', 'POST', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Call user service to send reset OTP
    try {
      await userServiceClient.requestPasswordReset(email);

      logIncomingResponse('userService', '/forgot-password', 200, {
        email,
        timestamp: new Date().toISOString(),
      });

      logServerActionSuccess('requestPasswordReset', { email });

      // Redirect to password reset form
      redirect(`/login?step=reset-password&email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/forgot-password', error, {
          statusCode: error.statusCode,
          email,
        });
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
    logServerActionError('requestPasswordReset', error);
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
  logServerActionStart('resetPassword');

  try {
    // Extract and validate form input
    const input = {
      email: formData.get('email'),
      otp: formData.get('otp'),
      newPassword: formData.get('newPassword'),
    };

    const validation = validateInput(resetPasswordSchema, input);
    if (!validation.success) {
      logValidationError('resetPassword', validation.errors);
      return {
        errors: validation.errors,
        message: 'Please fix the errors above',
        success: false,
      };
    }

    const { email, otp, newPassword } = validation.data;

    logOutgoingRequest('userService', '/reset-password', 'PUT', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Call user service to reset password
    try {
      await userServiceClient.resetUserPassword(email, otp, newPassword);

      logIncomingResponse('userService', '/reset-password', 200, {
        email,
        timestamp: new Date().toISOString(),
      });

      logServerActionSuccess('resetPassword', { email });

      // Redirect to login page
      redirect('/login?step=email-entry');
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/reset-password', error, {
          statusCode: error.statusCode,
          email,
        });
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
    logServerActionError('resetPassword', error);
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
  logServerActionStart('changePassword');

  try {
    // Ensure user is authenticated
    const session = await requireAuth();

    logOutgoingRequest('auth', '', 'GET', {
      userId: session.userId,
      action: 'fetch session',
      timestamp: new Date().toISOString(),
    });

    // Extract and validate form input
    const input = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    };

    const validation = validateInput(changePasswordSchema, input);
    if (!validation.success) {
      logValidationError('changePassword', validation.errors);
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

    logOutgoingRequest('userService', '/change-password', 'PUT', {
      userId: session.userId,
      timestamp: new Date().toISOString(),
    });

    // Call user service to change password with Bearer token
    try {
      await userServiceClient.changeUserPassword(
        authToken,
        validation.data.currentPassword,
        validation.data.newPassword
      );

      logIncomingResponse('userService', '/change-password', 200, {
        userId: session.userId,
        timestamp: new Date().toISOString(),
      });

      logServerActionSuccess('changePassword', {
        userId: session.userId,
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof userServiceClient.UserServiceError) {
        logServiceError('userService', '/change-password', error, {
          statusCode: error.statusCode,
          userId: session.userId,
        });
        return {
          message: error.message,
          success: false,
        };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      logServerActionError('changePassword', 'User not authenticated');
      return {
        message: 'You must be logged in to change your password',
        success: false,
      };
    }
    logServerActionError('changePassword', error);
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
  logServerActionStart('updateUserProfile');

  try {
    // Verify user is authenticated
    const session = await requireAuth();

    logOutgoingRequest('auth', '', 'GET', {
      userId: session.userId,
      action: 'fetch session',
      timestamp: new Date().toISOString(),
    });

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
      logValidationError('updateUserProfile', validation.errors);
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

    logOutgoingRequest('userService', '/profile', 'PUT', {
      userId: session.userId,
      displayName: profileUpdates.displayName,
      skillLevel: profileUpdates.skillLevel,
      timestamp: new Date().toISOString(),
    });

    // Update user profile via user-service with Bearer token
    await userServiceClient.updateUserProfile(
      authToken,
      profileUpdates
    );

    logIncomingResponse('userService', '/profile', 200, {
      userId: session.userId,
      timestamp: new Date().toISOString(),
    });

    // Mark profile as complete in the session
    await markProfileComplete();

    logServerActionSuccess('updateUserProfile', {
      userId: session.userId,
      displayName: profileUpdates.displayName,
    });

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
      logServerActionError('updateUserProfile', 'User not authenticated');
      return {
        message: 'You must be logged in to update your profile',
        success: false,
      };
    }
    if (error instanceof userServiceClient.UserServiceError) {
      logServiceError('userService', '/profile', error, {
        statusCode: error.statusCode,
      });
      return {
        message: error.message || 'Failed to update profile',
        success: false,
      };
    }
    logServerActionError('updateUserProfile', error);
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
    // No session - user is logged out, this is expected and not an error
    return null;
  }

  logServerActionStart('getUserProfile', {
    username: sessionUserInfo.username,
  });

  try {
    logOutgoingRequest('userService', `/${sessionUserInfo.username}`, 'GET', {
      username: sessionUserInfo.username,
      timestamp: new Date().toISOString(),
    });

    const userProfile = await userServiceClient.getUserProfile(sessionUserInfo.username);

    logIncomingResponse('userService', `/${sessionUserInfo.username}`, 200, {
      userId: userProfile.userId,
      timestamp: new Date().toISOString(),
    });

    logServerActionSuccess('getUserProfile', {
      userId: userProfile.userId,
      username: sessionUserInfo.username,
    });

    return userProfile;
  } catch (error) {
    // If user not found (404), clear the invalid session
    if (error instanceof userServiceClient.UserServiceError && error.statusCode === 404) {
      logServiceError('userService', `/${sessionUserInfo.username}`, error, {
        statusCode: 404,
        username: sessionUserInfo.username,
        action: 'clearing invalid session',
      });
      await deleteSession();
      return null;
    }

    // For other errors, log but don't crash
    logServiceError('userService', `/${sessionUserInfo.username}`, error, {
      statusCode: error instanceof userServiceClient.UserServiceError ? error.statusCode : undefined,
      username: sessionUserInfo.username,
    });
    return null;
  }
}

/**
 * Logs out the current user.
 *
 * Server Action that:
 * 1. Deletes the session cookie
 * 2. Returns success; client handles navigation
 */
export async function logout() {
  logServerActionStart('logout')

  await deleteSession()

  logServerActionSuccess('logout', {
    timestamp: new Date().toISOString(),
  })

  // Let the client handle navigation (e.g. router.push('/login'))
  return { success: true }
}


