// AI Assistance Disclosure:
// Tool: GitHub Copilot (Claude 4.5 Haiku), date: 2025‑11-1
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

/**
 * User Profile Manager
 *
 * Centralized service layer for managing user profile data.
 * Handles all interactions with the user-service backend, providing a clean
 * interface for components and server actions to fetch and update user information.
 *
 * This file abstracts away the complexities of API communication, token management,
 * and error handling, allowing components to focus on presentation logic.
 *
 * Usage:
 * - Server Actions: Use these functions with authentication tokens
 * - Components: Call via server actions or React hooks
 * - Direct API: All functions are server-side only (use 'server-only')
 */

import 'server-only';

import * as userServiceClient from './userServiceClient';
import { generateAuthToken } from './session';
import { getSessionUserInfo, getSessionJWTToken } from './dal';
import { ProgrammingLanguage } from '@/types/programming';
import { SocialLink } from '@/types/social';
import type { User } from '@/types/auth';

/**
 * Extended user profile type with additional fields needed by the UI
 */
export interface UserProfile extends User {
  displayName?: string;
  headline?: string;
  bio?: string;
  pronouns?: string[];
  socialLinks?: SocialLink[];
}

/**
 * Profile update payload with all editable fields
 */
export interface ProfileUpdatePayload {
  displayName?: string;
  headline?: string;
  bio?: string;
  pronouns?: string[];
  preferredLanguages?: ProgrammingLanguage[];
  socialLinks?: SocialLink[];
}

/**
 * Fetches the current authenticated user's full profile.
 *
 * @returns User profile with all fields, or null if not authenticated
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    return null;
  }

  try {
    const userProfile = await userServiceClient.getUserProfile(sessionUserInfo.username);
    return userProfile as UserProfile;
  } catch (error) {
    console.error('Failed to fetch current user profile:', error);
    return null;
  }
}

/**
 * Fetches a user's profile by username (public profile view).
 * Does not require authentication.
 *
 * @param username The user's username
 * @returns User profile or null if not found
 */
export async function getUserProfileById(username: string): Promise<UserProfile | null> {
  try {
    const userProfile = await userServiceClient.getUserProfile(username);
    return userProfile as UserProfile;
  } catch (error) {
    console.error(`Failed to fetch user profile for username ${username}:`, error);
    return null;
  }
}

/**
 * Updates the authenticated user's profile with new information.
 *
 * @param updates Partial profile updates
 * @returns Updated user profile
 * @throws Error if update fails or user not authenticated
 */
export async function updateCurrentUserProfile(
  updates: ProfileUpdatePayload
): Promise<UserProfile> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    throw new Error('User not authenticated');
  }

  try {
    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(sessionUserInfo.userId);
    }

    // Map UI field names to backend field names
    const backendUpdates: Record<string, unknown> = {};

    if (updates.displayName !== undefined) backendUpdates.displayName = updates.displayName;
    if (updates.headline !== undefined) backendUpdates.headline = updates.headline;
    if (updates.bio !== undefined) backendUpdates.aboutMeInformation = updates.bio;
    if (updates.pronouns !== undefined) backendUpdates.pronouns = updates.pronouns;
    if (updates.preferredLanguages !== undefined) {
      backendUpdates.preferredTopics = updates.preferredLanguages;
    }
    if (updates.socialLinks !== undefined) backendUpdates.socialLinks = updates.socialLinks;

    const updatedProfile = await userServiceClient.updateUserProfile(
      authToken,
      backendUpdates
    );

    return updatedProfile as UserProfile;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}

/**
 * Updates the authenticated user's password.
 *
 * @param currentPassword The user's current password
 * @param newPassword The new password
 * @throws Error if change fails or user not authenticated
 */
export async function changeCurrentUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    throw new Error('User not authenticated');
  }

  try {
    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(sessionUserInfo.userId);
    }

    await userServiceClient.changeUserPassword(
      authToken,
      currentPassword,
      newPassword
    );
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
}

/**
 * Uploads a new profile picture for the authenticated user.
 *
 * @param file The image file to upload
 * @returns Updated user profile with new picture URL
 * @throws Error if upload fails or user not authenticated
 */
export async function uploadCurrentUserProfilePicture(
  file: File
): Promise<UserProfile> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    throw new Error('User not authenticated');
  }

  try {
    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(sessionUserInfo.userId);
    }

    const updatedProfile = await userServiceClient.uploadProfilePicture(
      authToken,
      file
    );

    return updatedProfile as UserProfile;
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    throw error;
  }
}

/**
 * Removes the authenticated user's profile picture.
 *
 * @returns Updated user profile with null picture URL
 * @throws Error if removal fails or user not authenticated
 */
export async function removeCurrentUserProfilePicture(): Promise<UserProfile> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    throw new Error('User not authenticated');
  }

  try {
    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(sessionUserInfo.userId);
    }

    // Update profile with empty picture URL to clear it
    const updatedProfile = await userServiceClient.updateUserProfile(authToken, {
      profilePictureUrl: '' as any,
    });

    return updatedProfile as UserProfile;
  } catch (error) {
    console.error('Failed to remove profile picture:', error);
    throw error;
  }
}

/**
 * Deletes the authenticated user's account permanently.
 *
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteCurrentUserAccount(): Promise<void> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    throw new Error('User not authenticated');
  }

  try {
    // Use the JWT token stored in the session (from user-service login)
    // If not available, fall back to generating one
    let authToken = await getSessionJWTToken();
    if (!authToken) {
      authToken = await generateAuthToken(sessionUserInfo.userId);
    }

    await userServiceClient.deleteUserAccount(authToken);
  } catch (error) {
    console.error('Failed to delete user account:', error);
    throw error;
  }
}

/**
 * Records a completed question for the user.
 *
 * @param questionId The ID of the question that was completed
 * @throws Error if update fails
 */
export async function recordCompletedQuestion(questionId: string): Promise<void> {
  const sessionUserInfo = await getSessionUserInfo();

  if (!sessionUserInfo) {
    throw new Error('User not authenticated');
  }

  try {
    await userServiceClient.addCompletedQuestion(sessionUserInfo.userId, questionId);
  } catch (error) {
    console.error('Failed to record completed question:', error);
    throw error;
  }
}
