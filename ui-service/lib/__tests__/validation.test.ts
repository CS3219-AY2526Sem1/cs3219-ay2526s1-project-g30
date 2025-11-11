import { describe, it, expect } from 'vitest';
import { validateEmail, validateUsername, validatePassword } from '../validation';

describe('validateEmail', () => {
  it('validates correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@example.co.uk')).toBe(true);
    expect(validateEmail('first.last+tag@example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
    expect(validateEmail('user name@example.com')).toBe(false);
  });
});

describe('validateUsername', () => {
  it('validates correct usernames', () => {
    expect(validateUsername('user123')).toEqual({ isValid: true });
    expect(validateUsername('test_user')).toEqual({ isValid: true });
    expect(validateUsername('test-user')).toEqual({ isValid: true });
    expect(validateUsername('test.user')).toEqual({ isValid: true });
    expect(validateUsername('abc')).toEqual({ isValid: true }); // Minimum 3 chars
    expect(validateUsername('a'.repeat(32))).toEqual({ isValid: true }); // Maximum 32 chars
  });

  it('rejects usernames that are too short', () => {
    const result = validateUsername('ab');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Username must be at least 3 characters');
  });

  it('rejects usernames that are too long', () => {
    const result = validateUsername('a'.repeat(33));
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Username must be at most 32 characters');
  });

  it('rejects empty usernames', () => {
    const result = validateUsername('');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Username is required');
  });

  it('rejects usernames with invalid characters', () => {
    const result = validateUsername('user@name');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Username can only contain letters, numbers, periods, dashes, and underscores');
  });

  it('rejects usernames with spaces', () => {
    const result = validateUsername('user name');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Username can only contain letters, numbers, periods, dashes, and underscores');
  });

  it('rejects usernames with special characters', () => {
    const result = validateUsername('user!name');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Username can only contain letters, numbers, periods, dashes, and underscores');
  });
});

describe('validatePassword', () => {
  it('validates correct passwords', () => {
    expect(validatePassword('password123')).toEqual({ isValid: true });
    expect(validatePassword('12345678')).toEqual({ isValid: true }); // Minimum 8 chars
    expect(validatePassword('a'.repeat(100))).toEqual({ isValid: true }); // Long passwords
  });

  it('rejects passwords that are too short', () => {
    const result = validatePassword('short');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Password must be at least 8 characters');
  });

  it('rejects empty passwords', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Password is required');
  });

  it('accepts passwords with special characters', () => {
    expect(validatePassword('P@ssw0rd!')).toEqual({ isValid: true });
    expect(validatePassword('my-secure-password')).toEqual({ isValid: true });
  });

  it('accepts passwords with spaces', () => {
    expect(validatePassword('my password 123')).toEqual({ isValid: true });
  });
});
