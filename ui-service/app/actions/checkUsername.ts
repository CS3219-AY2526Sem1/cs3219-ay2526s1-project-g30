'use server';

import { checkUsername } from '@/lib/userServiceClient';
import {
  logServerActionStart,
  logServerActionSuccess,
  logServerActionError,
  logOutgoingRequest,
  logIncomingResponse,
  logServiceError,
} from '@/lib/logger';

/**
 * Server Action to check if a username is available.
 * Calls the user service via userServiceClient.
 *
 * @param username The username to check
 * @returns Object with isAvailable flag and optional error message
 */
export async function checkUsernameAvailability(username: string): Promise<{
  isAvailable: boolean;
  errorMessage?: string;
}> {
  logServerActionStart('checkUsernameAvailability', { username });

  try {
    logOutgoingRequest('userService', `/check-username/${username}`, 'GET', {
      username,
      timestamp: new Date().toISOString(),
    });

    const result = await checkUsername(username);

    logIncomingResponse('userService', `/check-username/${username}`, 200, {
      isAvailable: result.isAvailable,
      timestamp: new Date().toISOString(),
    });

    logServerActionSuccess('checkUsernameAvailability', {
      username,
      isAvailable: result.isAvailable,
    });

    return {
      isAvailable: result.isAvailable,
      errorMessage: result.isAvailable ? undefined : (result.message || 'Username is already taken'),
    };
  } catch (error) {
    logServiceError('userService', `/check-username/${username}`, error, {
      username,
    });
    logServerActionError('checkUsernameAvailability', error, { username });

    return {
      isAvailable: false,
      errorMessage: 'Failed to check username availability',
    };
  }
}
