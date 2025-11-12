/**
 * Data Access Layer (DAL) for authentication.
 *
 * Centralizes all authorization logic and session verification.
 * This is the primary place where authorization decisions are made.
 *
 * The DAL should be called from:
 * - Server Actions (for mutations)
 * - API Routes (for external access)
 * - Server Components (for data fetching)
 * - Middleware/Proxy (for route protection)
 */

import 'server-only';

import { getSession, updateSession } from './session';
import type { SessionPayload } from './session';
import type { SessionUser } from '@/types/auth';

/**
 * Verifies that a user is authenticated and has a valid session.
 *
 * This function should be called at the beginning of any protected operation.
 * It ensures the session is valid and updates the expiration time.
 *
 * @returns The session payload if valid, or null if not authenticated
 * @throws Never throws; returns null on error for graceful handling
 */
export async function verifyAuth(): Promise<SessionPayload | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Update session expiration to keep user logged in
  const updatedSession = await updateSession();

  return updatedSession;
}

/**
 * Gets the currently authenticated user's ID.
 *
 * @returns The user ID if authenticated, or null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await verifyAuth();
  return session?.userId ?? null;
}

/**
 * Gets the currently authenticated user's session information.
 *
 * @returns The full session payload if authenticated, or null otherwise
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  return verifyAuth();
}

/**
 * Checks if the current request is from an authenticated user.
 *
 * This is a simple boolean check useful for conditional rendering or logic.
 *
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Enforces authentication for a protected operation.
 *
 * If the user is not authenticated, this throws an error.
 * Use this in Server Actions that require authentication.
 *
 * @returns The verified session payload
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await verifyAuth();

  if (!session) {
    throw new Error('Unauthorized: User must be authenticated');
  }

  return session;
}

/**
 * Checks if the current user is authorized to access a specific resource.
 *
 * @param resourceOwnerId The user ID that owns the resource
 * @returns True if current user owns the resource, false otherwise
 */
export async function canAccessResource(resourceOwnerId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId();
  return currentUserId === resourceOwnerId;
}

/**
 * Enforces that the current user can access a specific resource.
 *
 * @param resourceOwnerId The user ID that owns the resource
 * @throws Error if user is not authorized
 */
export async function requireResourceAccess(
  resourceOwnerId: string
): Promise<void> {
  const canAccess = await canAccessResource(resourceOwnerId);

  if (!canAccess) {
    throw new Error('Forbidden: User does not have access to this resource');
  }
}

/**
 * Gets user information from the session.
 *
 * This returns only information available in the session (userId, email, username).
 * For full user profile data, use the user service client.
 *
 * @returns User information if authenticated, or null otherwise
 */
export async function getSessionUserInfo(): Promise<SessionUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    username: session.username,
  };
}

/**
 * Retrieves the JWT token stored in the user's session.
 *
 * This token was issued by the user-service during login and should be used
 * for subsequent API calls to authenticate with the user-service.
 *
 * @returns The JWT token if available in session, or null if not authenticated
 */
export async function getSessionJWTToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token ?? null;
}
