/**
 * Mock user profile data for the profile viewing page.
 *
 * TODO: Create a Server Component that calls getUserProfileByUsername() to fetch this data.
 *
 * Implementation guide:
 * - Call backend API endpoint: GET /api/user/:username/profile
 * - Expected response shape:
 *   {
 *     username: string;
 *     displayName: string;
 *     headline: string | null;
 *     bio: string | null;
 *     profileImage: string | null;
 *     pronouns: string[];
 *     preferredLanguages: ProgrammingLanguage[];
 *     socialLinks: SocialLink[];
 *   }
 * - Handle not found errors (404) by showing a 404 page
 * - Pass fetched data as props to the ProfileView client component
 *
 * For now, this provides mock data for demonstration.
 */

import { ProgrammingLanguage } from '@/types/programming';
import { MOCK_USER } from '@/lib/mockData';

export interface UserProfile {
  username: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  profileImage: string | null;
  pronouns: string[];
  socialLinks: any[];
  preferredLanguages: ProgrammingLanguage[];
}

/**
 * Mock data for a user profile.
 * All values are derived from the centralised MOCK_USER to maintain consistency.
 */
export const getMockUserProfile = (username: string): UserProfile => {
  return {
    username: username || MOCK_USER.username,
    displayName: MOCK_USER.displayName,
    headline: MOCK_USER.headline,
    bio: MOCK_USER.bio,
    profileImage: MOCK_USER.profileImage,
    pronouns: MOCK_USER.pronouns,
    preferredLanguages: MOCK_USER.preferredLanguages,
    socialLinks: MOCK_USER.socialLinks,
  };
};

/**
 * Server-side function to fetch user profile data by username.
 *
 * TODO: Implement this function to fetch from backend API (GET /api/user/:username/profile).
 * Should be called in a Server Component only.
 *
 * Example implementation:
 *   export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
 *     const response = await fetch(`${process.env.API_BASE_URL}/api/user/${username}/profile`);
 *     if (!response.ok) {
 *       if (response.status === 404) return null;
 *       throw new Error('Failed to fetch profile');
 *     }
 *     return response.json();
 *   }
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  // TODO: Replace with actual API call from Server Component
  return getMockUserProfile(username);
}
