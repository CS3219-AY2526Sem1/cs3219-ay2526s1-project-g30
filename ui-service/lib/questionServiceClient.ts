/**
 * Type-safe client for the Question Service API.
 *
 * This module provides methods to communicate with the question service,
 * which handles fetching interview questions by ID or by criteria.
 */

import { config } from './config';

export class QuestionServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'QuestionServiceError';
  }
}

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Question {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  examples: QuestionExample[];
  function_name?: string;
  function_params?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches a specific question by its ID from the question service.
 *
 * @param questionId The ID of the question to fetch
 * @returns The question data
 * @throws QuestionServiceError if the request fails or question is not found
 */
export async function fetchQuestion(questionId: string): Promise<Question> {
  const url = `${config.questionService.baseUrl}/${questionId}`;

  console.log('[Question Service] Fetching question:', {
    questionId,
    url,
    timestamp: new Date().toISOString(),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.questionService.timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[Question Service] Response received:', {
      status: response.status,
      statusText: response.statusText,
      questionId,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('[Question Service] Question not found:', questionId);
        throw new QuestionServiceError(404, `Question not found: ${questionId}`);
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('[Question Service] Error response:', {
        status: response.status,
        errorData,
        questionId,
      });
      throw new QuestionServiceError(
        response.status,
        errorData.message || 'Question service error'
      );
    }

    const data: Question = await response.json();
    console.log('[Question Service] Question fetched successfully:', {
      questionId: data._id,
      title: data.title,
      difficulty: data.difficulty,
    });
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof QuestionServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Question Service] Request timeout:', questionId);
      throw new QuestionServiceError(408, 'Question service request timeout');
    }

    if (error instanceof TypeError) {
      console.error('[Question Service] Network error:', {
        message: error.message,
        questionId,
      });
      throw new QuestionServiceError(0, `Network error: ${error.message}`);
    }

    console.error('[Question Service] Unknown error:', {
      error,
      questionId,
    });
    throw new QuestionServiceError(500, 'Unknown error while fetching question');
  }
}

/**
 * Fetches a random question by difficulty and category (optional).
 *
 * @param difficulty The difficulty level (easy, medium, hard)
 * @param category Optional category to filter by
 * @returns The question ID
 * @throws QuestionServiceError if the request fails or no questions are found
 */
export async function fetchRandomQuestion(
  difficulty: string,
  category?: string
): Promise<{ id: string }> {
  const params = new URLSearchParams({ difficulty });
  if (category) {
    params.append('category', category);
  }

  const url = `${config.questionService.baseUrl}/randomQuestion?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.questionService.timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new QuestionServiceError(404, 'No questions found matching criteria');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new QuestionServiceError(
        response.status,
        errorData.message || 'Question service error'
      );
    }

    const data: { id: string } = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof QuestionServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new QuestionServiceError(408, 'Question service request timeout');
    }

    if (error instanceof TypeError) {
      throw new QuestionServiceError(0, `Network error: ${error.message}`);
    }

    throw new QuestionServiceError(500, 'Unknown error while fetching random question');
  }
}
