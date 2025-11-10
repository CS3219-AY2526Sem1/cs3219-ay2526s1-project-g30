import { requireAuth } from '@/lib/dal';
import { cancelMatchRequest, MatchingServiceError } from '@/lib/matchingServiceClient';
import {
  logServerActionStart,
  logServerActionSuccess,
  logServerActionError,
  logOutgoingRequest,
  logServiceError,
} from '@/lib/logger';

/**
 * POST /api/matching/cancel
 *
 * Cancels an active matching request for the authenticated user.
 *
 * Security:
 * - Only accepts POST requests
 * - Requires authentication (verifies session)
 * - Only processes requests from authenticated users
 * - Logs all attempts for security audit
 * - Returns generic error messages to avoid information leakage
 *
 * Response:
 * - 200: Cancellation successful (whether or not a matching request was found)
 * - 400: Invalid request
 * - 401: Unauthorized (not authenticated)
 * - 405: Method not allowed
 * - 500: Server error
 */
export async function POST(request: Request) {
  logServerActionStart('cancelMatchingAPI');

  try {
    // Verify the request method (defensive check - Next.js should already enforce this)
    if (request.method !== 'POST') {
      logServerActionError('cancelMatchingAPI', `Invalid HTTP method: ${request.method}`);
      return Response.json(
        { success: false, error: 'Method not allowed' },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    // Verify user is authenticated
    let session;
    try {
      session = await requireAuth();
    } catch (error) {
      logServerActionError('cancelMatchingAPI', 'Authentication failed');
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logOutgoingRequest('auth', '', 'GET', {
      userId: session.userId,
      action: 'fetch session',
      timestamp: new Date().toISOString(),
    });

    // Call matching service to cancel the request
    const cancelResult = await cancelMatchRequest(session.userId);

    logServerActionSuccess('cancelMatchingAPI', {
      userId: session.userId,
      status: cancelResult.status,
    });

    return Response.json(
      {
        success: true,
        status: cancelResult.status,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof MatchingServiceError) {
      if (error.statusCode === 404) {
        // User not found in matching pool - this is acceptable and not an error
        // Just means the user wasn't in an active matching request
        logServerActionSuccess('cancelMatchingAPI', {
          message: 'No active matching request found',
        });
        return Response.json(
          {
            success: true,
            message: 'No active matching request found',
          },
          { status: 200 }
        );
      }

      logServiceError('matchingService', '/cancel', error, {
        statusCode: error.statusCode,
      });

      // Don't leak internal error details to client
      const statusCode = error.statusCode >= 500 ? 500 : error.statusCode;
      return Response.json(
        {
          success: false,
          error: 'Failed to cancel matching request',
        },
        { status: statusCode }
      );
    }

    if (error instanceof Error) {
      logServiceError('matchingService', '/cancel', error);

      // Don't leak detailed error messages to the client
      return Response.json(
        {
          success: false,
          error: 'An error occurred while processing your request',
        },
        { status: 500 }
      );
    }

    logServerActionError('cancelMatchingAPI', `Unknown error: ${String(error)}`);
    return Response.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Deny all other HTTP methods (GET, PUT, DELETE, PATCH, HEAD, OPTIONS)
 * This provides an extra layer of security by explicitly rejecting unsupported methods
 */
export async function GET() {
  return Response.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function PUT() {
  return Response.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function DELETE() {
  return Response.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function PATCH() {
  return Response.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
