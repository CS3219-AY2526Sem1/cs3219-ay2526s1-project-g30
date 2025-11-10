/**
 * Unified configuration module for environment variables.
 *
 * This module centralizes all environment variable access for easy migration
 * to Google Cloud Secret Manager in production.
 *
 * All environment variables should be defined here to maintain a single source
 * of truth for configuration across the application.
 */

/**
 * Validates that required environment variables are set at runtime.
 * This is deferred until after build time to allow the application to be built
 * without production secrets being available in the Docker build environment.
 * Secrets are injected at the Cloud Run instance level.
 */
function validateRequiredEnvVars() {
  const requiredInProduction = [
    'SESSION_SECRET',
    'NEXT_PUBLIC_USER_SERVICE_URL',
  ];

  if (process.env.NODE_ENV === 'production') {
    const missingVars = requiredInProduction.filter(
      (variable) => !process.env[variable]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }
  }
}

/**
 * Application configuration object.
 * Access all configuration through this object.
 */
export const config = {
  // Application
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Session & Authentication
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    expiresInDays: parseInt(process.env.SESSION_EXPIRES_IN_DAYS || '7'),
    cookieName: 'session',
  },

  // API Services
  userService: {
    baseUrl:
      process.env.NEXT_PUBLIC_USER_SERVICE_URL ||
      'http://localhost:3001/api/users',
    timeout: parseInt(process.env.USER_SERVICE_TIMEOUT || '10000'),
  },

  matchingService: {
    baseUrl:
      process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL ||
      'http://localhost:8080/api/v1',
    // The matching service uses a 30-second timeout before returning "no match found"
    timeoutSeconds: 30,
    // Client-side timeout includes buffer for network latency (32 seconds = 30s + 2s buffer)
    timeoutMs: parseInt(process.env.MATCHING_SERVICE_TIMEOUT || '32000'),
  },

  questionService: {
    baseUrl:
      process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL ||
      'http://localhost:3002',
    timeout: parseInt(process.env.QUESTION_SERVICE_TIMEOUT || '10000'),
  },

  collaborationService: {
    baseUrl:
      process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL ||
      'http://localhost:8082',
    wsUrl:
      process.env.NEXT_PUBLIC_COLLAB_SERVICE_WS_URL ||
      'wss://localhost:8082',
  },

  // Feature flags (for gradual rollout)
  features: {
    enableAuthentication: process.env.FEATURE_AUTH_ENABLED !== 'false',
  },
} as const;

/**
 * Validates configuration at runtime (server startup).
 * Call this function once when the application starts to ensure all required
 * environment variables are set. This is deferred from module-load time to
 * allow containerised builds without production secrets in the build environment.
 * Secrets are injected at the Cloud Run instance level.
 */
export function validateConfigAtRuntime() {
  if (typeof window === 'undefined') {
    validateRequiredEnvVars();
  }
}

export default config;
