// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑11-1
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

/**
 * Profile Server Actions
 *
 * Server-only functions for managing user profile data.
 * These actions handle fetching and updating user profile information.
 */

'use server';

import { revalidatePath, updateTag } from 'next/cache';
import * as userProfileManager from '@/lib/userProfileManager';
import { deleteSession } from '@/lib/session';
import type { UserProfile, ProfileUpdatePayload } from '@/lib/userProfileManager';
import {
  logServerActionStart,
  logServerActionSuccess,
  logServerActionError,
  logOutgoingRequest,
  logIncomingResponse,
  logServiceError,
  logTiming,
} from '@/lib/logger';

/**
 * Fetches the current authenticated user's complete profile.
 *
 * @returns User profile data or null if not authenticated
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  logServerActionStart('getCurrentUserProfile');
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/profile', 'GET', {
      action: 'fetch current user profile',
      timestamp: new Date().toISOString(),
    });

    const profile = await userProfileManager.getCurrentUserProfile();

    const durationMilliseconds = Date.now() - startTime;

    if (profile) {
      logIncomingResponse('userService', '/profile', 200, {
        userId: profile.userId,
        timestamp: new Date().toISOString(),
      });

      logTiming('getCurrentUserProfile', durationMilliseconds);
      logServerActionSuccess('getCurrentUserProfile', {
        userId: profile.userId,
      });
    }

    return profile;
  } catch (error) {
    logServiceError('userService', '/profile', error);
    logServerActionError('getCurrentUserProfile', error);
    return null;
  }
}

/**
 * Fetches a user's profile by ID.
 *
 * @param userId The user's ID
 * @returns User profile data or null if not found
 */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  logServerActionStart('getUserProfileById', { userId });
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', `/profile/${userId}`, 'GET', {
      userId,
      timestamp: new Date().toISOString(),
    });

    const profile = await userProfileManager.getUserProfileById(userId);

    const durationMilliseconds = Date.now() - startTime;

    if (profile) {
      logIncomingResponse('userService', `/profile/${userId}`, 200, {
        userId: profile.userId,
        timestamp: new Date().toISOString(),
      });

      logTiming('getUserProfileById', durationMilliseconds, { userId });
      logServerActionSuccess('getUserProfileById', { userId });
    }

    return profile;
  } catch (error) {
    logServiceError('userService', `/profile/${userId}`, error, { userId });
    logServerActionError('getUserProfileById', error, { userId });
    return null;
  }
}

/**
 * Updates the current authenticated user's profile.
 *
 * @param updates Partial profile updates
 * @returns Updated user profile or null on error
 */
export async function updateUserProfile(
  updates: ProfileUpdatePayload
): Promise<UserProfile | null> {
  logServerActionStart('updateUserProfile (profile action)', {
    updateKeys: Object.keys(updates),
  });
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/profile', 'PUT', {
      updateKeys: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    const result = await userProfileManager.updateCurrentUserProfile(updates);

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('userService', '/profile', 200, {
      userId: result?.userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('updateUserProfile', durationMilliseconds, {
      updateCount: Object.keys(updates).length,
    });

    // Revalidate affected paths to refresh data
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/home');
    if (result?.username) {
      updateTag(`user-profile:${result.username}`);
    }

    logServerActionSuccess('updateUserProfile (profile action)', {
      userId: result?.userId,
      updateCount: Object.keys(updates).length,
    });

    return result;
  } catch (error) {
    logServiceError('userService', '/profile', error, {
      updateKeys: Object.keys(updates),
    });
    logServerActionError('updateUserProfile (profile action)', error);
    throw error;
  }
}

/**
 * Gets the current user's preferred programming languages.
 *
 * @returns Array of preferred language values or empty array
 */
export async function getUserPreferredLanguages(): Promise<string[]> {
  logServerActionStart('getUserPreferredLanguages');

  try {
    logOutgoingRequest('userService', '/profile', 'GET', {
      action: 'fetch preferred languages',
      timestamp: new Date().toISOString(),
    });

    const profile = await userProfileManager.getCurrentUserProfile();

    logIncomingResponse('userService', '/profile', 200, {
      timestamp: new Date().toISOString(),
    });

    logServerActionSuccess('getUserPreferredLanguages', {
      languageCount: profile?.preferredTopics?.length || 0,
    });

    return profile?.preferredTopics || [];
  } catch (error) {
    logServiceError('userService', '/profile', error, {
      action: 'fetch preferred languages',
    });
    logServerActionError('getUserPreferredLanguages', error);
    return [];
  }
}

/**
 * Gets the current user's pronouns.
 *
 * @returns Array of pronouns or empty array
 */
export async function getUserPronouns(): Promise<string[]> {
  logServerActionStart('getUserPronouns');

  try {
    logOutgoingRequest('userService', '/profile', 'GET', {
      action: 'fetch pronouns',
      timestamp: new Date().toISOString(),
    });

    const profile = await userProfileManager.getCurrentUserProfile();

    logIncomingResponse('userService', '/profile', 200, {
      timestamp: new Date().toISOString(),
    });

    logServerActionSuccess('getUserPronouns', {
      pronounCount: profile?.pronouns?.length || 0,
    });

    return profile?.pronouns || [];
  } catch (error) {
    logServiceError('userService', '/profile', error, {
      action: 'fetch pronouns',
    });
    logServerActionError('getUserPronouns', error);
    return [];
  }
}

/**
 * Changes the current user's password.
 *
 * @param currentPassword The user's current password
 * @param newPassword The new password
 * @returns Success or error message
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  logServerActionStart('changePassword (profile action)');
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/change-password', 'PUT', {
      action: 'change password',
      timestamp: new Date().toISOString(),
    });

    await userProfileManager.changeCurrentUserPassword(currentPassword, newPassword);

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('userService', '/change-password', 200, {
      timestamp: new Date().toISOString(),
    });

    logTiming('changePassword', durationMilliseconds);
    logServerActionSuccess('changePassword (profile action)');

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    logServiceError('userService', '/change-password', error);
    logServerActionError('changePassword (profile action)', error);

    const message = error instanceof Error ? error.message : 'Failed to change password';
    return { success: false, message };
  }
}

/**
 * Uploads a new profile picture.
 *
 * @param file The image file to upload
 * @returns Updated user profile or null on error
 */
export async function uploadProfilePicture(
  file: File
): Promise<UserProfile | null> {
  logServerActionStart('uploadProfilePicture', {
    fileName: file.name,
    fileSize: file.size,
  });
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/profile/picture', 'PUT', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: new Date().toISOString(),
    });

    const result = await userProfileManager.uploadCurrentUserProfilePicture(file);

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('userService', '/profile/picture', 200, {
      userId: result?.userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('uploadProfilePicture', durationMilliseconds, {
      fileSize: file.size,
    });

    // Revalidate affected paths to refresh data
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/home');
    if (result?.username) {
      updateTag(`user-profile:${result.username}`);
    }

    logServerActionSuccess('uploadProfilePicture', {
      userId: result?.userId,
      fileSize: file.size,
    });

    return result;
  } catch (error) {
    logServiceError('userService', '/profile/picture', error, {
      fileName: file.name,
      fileSize: file.size,
    });
    logServerActionError('uploadProfilePicture', error);
    throw error;
  }
}

/**
 * Removes the current user's profile picture.
 *
 * @returns Updated user profile or null on error
 */
export async function removeProfilePicture(): Promise<UserProfile | null> {
  logServerActionStart('removeProfilePicture');
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/profile/picture', 'DELETE', {
      action: 'remove profile picture',
      timestamp: new Date().toISOString(),
    });

    const result = await userProfileManager.removeCurrentUserProfilePicture();

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('userService', '/profile/picture', 200, {
      userId: result?.userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('removeProfilePicture', durationMilliseconds);

    // Revalidate affected paths to refresh data
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/home');
    if (result?.username) {
      updateTag(`user-profile:${result.username}`);
    }

    logServerActionSuccess('removeProfilePicture', {
      userId: result?.userId,
    });

    return result;
  } catch (error) {
    logServiceError('userService', '/profile/picture', error, {
      action: 'remove profile picture',
    });
    logServerActionError('removeProfilePicture', error);
    throw error;
  }
}

/**
 * Deletes the current user's account permanently.
 *
 * @returns Success or error message
 */
export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  logServerActionStart('deleteAccount');
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/account', 'DELETE', {
      action: 'delete account',
      timestamp: new Date().toISOString(),
    });

    await userProfileManager.deleteCurrentUserAccount();

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('userService', '/account', 200, {
      action: 'account deleted',
      timestamp: new Date().toISOString(),
    });

    logTiming('deleteAccount', durationMilliseconds);
    
    // Delete the session cookie to log the user out
    await deleteSession();

    logServerActionSuccess('deleteAccount');

    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    logServiceError('userService', '/account', error, {
      action: 'delete account',
    });
    logServerActionError('deleteAccount', error);

    const message = error instanceof Error ? error.message : 'Failed to delete account';
    return { success: false, message };
  }
}

/**
 * Records a completed question for the user.
 *
 * @param questionId The question ID
 * @returns Success or error message
 */
export async function recordCompletedQuestion(
  questionId: string
): Promise<{ success: boolean; message: string }> {
  logServerActionStart('recordCompletedQuestion', { questionId });
  const startTime = Date.now();

  try {
    logOutgoingRequest('userService', '/completed-questions', 'POST', {
      questionId,
      timestamp: new Date().toISOString(),
    });

    await userProfileManager.recordCompletedQuestion(questionId);

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('userService', '/completed-questions', 200, {
      questionId,
      timestamp: new Date().toISOString(),
    });

    logTiming('recordCompletedQuestion', durationMilliseconds, { questionId });
    logServerActionSuccess('recordCompletedQuestion', { questionId });

    return { success: true, message: 'Question recorded successfully' };
  } catch (error) {
    logServiceError('userService', '/completed-questions', error, {
      questionId,
    });
    logServerActionError('recordCompletedQuestion', error);

    const message = error instanceof Error ? error.message : 'Failed to record question';
    return { success: false, message };
  }
}
