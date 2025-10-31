/**
 * Matching Server Actions
 *
 * These are secure server-only functions that handle matching operations.
 * They validate input, communicate with the matching service, and manage redirects.
 *
 * Server Actions are invoked from client components and always run on the server,
 * providing a secure environment for handling matching logic.
 *
 * Usage from client components:
 * ```tsx
 * 'use client';
 * import { startMatching } from '@/app/actions/matching';
 *
 * async function MatchButton() {
 *   async function handleMatch(formData: FormData) {
 *     const result = await startMatching(undefined, formData);
 *     if (!result.success) {
 *       console.error(result.error);
 *     }
 *   }
 *   return <form action={handleMatch}>...</form>;
 * }
 * ```
 */

'use server';

import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/dal';
import { config } from '@/lib/config';
import { requestMatch, MatchingServiceError } from '@/lib/matchingServiceClient';
import type { FormState } from '@/types/auth';

export interface MatchingFormState extends FormState {
  success?: boolean;
  error?: string;
  matchData?: {
    sessionId: string;
    questionId: string;
    programmingLang: string;
  };
}

export interface SessionUser {
  userId: string;
  username: string;
}

/**
 * Gets the current authenticated user's session information.
 * This is needed by client components to access user ID and username.
 *
 * @returns The current user's ID and username, or null if not authenticated
 */
export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await requireAuth();
    return {
      userId: session.userId,
      username: session.username,
    };
  } catch {
    return null;
  }
}

// Helper to check if an error is a Next.js redirect error
function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === 'NEXT_REDIRECT' || 
     (error as any).digest?.startsWith('NEXT_REDIRECT'))
  );
}

/**
 * Initiates a matching request for the current user.
 *
 * This Server Action:
 * 1. Verifies the user is authenticated
 * 2. Extracts the difficulty and language preferences from form data
 * 3. Calls the matching service to find an interview partner
 * 4. On success: redirects to the match interface with question ID
 * 5. On failure: returns an error message
 *
 * @param previousState The previous form state (unused but required by useActionState)
 * @param formData Form data containing 'difficulty' and 'languages' (comma-separated)
 * @returns Object with success status and optional error message
 */
export async function startMatching(
  previousState: MatchingFormState | undefined,
  formData: FormData
): Promise<MatchingFormState> {
  try {
    // Verify user is authenticated
    const session = await requireAuth();

    // Extract form data
    const difficulty = formData.get('difficulty');
    const languagesStr = formData.get('languages');
    const topic = formData.get('topic');

    // Validate required fields
    if (!difficulty || typeof difficulty !== 'string') {
      return {
        success: false,
        error: 'Difficulty level is required',
      };
    }

    if (!topic || typeof topic !== 'string') {
      return {
        success: false,
        error: 'Topic is required',
      };
    }

    if (!languagesStr || typeof languagesStr !== 'string') {
      return {
        success: false,
        error: 'At least one programming language must be selected',
      };
    }

    const languages = languagesStr.split(',').filter((lang) => lang.trim().length > 0);

    if (languages.length === 0) {
      return {
        success: false,
        error: 'At least one programming language must be selected',
      };
    }

    // WORKAROUND: Normalize difficulty and topic to lowercase to work around matching service bug
    // The matching service has a bug where timeout cleanup uses raw concatenation (Difficulty + "-" + Topic)
    // instead of the normalized createMatchKey function (which lowercases both).
    // By sending lowercase values, both the normalized key and raw concatenation will match.
    const normalizedDifficulty = difficulty.toLowerCase();
    const normalizedTopic = topic.toLowerCase().trim().replace(/\s+/g, '-');

    // Log the matching request for debugging
    console.log('[Matching Action] Starting match with request:', {
      userId: session.userId,
      username: session.username,
      difficulty: normalizedDifficulty,
      topic: normalizedTopic,
      preferredProgrammingLang: languages,
      expectedMatchKey: `${normalizedDifficulty}-${normalizedTopic}`,
      timestamp: new Date().toISOString(),
    });

    // Request match from matching service
    const matchResult = await requestMatch({
      userId: session.userId,
      difficulty: normalizedDifficulty,
      topic: normalizedTopic,
      preferredProgrammingLang: languages,
    });

    // Return success with match data so the client can show feedback
    // The client will handle the redirect after showing success toast
    return {
      success: true,
      matchData: {
        sessionId: matchResult.sessionId,
        questionId: matchResult.questionId,
        programmingLang: matchResult.programmingLang,
      },
    };
  } catch (error) {
    // Re-throw redirect errors to allow Next.js to handle the redirect
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof MatchingServiceError) {
      // Handle specific matching service errors
      if (error.statusCode === 408) {
        return {
          success: false,
          error: 'No matching interview partner found. Please try again.',
        };
      }
      return {
        success: false,
        error: `Matching service error: ${error.message}`,
      };
    }

    if (error instanceof Error) {
      // Handle other errors (e.g., auth errors)
      if (error.message.includes('Unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to start matching',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred while trying to find a match',
    };
  }
}

/**
 * Terminates a collaborative session by calling the collab service.
 * This is a server action to avoid CORS issues when calling the collab service API.
 * Server-to-server communication doesn't require CORS headers.
 *
 * @param sessionId The ID of the session to terminate
 * @param userId The ID of the user terminating the session
 * @returns Result with success status and optional error message
 */
export async function terminateCollaborativeSession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user is authenticated
    await requireAuth();

    const { collaborationService } = config;
    const url = `${collaborationService.baseUrl}/api/terminate`;

    console.log('[Matching] Terminating session server-side:', {
      sessionId,
      userId,
      url,
      timestamp: new Date().toISOString(),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: userId,
        sessionId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[Matching] Session termination response:', {
      status: response.status,
      statusText: response.statusText,
      sessionId,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Matching] Failed to terminate session:', {
        status: response.status,
        error: errorText,
        sessionId,
      });

      return {
        success: false,
        error: `Failed to terminate session: ${response.status} ${response.statusText}`,
      };
    }

    console.log('[Matching] Session terminated successfully:', {
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Matching] Session termination timed out:', {
        sessionId: userId,
      });

      return {
        success: false,
        error: 'Session termination request timed out',
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Matching] Error terminating session:', {
      error: errorMessage,
      sessionId: userId,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
