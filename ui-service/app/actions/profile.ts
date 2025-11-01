/**
 * Profile Server Actions
 *
 * Server-only functions for managing user profile data.
 * These actions handle fetching and updating user profile information.
 */

'use server';

import { revalidatePath } from 'next/cache';
import * as userProfileManager from '@/lib/userProfileManager';
import type { UserProfile, ProfileUpdatePayload } from '@/lib/userProfileManager';

/**
 * Fetches the current authenticated user's complete profile.
 *
 * @returns User profile data or null if not authenticated
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    return await userProfileManager.getCurrentUserProfile();
  } catch (error) {
    console.error('Failed to fetch current user profile:', error);
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
  try {
    return await userProfileManager.getUserProfileById(userId);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
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
  try {
    const result = await userProfileManager.updateCurrentUserProfile(updates);
    
    // Revalidate affected paths to refresh data
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/home');
    
    return result;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}

/**
 * Gets the current user's preferred programming languages.
 *
 * @returns Array of preferred language values or empty array
 */
export async function getUserPreferredLanguages(): Promise<string[]> {
  try {
    const profile = await userProfileManager.getCurrentUserProfile();
    return profile?.preferredTopics || [];
  } catch (error) {
    console.error('Failed to fetch preferred languages:', error);
    return [];
  }
}

/**
 * Gets the current user's pronouns.
 *
 * @returns Array of pronouns or empty array
 */
export async function getUserPronouns(): Promise<string[]> {
  try {
    const profile = await userProfileManager.getCurrentUserProfile();
    return profile?.pronouns || [];
  } catch (error) {
    console.error('Failed to fetch pronouns:', error);
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
  try {
    await userProfileManager.changeCurrentUserPassword(currentPassword, newPassword);
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
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
  try {
    const result = await userProfileManager.uploadCurrentUserProfilePicture(file);
    
    // Revalidate affected paths to refresh data
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/home');
    
    return result;
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    throw error;
  }
}

/**
 * Removes the current user's profile picture.
 *
 * @returns Updated user profile or null on error
 */
export async function removeProfilePicture(): Promise<UserProfile | null> {
  try {
    const result = await userProfileManager.removeCurrentUserProfilePicture();
    
    // Revalidate affected paths to refresh data
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/home');
    
    return result;
  } catch (error) {
    console.error('Failed to remove profile picture:', error);
    throw error;
  }
}

/**
 * Deletes the current user's account permanently.
 *
 * @returns Success or error message
 */
export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  try {
    await userProfileManager.deleteCurrentUserAccount();
    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
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
  try {
    await userProfileManager.recordCompletedQuestion(questionId);
    return { success: true, message: 'Question recorded successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record question';
    return { success: false, message };
  }
}
