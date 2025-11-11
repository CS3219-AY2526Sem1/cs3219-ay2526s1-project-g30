/**
 * User profile cache for fetching avatars and other profile data.
 * Caches profiles to avoid repeated API calls for the same users.
 * 
 * This is a client-side utility that fetches user data via the UI service's
 * public API route (/api/users/:username), which internally communicates
 * with the user service.
 */

import type { User } from '@/types/auth';

interface CacheEntry {
  profile: User | null;
  timestamp: number;
}

// Cache duration: 5 minutes for successful fetches
const CACHE_DURATION = 5 * 60 * 1000;
// Cache failed fetches for 1 minute to avoid repeated API calls
const FAILURE_CACHE_DURATION = 1 * 60 * 1000;

// In-memory cache for user profiles
const profileCache = new Map<string, CacheEntry>();

/**
 * Fetches a user's profile data via the UI service API, with caching to reduce API calls.
 * @param username The username to fetch
 * @returns The user's profile data, or null if not found/failed
 */
export async function fetchUserProfile(username: string): Promise<User | null> {
  // Check cache first
  const cached = profileCache.get(username);
  if (cached) {
    const cacheDuration = cached.profile === null ? FAILURE_CACHE_DURATION : CACHE_DURATION;
    if (Date.now() - cached.timestamp < cacheDuration) {
      return cached.profile;
    }
  }

  try {
    // Call the UI service's public API endpoint
    // This endpoint will internally communicate with the user service
    const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Cache the failure for a shorter duration
      if (response.status === 404) {
        profileCache.set(username, {
          profile: null,
          timestamp: Date.now(),
        });
        console.warn(`[User Profile Cache] User not found: ${username}`);
        return null;
      }
      
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const profile: User = await response.json();
    
    // Cache the successful result
    profileCache.set(username, {
      profile,
      timestamp: Date.now(),
    });

    return profile;
  } catch (error) {
    console.error(`[User Profile Cache] Failed to fetch profile for ${username}:`, error);
    
    // Cache the failure to avoid repeated API calls
    profileCache.set(username, {
      profile: null,
      timestamp: Date.now(),
    });
    
    return null;
  }
}

/**
 * Gets the avatar URL for a user.
 * @param username The username to fetch avatar for
 * @returns The avatar URL if available, otherwise null
 */
export async function getUserAvatarUrl(username: string): Promise<string | null> {
  const profile = await fetchUserProfile(username);
  return profile?.profilePictureUrl || null;
}

/**
 * Clears the profile cache.
 */
export function clearProfileCache(): void {
  profileCache.clear();
}

/**
 * Clears a specific user's profile from cache.
 */
export function clearUserProfileCache(username: string): void {
  profileCache.delete(username);
}
