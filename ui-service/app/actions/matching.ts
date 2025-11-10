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

import { requireAuth } from '@/lib/dal';
import { config } from '@/lib/config';
import { requestMatch, MatchingServiceError } from '@/lib/matchingServiceClient';
import type { FormState } from '@/types/auth';
import type { Question } from '@/lib/questionServiceClient';
import {
  logServerActionStart,
  logServerActionSuccess,
  logServerActionError,
  logOutgoingRequest,
  logIncomingResponse,
  logServiceError,
  logValidationError,
  logTiming,
} from '@/lib/logger';

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
  logServerActionStart('startMatching');
  const startTime = Date.now();

  try {
    // Verify user is authenticated
    const session = await requireAuth();

    logOutgoingRequest('auth', '', 'GET', {
      userId: session.userId,
      action: 'fetch session',
      timestamp: new Date().toISOString(),
    });

    // Extract form data
    const difficulty = formData.get('difficulty');
    const languagesStr = formData.get('languages');
    const topic = formData.get('topic');

    // Validate required fields
    if (!difficulty || typeof difficulty !== 'string') {
      logValidationError('startMatching', { difficulty: ['Difficulty level is required'] });
      return {
        success: false,
        error: 'Difficulty level is required',
      };
    }

    if (!topic || typeof topic !== 'string') {
      logValidationError('startMatching', { topic: ['Topic is required'] });
      return {
        success: false,
        error: 'Topic is required',
      };
    }

    if (!languagesStr || typeof languagesStr !== 'string') {
      logValidationError('startMatching', { languages: ['At least one programming language must be selected'] });
      return {
        success: false,
        error: 'At least one programming language must be selected',
      };
    }

    const languages = languagesStr.split(',').filter((lang) => lang.trim().length > 0);

    if (languages.length === 0) {
      logValidationError('startMatching', { languages: ['At least one programming language must be selected'] });
      return {
        success: false,
        error: 'At least one programming language must be selected',
      };
    }

    // WORKAROUND: Normalize difficulty and topic to lowercase to work around matching service bug
    // The matching service has a bug where timeout cleanup uses raw concatenation (Difficulty + "-" + Topic)
    // instead of the normalised createMatchKey function (which lowercases both).
    // By sending lowercase values, both the normalised key and raw concatenation will match.
    const normalizedDifficulty = difficulty.toLowerCase();
    const normalizedTopic = topic.toLowerCase().trim().replace(/\s+/g, '-');

    // Log the matching request for debugging
    logOutgoingRequest('matchingService', '/match', 'POST', {
      userId: session.userId,
      username: session.username,
      difficulty: normalizedDifficulty,
      topic: normalizedTopic,
      preferredProgrammingLanguages: languages,
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

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('matchingService', '/match', 200, {
      sessionId: matchResult.sessionId,
      questionId: matchResult.questionId,
      programmingLanguage: matchResult.programmingLang,
      userId: session.userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('matching request', durationMilliseconds, {
      userId: session.userId,
      difficulty: normalizedDifficulty,
    });

    logServerActionSuccess('startMatching', {
      userId: session.userId,
      sessionId: matchResult.sessionId,
      questionId: matchResult.questionId,
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
      logServiceError('matchingService', '/match', error, {
        statusCode: error.statusCode,
      });

      if (error.statusCode === 408) {
        logServerActionError('startMatching', 'Match request timed out');
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
        logServerActionError('startMatching', 'User not authenticated');
        return {
          success: false,
          error: 'You must be logged in to start matching',
        };
      }
      logServiceError('matchingService', '/match', error);
      return {
        success: false,
        error: error.message,
      };
    }

    logServerActionError('startMatching', error);
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
  logServerActionStart('terminateCollaborativeSession', {
    sessionId,
    userId,
  });
  const startTime = Date.now();

  try {
    // Verify user is authenticated
    await requireAuth();

    logOutgoingRequest('auth', '', 'GET', {
      userId,
      action: 'fetch session',
      timestamp: new Date().toISOString(),
    });

    const { collaborationService } = config;
    const url = `${collaborationService.baseUrl}/api/terminate`;

    logOutgoingRequest('matchingService', '/api/terminate', 'POST', {
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

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('matchingService', '/api/terminate', response.status, {
      sessionId,
      userId,
      statusText: response.statusText,
      timestamp: new Date().toISOString(),
    });

    logTiming('session termination request', durationMilliseconds, {
      sessionId,
      userId,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logServiceError('matchingService', '/api/terminate', new Error(errorText), {
        statusCode: response.status,
        sessionId,
        userId,
        errorText,
      });

      return {
        success: false,
        error: `Failed to terminate session: ${response.status} ${response.statusText}`,
      };
    }

    logServerActionSuccess('terminateCollaborativeSession', {
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logServerActionError('terminateCollaborativeSession', 'Request timed out', {
        sessionId,
        userId,
      });

      return {
        success: false,
        error: 'Session termination request timed out',
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logServiceError('matchingService', '/api/terminate', error, {
      sessionId,
      userId,
    });

    logServerActionError('terminateCollaborativeSession', error, {
      sessionId,
      userId,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cancels an active matching request for the current user.
 *
 * This Server Action:
 * 1. Verifies the user is authenticated
 * 2. Calls the matching service to cancel their active match request
 * 3. Returns success or error status
 *
 * Can be called in two ways:
 * - From useActionState: await cancelMatching(previousState)
 * - From startTransition: startTransition(() => cancelMatching())
 *
 * @param previousState The previous form state (optional, unused but required by useActionState)
 * @returns Object with success status and optional error message
 */
export async function cancelMatching(
  previousState?: MatchingFormState | undefined
): Promise<MatchingFormState> {
  logServerActionStart('cancelMatching');
  const startTime = Date.now();

  try {
    // Verify user is authenticated
    const session = await requireAuth();

    logOutgoingRequest('auth', '', 'GET', {
      userId: session.userId,
      action: 'fetch session',
      timestamp: new Date().toISOString(),
    });

    // Import dynamically to avoid circular dependency issues
    const { cancelMatchRequest } = await import('@/lib/matchingServiceClient');

    logOutgoingRequest('matchingService', '/cancel', 'POST', {
      userId: session.userId,
      username: session.username,
      timestamp: new Date().toISOString(),
    });

    // Call matching service to cancel the request
    const cancelResult = await cancelMatchRequest(session.userId);

    const durationMilliseconds = Date.now() - startTime;

    logIncomingResponse('matchingService', '/cancel', 200, {
      status: cancelResult.status,
      userId: session.userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('matching cancellation request', durationMilliseconds, {
      userId: session.userId,
    });

    logServerActionSuccess('cancelMatching', {
      userId: session.userId,
      status: cancelResult.status,
    });

    return {
      success: true,
      error: undefined,
    };
  } catch (error) {
    // Re-throw redirect errors to allow Next.js to handle the redirect
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof MatchingServiceError) {
      logServiceError('matchingService', '/cancel', error, {
        statusCode: error.statusCode,
      });

      if (error.statusCode === 404) {
        // User not found in matching pool - this is acceptable
        logServerActionSuccess('cancelMatching', {
          message: 'No active matching request found',
        });
        return {
          success: true,
          error: undefined,
        };
      }

      return {
        success: false,
        error: `Matching service error: ${error.message}`,
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        logServerActionError('cancelMatching', 'User not authenticated');
        return {
          success: false,
          error: 'You must be logged in to cancel matching',
        };
      }
      logServiceError('matchingService', '/cancel', error);
      return {
        success: false,
        error: error.message,
      };
    }

    logServerActionError('cancelMatching', error);
    return {
      success: false,
      error: 'An unexpected error occurred while trying to cancel matching',
    };
  }
}

/**
 * Server Action to fetch a question by ID.
 * 
 * This wraps the question service client in a Server Action so that
 * the client component can safely fetch questions without directly importing
 * the server-only questionServiceClient module.
 */
export async function fetchQuestionAction(questionId: string): Promise<{ success: boolean; data?: Question; error?: string }> {
  try {
    const { fetchQuestion } = await import('@/lib/questionServiceClient');
    const question = await fetchQuestion(questionId);
    return {
      success: true,
      data: question,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question';
    logServiceError('questionService', `/api/questions/${questionId}`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server Action to fetch question statistics (available categories and difficulties).
 *
 * This wraps the question service client in a Server Action so that
 * the client component can safely fetch stats without directly importing
 * the server-only questionServiceClient module.
 */
export async function fetchQuestionStatsAction(): Promise<{
  success: boolean;
  stats?: {
    categories: string[];
    difficultyCounts: Record<string, Record<'easy' | 'medium' | 'hard', number>>;
  };
  error?: string;
}> {
  try {
    const { fetchQuestionStats } = await import('@/lib/questionServiceClient');
    const stats = await fetchQuestionStats();
    return {
      success: true,
      stats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question stats';
    logServiceError('questionService', '/stats', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
