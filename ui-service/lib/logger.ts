/**
 * Centralised logging utility for server actions and API communication.
 *
 * This module provides structured logging for all network requests made to
 * and received from external services, including timestamps, request/response
 * details, and error information.
 *
 * Log levels: debug, info, warn, error
 * All logs are prefixed with service name for easy filtering and debugging.
 */

import 'server-only';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_PREFIX = {
  auth: '[Auth]',
  matching: '[Matching]',
  userService: '[User Service]',
  matchingService: '[Matching Service]',
  questionService: '[Question Service]',
  profile: '[Profile]',
  checkUsername: '[Check Username]',
};

/**
 * Formats a context object for readable log output.
 * Filters out undefined and null values for cleaner logs.
 */
function formatContext(context: LogContext): string {
  const filtered = Object.entries(context).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {} as LogContext
  );

  return JSON.stringify(filtered);
}

/**
 * Logs a request being made to an external service.
 *
 * @param service The service being called (key from LOG_PREFIX)
 * @param endpoint The API endpoint
 * @param method HTTP method (GET, POST, etc.)
 * @param context Additional context data (query params, body, etc.)
 */
export function logOutgoingRequest(
  service: keyof typeof LOG_PREFIX,
  endpoint: string,
  method: string = 'GET',
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `${LOG_PREFIX[service]} Request [${timestamp}] ${method} ${endpoint}`,
    context ? formatContext(context) : ''
  );
}

/**
 * Logs a response received from an external service.
 *
 * @param service The service that was called
 * @param endpoint The API endpoint
 * @param statusCode HTTP status code
 * @param context Additional context data (response data, headers, etc.)
 */
export function logIncomingResponse(
  service: keyof typeof LOG_PREFIX,
  endpoint: string,
  statusCode: number,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  const level = statusCode >= 400 ? 'error' : 'info';
  console.log(
    `${LOG_PREFIX[service]} Response [${timestamp}] ${statusCode} ${endpoint}`,
    context ? formatContext(context) : ''
  );
}

/**
 * Logs an error that occurred during external API communication.
 *
 * @param service The service that was being called
 * @param endpoint The API endpoint
 * @param error The error that occurred
 * @param context Additional context data
 */
export function logServiceError(
  service: keyof typeof LOG_PREFIX,
  endpoint: string,
  error: Error | unknown,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    `${LOG_PREFIX[service]} Error [${timestamp}] ${endpoint} - ${errorMessage}`,
    context ? formatContext(context) : ''
  );
}

/**
 * Logs a server action being invoked.
 *
 * @param actionName The name of the server action
 * @param context Additional context (user info, parameters, etc.)
 */
export function logServerActionStart(
  actionName: string,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[Server Action] Started ${actionName} [${timestamp}]`,
    context ? formatContext(context) : ''
  );
}

/**
 * Logs successful completion of a server action.
 *
 * @param actionName The name of the server action
 * @param context Additional context (result data, etc.)
 */
export function logServerActionSuccess(
  actionName: string,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[Server Action] Completed ${actionName} [${timestamp}]`,
    context ? formatContext(context) : ''
  );
}

/**
 * Logs an error during a server action.
 *
 * @param actionName The name of the server action
 * @param error The error that occurred
 * @param context Additional context
 */
export function logServerActionError(
  actionName: string,
  error: Error | unknown,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    `[Server Action] Error in ${actionName} [${timestamp}] - ${errorMessage}`,
    context ? formatContext(context) : ''
  );
}

/**
 * Logs validation errors for a server action.
 *
 * @param actionName The name of the server action
 * @param errors Object containing validation errors by field
 */
export function logValidationError(
  actionName: string,
  errors: Record<string, string[]>
): void {
  const timestamp = new Date().toISOString();
  console.warn(
    `[Server Action] Validation failed for ${actionName} [${timestamp}]`,
    formatContext(errors)
  );
}

/**
 * Logs timing information for a server action or API call.
 * Useful for performance monitoring.
 *
 * @param label Description of what was timed
 * @param durationMilliseconds How long the operation took
 * @param context Additional context
 */
export function logTiming(
  label: string,
  durationMilliseconds: number,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[Timing] ${label} took ${durationMilliseconds}ms [${timestamp}]`,
    context ? formatContext(context) : ''
  );
}
