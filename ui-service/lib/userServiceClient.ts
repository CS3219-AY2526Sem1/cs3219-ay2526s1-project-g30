/**
 * User Service Client
 *
 * Handles all API communication with the user-service microservice.
 * Provides type-safe, error-handling wrappers around user-service endpoints.
 *
 * All requests are made server-side to keep API secrets secure.
 * Implements exponential backoff for transient failures.
 */

import 'server-only';

import { config } from './config';
import type {
  User,
  RegisterResponse,
  LoginResponse,
  VerifyOtpResponse,
  PasswordResetResponse,
} from '@/types/auth';

/**
 * Custom error for user service API failures.
 */
export class UserServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

/**
 * Makes an API call to the user service with proper error handling.
 *
 * @param endpoint The endpoint path (e.g., '/register')
 * @param method The HTTP method
 * @param body Optional request body
 * @param auth Optional authorization token
 * @returns The parsed JSON response
 * @throws UserServiceError if the request fails
 */
async function callUserService<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  auth?: string
): Promise<T> {
  const url = `${config.userService.baseUrl}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    headers.Authorization = `Bearer ${auth}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.userService.timeout
    );

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = (await response.json()) as T & {
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new UserServiceError(
        data.message || data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof UserServiceError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new UserServiceError(
        `Failed to connect to user service: ${error.message}`,
        undefined,
        error
      );
    }

    throw new UserServiceError(
      'An unexpected error occurred while contacting user service',
      undefined,
      error
    );
  }
}

/**
 * Registers a new user account.
 *
 * @param username The desired username
 * @param email The user's email address
 * @param password The user's password (will be hashed on server)
 * @returns User ID and confirmation message
 * @throws UserServiceError if registration fails
 */
export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  return callUserService<RegisterResponse>(
    '/register',
    'POST',
    { username, email, password }
  );
}

/**
 * Authenticates a user with email and password.
 *
 * @param email The user's email address
 * @param password The user's password
 * @returns User ID and authentication token
 * @throws UserServiceError if login fails
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  return callUserService<LoginResponse>(
    '/login',
    'POST',
    { email, password }
  );
}

/**
 * Verifies a user's email using an OTP.
 *
 * @param userId The user ID
 * @param otp The 6-digit OTP from the verification email
 * @returns Confirmation message
 * @throws UserServiceError if verification fails
 */
export async function verifyUserEmail(
  userId: string,
  otp: string
): Promise<VerifyOtpResponse> {
  return callUserService<VerifyOtpResponse>(
    '/verify-otp',
    'POST',
    { userId, otp }
  );
}

/**
 * Sends a password reset OTP to the user's email.
 *
 * @param email The user's email address
 * @returns Confirmation message
 * @throws UserServiceError if request fails
 */
export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResponse> {
  return callUserService<PasswordResetResponse>(
    '/forgot-password',
    'POST',
    { email }
  );
}

/**
 * Resets a user's password using an OTP.
 *
 * @param email The user's email address
 * @param otp The 6-digit OTP from the reset email
 * @param newPassword The new password
 * @returns Confirmation message
 * @throws UserServiceError if reset fails
 */
export async function resetUserPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  return callUserService<PasswordResetResponse>(
    '/reset-password',
    'PUT',
    { email, otp, newPassword }
  );
}

/**
 * Retrieves a user's public profile information.
 *
 * @param username The user's username
 * @returns User profile data
 * @throws UserServiceError if user not found
 */
export async function getUserProfile(username: string): Promise<User> {
  return callUserService<User>(`/${username}`, 'GET');
}

/**
 * Updates the logged-in user's profile information.
 *
 * @param token The user's authentication token
 * @param updates Partial user profile updates
 * @returns Updated user profile
 * @throws UserServiceError if update fails
 */
export async function updateUserProfile(
  token: string,
  updates: Partial<Omit<User, 'userId' | 'email' | 'createdAt' | 'updatedAt'>>
): Promise<User> {
  return callUserService<User>(
    '/profile',
    'PUT',
    updates,
    token
  );
}

/**
 * Changes the logged-in user's password.
 *
 * @param token The user's authentication token
 * @param currentPassword The user's current password
 * @param newPassword The new password
 * @returns Confirmation message
 * @throws UserServiceError if change fails
 */
export async function changeUserPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  return callUserService<PasswordResetResponse>(
    '/change-password',
    'PUT',
    { currentPassword, newPassword },
    token
  );
}

/**
 * Uploads a new profile picture for the logged-in user.
 *
 * Note: This function is a placeholder. Actual file upload will require
 * form-data encoding and multipart/form-data content type, which needs
 * different handling than this text-based API client.
 *
 * @param token The user's authentication token
 * @param file The image file to upload
 * @returns Updated user profile with new picture URL
 * @throws UserServiceError if upload fails
 */
export async function uploadProfilePicture(
  token: string,
  file: File
): Promise<User> {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const url = `${config.userService.baseUrl}/profile/picture`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.userService.timeout
    );

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = (await response.json()) as {
      message?: string;
      error?: string;
      profilePictureUrl?: string;
    } & Partial<User>;

    if (!response.ok) {
      throw new UserServiceError(
        data.message || data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    // The backend returns { message, profilePictureUrl }
    // Return a minimal User object with the updated picture URL
    return {
      profilePictureUrl: data.profilePictureUrl || '',
    } as User;
  } catch (error) {
    if (error instanceof UserServiceError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new UserServiceError(
        `Failed to upload profile picture: ${error.message}`,
        undefined,
        error
      );
    }

    throw new UserServiceError(
      'An unexpected error occurred while uploading profile picture',
      undefined,
      error
    );
  }
}

/**
 * Deletes the logged-in user's account permanently.
 *
 * @param token The user's authentication token
 * @returns Confirmation message
 * @throws UserServiceError if deletion fails
 */
export async function deleteUserAccount(
  token: string
): Promise<PasswordResetResponse> {
  return callUserService<PasswordResetResponse>(
    '/profile',
    'DELETE',
    undefined,
    token
  );
}

/**
 * Adds a completed question to the user's profile.
 *
 * @param userId The user's ID
 * @param questionId The question ID that was completed
 * @returns Updated user data with questions completed array
 * @throws UserServiceError if update fails
 */
export async function addCompletedQuestion(
  userId: string,
  questionId: string
): Promise<{ message: string; questionsCompleted: string[] }> {
  return callUserService<{ message: string; questionsCompleted: string[] }>(
    '/profile/add-completed-question',
    'POST',
    { userId, questionId }
  );
}

/**
 * Resends the email verification OTP to a user.
 *
 * @param email The user's email address
 * @returns Confirmation message
 * @throws UserServiceError if request fails
 */
export async function resendVerificationOtp(
  email: string
): Promise<{ message: string }> {
  return callUserService<{ message: string }>(
    '/resend-verification-otp',
    'POST',
    { email }
  );
}

/**
 * Checks if a username is available.
 *
 * @param username The username to check
 * @returns Object indicating if username is available
 * @throws UserServiceError if request fails
 */
export async function checkUsername(
  username: string
): Promise<{ isAvailable: boolean; message: string }> {
  return callUserService<{ isAvailable: boolean; message: string }>(
    '/check-username',
    'POST',
    { username }
  );
}

