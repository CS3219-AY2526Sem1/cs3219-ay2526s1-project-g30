/**
 * Type-safe client for the Question Service API.
 *
 * This module provides methods to communicate with the question service,
 * which handles fetching interview questions by ID or by criteria.
 */

import 'server-only';

import { config } from './config';
import { logOutgoingRequest, logIncomingResponse, logServiceError, logTiming } from './logger';
import { cacheLife, cacheTag } from 'next/cache';

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
  const url = `${config.questionService.baseUrl}/questions/${questionId}`;
  const startTime = Date.now();

  logOutgoingRequest('userService', `/${questionId}`, 'GET', {
    questionId,
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

    const durationMilliseconds = Date.now() - startTime;

    if (!response.ok) {
      logIncomingResponse('userService', `/${questionId}`, response.status, {
        durationMilliseconds,
        questionId,
        timestamp: new Date().toISOString(),
      });

      if (response.status === 404) {
        logServiceError('userService', `/${questionId}`, new Error(`Question not found: ${questionId}`), {
          statusCode: 404,
          questionId,
        });
        throw new QuestionServiceError(404, `Question not found: ${questionId}`);
      }

      const errorData = await response.json().catch(() => ({}));
      logServiceError('userService', `/${questionId}`, new Error(errorData.message || 'Question service error'), {
        statusCode: response.status,
        questionId,
      });
      throw new QuestionServiceError(
        response.status,
        errorData.message || 'Question service error'
      );
    }

    const data: Question = await response.json();

    logIncomingResponse('userService', `/${questionId}`, response.status, {
      durationMilliseconds,
      questionId: data._id,
      title: data.title,
      difficulty: data.difficulty,
      timestamp: new Date().toISOString(),
    });

    logTiming(`userService GET /${questionId}`, durationMilliseconds, {
      questionId,
    });

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof QuestionServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      logServiceError('userService', `/${questionId}`, error, {
        statusCode: 408,
        questionId,
        errorType: 'timeout',
      });
      throw new QuestionServiceError(408, 'Question service request timeout');
    }

    if (error instanceof TypeError) {
      logServiceError('userService', `/${questionId}`, error, {
        statusCode: 0,
        questionId,
        errorType: 'network',
      });
      throw new QuestionServiceError(0, `Network error: ${error.message}`);
    }

    logServiceError('userService', `/${questionId}`, error, {
      statusCode: 500,
      questionId,
      errorType: 'unknown',
    });
    throw new QuestionServiceError(500, 'Unknown error while fetching question');
  }
}

/**
 * Fetches a random question by difficulty and category (optional).
 */
export async function fetchRandomQuestion(
  difficulty: string,
  category?: string
): Promise<{ id: string }> {
  const params = new URLSearchParams({ difficulty });
  if (category) {
    params.append('category', category);
  }

  const endpoint = `/questions/randomQuestion?${params.toString()}`;
  const startTime = Date.now();

  logOutgoingRequest('userService', endpoint, 'GET', {
    difficulty,
    category,
    timestamp: new Date().toISOString(),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.questionService.timeout);

  try {
    const url = `${config.questionService.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMilliseconds = Date.now() - startTime;

    if (!response.ok) {
      logIncomingResponse('userService', endpoint, response.status, {
        durationMilliseconds,
        difficulty,
        category,
        timestamp: new Date().toISOString(),
      });

      if (response.status === 404) {
        logServiceError('userService', endpoint, new Error('No questions found matching criteria'), {
          statusCode: 404,
          difficulty,
          category,
        });
        throw new QuestionServiceError(404, 'No questions found matching criteria');
      }

      const errorData = await response.json().catch(() => ({}));
      logServiceError('userService', endpoint, new Error(errorData.message || 'Question service error'), {
        statusCode: response.status,
        difficulty,
        category,
      });
      throw new QuestionServiceError(
        response.status,
        errorData.message || 'Question service error'
      );
    }

    const data: { id: string } = await response.json();

    logIncomingResponse('userService', endpoint, response.status, {
      durationMilliseconds,
      difficulty,
      category,
      questionId: data.id,
      timestamp: new Date().toISOString(),
    });

    logTiming(`userService GET ${endpoint}`, durationMilliseconds, {
      difficulty,
    });

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof QuestionServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      logServiceError('userService', endpoint, error, {
        statusCode: 408,
        difficulty,
        category,
        errorType: 'timeout',
      });
      throw new QuestionServiceError(408, 'Question service request timeout');
    }

    if (error instanceof TypeError) {
      logServiceError('userService', endpoint, error, {
        statusCode: 0,
        difficulty,
        category,
        errorType: 'network',
      });
      throw new QuestionServiceError(0, `Network error: ${error.message}`);
    }

    logServiceError('userService', endpoint, error, {
      statusCode: 500,
      difficulty,
      category,
      errorType: 'unknown',
    });
    throw new QuestionServiceError(500, 'Unknown error while fetching random question');
  }
}

export interface QuestionStats {
  categories: string[];
  difficultyCounts: Record<string, Record<'easy' | 'medium' | 'hard', number>>;
}

export async function fetchQuestionStats(): Promise<QuestionStats> {
  const endpoint = '/stats';
  const startTime = Date.now();

  logOutgoingRequest('questionService', endpoint, 'GET', {
    timestamp: new Date().toISOString(),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.questionService.timeout);

  try {
    const url = `${config.questionService.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMilliseconds = Date.now() - startTime;

    if (!response.ok) {
      logIncomingResponse('questionService', endpoint, response.status, {
        durationMilliseconds,
        timestamp: new Date().toISOString(),
      });

      if (response.status === 404) {
        logServiceError('questionService', endpoint, new Error('Stats not found'), {
          statusCode: 404,
        });
        throw new QuestionServiceError(404, 'Question stats not found');
      }

      const errorData = await response.json().catch(() => ({}));
      logServiceError('questionService', endpoint, new Error(errorData.message || 'Question service error'), {
        statusCode: response.status,
      });
      throw new QuestionServiceError(
        response.status,
        errorData.message || 'Question service error'
      );
    }

    const data: QuestionStats = await response.json();

    logIncomingResponse('questionService', endpoint, response.status, {
      durationMilliseconds,
      categoriesCount: data.categories?.length || 0,
      timestamp: new Date().toISOString(),
    });

    logTiming(`questionService GET ${endpoint}`, durationMilliseconds, {});

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof QuestionServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      logServiceError('questionService', endpoint, error, {
        statusCode: 408,
        errorType: 'timeout',
      });
      throw new QuestionServiceError(408, 'Question service request timeout');
    }

    if (error instanceof TypeError) {
      logServiceError('questionService', endpoint, error, {
        statusCode: 0,
        errorType: 'network',
      });
      throw new QuestionServiceError(0, `Network error: ${error.message}`);
    }

    logServiceError('questionService', endpoint, error, {
      statusCode: 500,
      errorType: 'unknown',
    });
    throw new QuestionServiceError(500, 'Unknown error while fetching question stats');
  }
}

export async function fetchQuestionStatsCached(): Promise<QuestionStats> {
  'use cache';

  cacheLife('minutes');
  cacheTag('question-stats');

  return fetchQuestionStats();
}
