// AI Assistance Disclosure:
// Tool: GitHub Copilot (Claude 4.5 Haiku), date: 2025‑11-1
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

/**
 * Type-safe client for the Matching Service API.
 *
 * This module provides methods to communicate with the matching service,
 * which handles finding interview partners based on difficulty, topic, and languages.
 */

import { config } from './config';
import { logOutgoingRequest, logIncomingResponse, logServiceError, logTiming } from './logger';

export class MatchingServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'MatchingServiceError';
  }
}

export interface MatchRequest {
  userId: string;
  difficulty: string;
  topic?: string;
  preferredProgrammingLang: string[];
}

export interface MatchResult {
  sessionId: string;
  questionId: string;
  user1Id: string;
  user2Id: string;
  programmingLang: string;
}

export interface MatchResponse {
  status: 'success' | 'timeout';
  message: string;
  data?: MatchResult;
}

export interface CancelRequest {
  userId: string;
}

export interface CancelResponse {
  status: 'cancelled' | 'not_found';
  message: string;
}

/**
 * Initiates a matching request with the matching service.
 *
 * The matching service will search for a compatible user within a timeout period.
 * If a match is found, it returns session and question information.
 * If no match is found within the timeout, it returns a timeout status.
 *
 * @param request The match request containing user ID, difficulty, topic, and preferred languages
 * @returns The match result containing session ID, question ID, and both user IDs
 * @throws MatchingServiceError if the request fails or times out
 */
export async function requestMatch(request: MatchRequest): Promise<MatchResult> {
  const url = `${config.matchingService.baseUrl}/match`;
  const startTime = Date.now();

  logOutgoingRequest('matchingService', '/match', 'POST', {
    userId: request.userId,
    difficulty: request.difficulty,
    topic: request.topic,
    languageCount: request.preferredProgrammingLang.length,
    timestamp: new Date().toISOString(),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.matchingService.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMilliseconds = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logServiceError('matchingService', '/match', new Error(errorData.message || 'Matching service error'), {
        statusCode: response.status,
        userId: request.userId,
      });
      logIncomingResponse('matchingService', '/match', response.status, {
        durationMilliseconds,
        userId: request.userId,
        timestamp: new Date().toISOString(),
      });
      throw new MatchingServiceError(response.status, errorData.message || 'Matching service error');
    }

    const data: MatchResponse = await response.json();

    logIncomingResponse('matchingService', '/match', response.status, {
      sessionId: data.data?.sessionId,
      questionId: data.data?.questionId,
      status: data.status,
      durationMilliseconds,
      userId: request.userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('matchingService /match', durationMilliseconds, {
      userId: request.userId,
      difficulty: request.difficulty,
    });

    if (data.status === 'timeout') {
      logServiceError('matchingService', '/match', new Error('No match found within time limit'), {
        statusCode: 408,
        userId: request.userId,
      });
      throw new MatchingServiceError(408, data.message || 'No match found within the time limit');
    }

    if (!data.data) {
      logServiceError('matchingService', '/match', new Error('Invalid response - missing data field'), {
        statusCode: 500,
        userId: request.userId,
      });
      throw new MatchingServiceError(500, 'Invalid response from matching service');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MatchingServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      logServiceError('matchingService', '/match', error, {
        statusCode: 408,
        userId: request.userId,
        errorType: 'timeout',
      });
      throw new MatchingServiceError(408, 'Matching service request timeout');
    }

    if (error instanceof TypeError) {
      logServiceError('matchingService', '/match', error, {
        statusCode: 0,
        userId: request.userId,
        errorType: 'network',
      });
      throw new MatchingServiceError(0, `Network error: ${error.message}`);
    }

    logServiceError('matchingService', '/match', error, {
      statusCode: 500,
      userId: request.userId,
      errorType: 'unknown',
    });
    throw new MatchingServiceError(500, 'Unknown error while requesting match');
  }
}

/**
 * Cancels an active matching request with the matching service.
 *
 * If the user has an active match request in the pool, this will remove them
 * and return a success status. If the user is not in the pool (already matched,
 * timed out, or never existed), it returns a not_found status.
 *
 * @param userId The ID of the user cancelling their match request
 * @returns The cancellation result
 * @throws MatchingServiceError if the request fails
 */
export async function cancelMatchRequest(userId: string): Promise<CancelResponse> {
  const url = `${config.matchingService.baseUrl}/cancel`;
  const startTime = Date.now();

  logOutgoingRequest('matchingService', '/cancel', 'POST', {
    userId,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const durationMilliseconds = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logServiceError('matchingService', '/cancel', new Error(errorData.error || 'Matching service error'), {
        statusCode: response.status,
        userId,
      });
      logIncomingResponse('matchingService', '/cancel', response.status, {
        durationMilliseconds,
        userId,
        timestamp: new Date().toISOString(),
      });
      throw new MatchingServiceError(response.status, errorData.error || 'Failed to cancel match request');
    }

    const data: CancelResponse = await response.json();

    logIncomingResponse('matchingService', '/cancel', response.status, {
      status: data.status,
      durationMilliseconds,
      userId,
      timestamp: new Date().toISOString(),
    });

    logTiming('matchingService /cancel', durationMilliseconds, {
      userId,
    });

    return data;
  } catch (error) {
    if (error instanceof MatchingServiceError) {
      throw error;
    }

    if (error instanceof TypeError) {
      logServiceError('matchingService', '/cancel', error, {
        statusCode: 0,
        userId,
        errorType: 'network',
      });
      throw new MatchingServiceError(0, `Network error: ${error.message}`);
    }

    logServiceError('matchingService', '/cancel', error, {
      statusCode: 500,
      userId,
      errorType: 'unknown',
    });
    throw new MatchingServiceError(500, 'Unknown error while cancelling match request');
  }
}
