// AI Assistance Disclosure:
// Tool: GitHub Copilot (Claude 4.5 Haiku), date: 2025‑10-26
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

/**
 * Server Component utilities for fetching current user data.
 *
 * Provides type-safe access to the current authenticated user's information
 * in Server Components using the authentication session.
 *
 * This module uses React's cache() API to memoize results during a single render pass,
 * preventing duplicate database/API calls.
 */

import 'server-only';

import { cache } from 'react';
import { getSessionUserInfo } from './dal';
import * as userServiceClient from './userServiceClient';
import type { User } from '@/types/auth';

/**
 * Retrieves the current authenticated user's information from the session.
 *
 * This function:
 * - Checks for a valid authentication session
 * - Returns only cached session data (userId, email, username)
 * - Does NOT make external API calls
 *
 * For full user profile information (including profile picture, skill level, etc.),
 * use getCurrentUserProfile() instead.
 *
 * @returns Session user info if authenticated, or null otherwise
 *
 * @example
 * ```tsx
 * export default async function ProfilePage() {
 *   const currentUser = await getCurrentUser();
 *   if (!currentUser) return redirect('/login');
 *   return <p>Logged in as {currentUser.username}</p>;
 * }
 * ```
 */
export const getCurrentUser = cache(getSessionUserInfo);

/**
 * Retrieves the current authenticated user's full profile information.
 *
 * This function:
 * - Checks for a valid authentication session
 * - Makes an API call to user-service to fetch full profile data
 * - Includes profile picture, skill level, preferred topics, etc.
 * - Uses React's cache() API to prevent duplicate calls during single render
 *
 * @returns Full user profile if authenticated, or null otherwise
 * @throws Error if user is not authenticated
 *
 * @example
 * ```tsx
 * export default async function SettingsPage() {
 *   const profile = await getCurrentUserProfile();
 *   if (!profile) return redirect('/login');
 *   return <p>Skill level: {profile.skillLevel}</p>;
 * }
 * ```
 */
export const getCurrentUserProfile = cache(async (): Promise<User | null> => {
  const userInfo = await getSessionUserInfo();

  if (!userInfo) {
    return null;
  }

  try {
    return await userServiceClient.getUserProfile(userInfo.username);
  } catch (error) {
    // Log error but don't throw - graceful degradation
    console.error('Failed to fetch user profile:', error);
    return null;
  }
});

/**
 * Type for CurrentUser interface (for backwards compatibility).
 * Prefer using the User type from @/types/auth for new code.
 */
export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
}
