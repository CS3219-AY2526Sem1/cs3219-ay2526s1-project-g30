/**
 * Mock user profile data for the settings page.
 * 
 * All mock data is now centralised in lib/mockData.ts.
 * This file re-exports constants from the centralised location to maintain
 * backward compatibility with existing imports.
 * 
 * TODO: Create a Server Component that calls getCurrentUserProfile() to fetch this data.
 * 
 * Implementation guide:
 * - Call backend API endpoint: GET /api/user/profile
 * - Expected response shape:
 *   {
 *     displayName: string;
 *     headline: string;
 *     bio: string;
 *     profileImage: string | null;
 *     pronouns: string[];
 *     preferredLanguages: ProgrammingLanguage[];
 *     socialLinks: SocialLink[];
 *   }
 * - Handle authentication errors (401) by redirecting to /login
 * - Pass fetched data as props to the SettingsView client component
 * 
 * For now, the SettingsView client component receives this mock data as props
 * from a parent Server Component that fetches the real data.
 */

import {
  INITIAL_DISPLAY_NAME,
  INITIAL_HEADLINE,
  INITIAL_BIO,
  INITIAL_PROFILE_IMAGE,
  INITIAL_PRONOUNS,
  INITIAL_PREFERRED_LANGUAGES,
  INITIAL_SOCIAL_LINKS,
  INITIAL_PRONOUNS_OPTIONS,
  INITIAL_PROGRAMMING_LANGUAGE_OPTIONS,
} from '@/lib/mockData';

export {
  INITIAL_DISPLAY_NAME,
  INITIAL_HEADLINE,
  INITIAL_BIO,
  INITIAL_PROFILE_IMAGE,
  INITIAL_PRONOUNS,
  INITIAL_PREFERRED_LANGUAGES,
  INITIAL_SOCIAL_LINKS,
  INITIAL_PRONOUNS_OPTIONS,
  INITIAL_PROGRAMMING_LANGUAGE_OPTIONS,
};

/**
 * Server-side function to fetch user profile data.
 * 
 * TODO: Implement this function to fetch from backend API (GET /api/user/profile).
 * Should be called in a Server Component only.
 * 
 * Example implementation:
 *   export async function getUserProfile(): Promise<UserProfile | null> {
 *     const response = await fetch(`${process.env.API_BASE_URL}/api/user/profile`, {
 *       headers: {
 *         'Authorization': `Bearer ${getAuthToken()}`,
 *       },
 *     });
 *     if (!response.ok) {
 *       if (response.status === 401) redirect('/login');
 *       return null;
 *     }
 *     return response.json();
 *   }
 */
export async function getUserProfile() {
  // TODO: Replace with actual API call from Server Component
  return {
    displayName: INITIAL_DISPLAY_NAME,
    headline: INITIAL_HEADLINE,
    bio: INITIAL_BIO,
    profileImage: INITIAL_PROFILE_IMAGE,
    pronouns: INITIAL_PRONOUNS,
    preferredLanguages: INITIAL_PREFERRED_LANGUAGES,
    socialLinks: INITIAL_SOCIAL_LINKS,
  };
}
