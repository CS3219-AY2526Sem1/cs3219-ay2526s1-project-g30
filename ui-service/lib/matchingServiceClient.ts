/**
 * Type-safe client for the Matching Service API.
 *
 * This module provides methods to communicate with the matching service,
 * which handles finding interview partners based on difficulty, topic, and languages.
 */

import { config } from './config';

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Matching Service] Error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new MatchingServiceError(response.status, errorData.message || 'Matching service error');
    }

    const data: MatchResponse = await response.json();
    console.log('[Matching Service] Raw response:', data);

    if (data.status === 'timeout') {
      console.warn('[Matching Service] Timeout - no match found within time limit');
      throw new MatchingServiceError(408, data.message || 'No match found within the time limit');
    }

    if (!data.data) {
      console.error('[Matching Service] Invalid response - missing data field:', data);
      throw new MatchingServiceError(500, 'Invalid response from matching service');
    }

    console.log('[Matching Service] Match successful:', {
      sessionId: data.data.sessionId,
      questionId: data.data.questionId,
      programmingLang: data.data.programmingLang,
      user1Id: data.data.user1Id,
      user2Id: data.data.user2Id,
    });

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MatchingServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new MatchingServiceError(408, 'Matching service request timeout');
    }

    if (error instanceof TypeError) {
      throw new MatchingServiceError(0, `Network error: ${error.message}`);
    }

    throw new MatchingServiceError(500, 'Unknown error while requesting match');
  }
}
