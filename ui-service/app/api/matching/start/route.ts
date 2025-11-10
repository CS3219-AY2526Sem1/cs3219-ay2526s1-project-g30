/**
 * Matching Start API Route
 *
 * This Route Handler initiates a matching request for the authenticated user.
 * It replaces the startMatching Server Action to avoid queueing issues when
 * multiple operations occur on the same route.
 *
 * Security:
 * - Requires authentication (JWT cookie verification)
 * - Enforces HTTP method (POST only, 405 for others)
 * - Verifies same-origin requests only
 * - Generic error messages prevent information leakage
 * - Comprehensive logging for audit trail
 *
 * Usage from client:
 * ```typescript
 * const formData = new FormData();
 * formData.append('difficulty', 'Medium');
 * formData.append('topic', 'Trees');
 * formData.append('languages', 'TypeScript,Python');
 *
 * const response = await fetch('/api/matching/start', {
 *   method: 'POST',
 *   body: formData,
 * });
 * const result = await response.json();
 * // result: { success: boolean, matchData?: {...}, error?: string, status?: string }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { requestMatch, MatchingServiceError } from '@/lib/matchingServiceClient';
import {
  logOutgoingRequest,
  logIncomingResponse,
  logServiceError,
  logValidationError,
  logTiming,
} from '@/lib/logger';

interface MatchStartResponse {
  success: boolean;
  matchData?: {
    sessionId: string;
    questionId: string;
    programmingLang: string;
  };
  error?: string;
  status?: string;
}

/**
 * Verifies that the request is from the same origin (not a cross-origin request).
 * This provides a layer of protection against external services triggering matches.
 *
 * @param request The incoming request
 * @returns true if request is same-origin or from localhost, false otherwise
 */
function verifySameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const requestUrl = new URL(request.url);

  // Allow requests with no origin (same-origin requests don't include origin header)
  if (!origin) {
    return true;
  }

  // Only allow requests from the same origin
  const requestOrigin = new URL(origin).origin;
  const expectedOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

  return requestOrigin === expectedOrigin;
}

/**
 * POST handler - Initiates a match request
 */
export async function POST(request: NextRequest): Promise<NextResponse<MatchStartResponse>> {
  const startTime = Date.now();

  try {
    // Security: Verify same-origin request
    if (!verifySameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 403 }
      );
    }

    // Security: Verify user is authenticated
    let session;
    try {
      session = await requireAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      logValidationError('POST /api/matching/start', { body: ['Invalid form data'] });
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Extract and validate form data
    const difficulty = formData.get('difficulty');
    const languagesStr = formData.get('languages');
    const topic = formData.get('topic');

    if (!difficulty || typeof difficulty !== 'string') {
      logValidationError('POST /api/matching/start', {
        difficulty: ['Difficulty level is required'],
      });
      return NextResponse.json(
        { success: false, error: 'Difficulty level is required' },
        { status: 400 }
      );
    }

    if (!topic || typeof topic !== 'string') {
      logValidationError('POST /api/matching/start', {
        topic: ['Topic is required'],
      });
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!languagesStr || typeof languagesStr !== 'string') {
      logValidationError('POST /api/matching/start', {
        languages: ['At least one programming language must be selected'],
      });
      return NextResponse.json(
        { success: false, error: 'At least one programming language must be selected' },
        { status: 400 }
      );
    }

    const languages = languagesStr.split(',').filter((lang) => lang.trim().length > 0);

    if (languages.length === 0) {
      logValidationError('POST /api/matching/start', {
        languages: ['At least one programming language must be selected'],
      });
      return NextResponse.json(
        { success: false, error: 'At least one programming language must be selected' },
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        success: true,
        matchData: {
          sessionId: matchResult.sessionId,
          questionId: matchResult.questionId,
          programmingLang: matchResult.programmingLang,
        },
        status: 'match_found',
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle matching service errors
    if (error instanceof MatchingServiceError) {
      if (error.statusCode === 408) {
        // 408 = timeout, no match found within timeframe
        logServiceError('matchingService', '/match', 408, {
          message: 'No match found within timeout period',
          error: error.message,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'No match found. Please try again.',
            status: 'timeout',
          },
          { status: 200 } // Return 200 because this is expected behaviour
        );
      }

      if (error.statusCode === 404) {
        // 404 = user not found in pool
        logServiceError('matchingService', '/match', 404, {
          message: 'User not found in pool',
          error: error.message,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Match request not found. Please try again.',
            status: 'not_found',
          },
          { status: 200 } // Return 200 because this is expected behaviour
        );
      }

      // Generic error for other service failures
      logServiceError('matchingService', '/match', error.statusCode || 500, {
        message: 'Matching service error',
        error: error.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to find a match at this time. Please try again.',
          status: 'service_error',
        },
        { status: 200 } // Return 200 to avoid cascading errors
      );
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logServiceError('matchingService', '/match', 500, {
      message: 'Unexpected error',
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        status: 'error',
      },
      { status: 200 } // Return 200 to avoid cascading errors
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
async function handleMethodNotAllowed(): Promise<NextResponse<MatchStartResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    }
  );
}

export async function GET(): Promise<NextResponse<MatchStartResponse>> {
  return handleMethodNotAllowed();
}

export async function PUT(): Promise<NextResponse<MatchStartResponse>> {
  return handleMethodNotAllowed();
}

export async function DELETE(): Promise<NextResponse<MatchStartResponse>> {
  return handleMethodNotAllowed();
}

export async function PATCH(): Promise<NextResponse<MatchStartResponse>> {
  return handleMethodNotAllowed();
}
