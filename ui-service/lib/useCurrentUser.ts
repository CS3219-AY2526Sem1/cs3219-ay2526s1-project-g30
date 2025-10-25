/**
 * Server Component utilities for fetching current user data.
 * 
 * TODO: Implement the getCurrentUser function to fetch user data from the backend API.
 * 
 * Implementation guide:
 * - Call your backend API endpoint: GET /api/user/current
 * - Expected response shape:
 *   {
 *     id: string;
 *     username: string;
 *     displayName: string;
 *     profileImage: string | null;
 *   }
 * - Handle authentication errors (401) by redirecting to /login
 * - Use this function in Server Components only
 * 
 * Example implementation:
 *   export async function getCurrentUser(): Promise<CurrentUser | null> {
 *     const response = await fetch(`${API_BASE_URL}/api/user/current`, {
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

import { MOCK_USER } from './mockData';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
}

/**
 * Fetch the current authenticated user.
 * 
 * TODO: Implement this function to fetch from backend API (GET /api/user/current).
 * This should be called in Server Components only.
 * 
 * Currently returns mock data for development.
 * 
 * @returns Current user object or null if not authenticated
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${process.env.API_BASE_URL}/api/user/current`, { ... });
  return {
    id: MOCK_USER.id,
    username: MOCK_USER.username,
    displayName: MOCK_USER.displayName,
    profileImage: MOCK_USER.profileImage,
  };
}
