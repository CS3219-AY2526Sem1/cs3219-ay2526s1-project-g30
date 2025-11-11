import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
    vi.resetModules();
  });

  it('provides default configuration values in development', async () => {
    process.env.NODE_ENV = 'development';
    vi.resetModules();
    
    // Re-import to get fresh config with new env vars
    const { config } = await import('../config');
    
    expect(config.environment).toBe('development');
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
  });

  it('provides session configuration with defaults', async () => {
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.session.secret).toBeDefined();
    expect(config.session.expiresInDays).toBe(7);
    expect(config.session.cookieName).toBe('session');
  });

  it('provides user service configuration with defaults', async () => {
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.userService.baseUrl).toBe('http://localhost:3001/api/users');
    expect(config.userService.timeout).toBe(10000);
  });

  it('provides matching service configuration with defaults', async () => {
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.matchingService.baseUrl).toBe('http://localhost:8080/api/v1');
    expect(config.matchingService.timeoutSeconds).toBe(30);
    expect(config.matchingService.timeoutMs).toBe(32000);
  });

  it('provides question service configuration with defaults', async () => {
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.questionService.baseUrl).toBe('http://localhost:3002');
    expect(config.questionService.timeout).toBe(10000);
  });

  it('provides collaboration service configuration with defaults', async () => {
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.collaborationService.baseUrl).toBe('http://localhost:8082');
    expect(config.collaborationService.wsUrl).toBe('wss://localhost:8082');
  });

  it('provides feature flags with defaults', async () => {
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.features.enableAuthentication).toBe(true);
  });

  it('respects custom environment variables', async () => {
    process.env.SESSION_SECRET = 'custom-secret';
    process.env.SESSION_EXPIRES_IN_DAYS = '14';
    process.env.NEXT_PUBLIC_USER_SERVICE_URL = 'https://api.example.com/users';
    
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.session.secret).toBe('custom-secret');
    expect(config.session.expiresInDays).toBe(14);
    expect(config.userService.baseUrl).toBe('https://api.example.com/users');
  });

  it('allows disabling authentication via feature flag', async () => {
    process.env.FEATURE_AUTH_ENABLED = 'false';
    
    vi.resetModules();
    const { config } = await import('../config');
    
    expect(config.features.enableAuthentication).toBe(false);
  });
});
