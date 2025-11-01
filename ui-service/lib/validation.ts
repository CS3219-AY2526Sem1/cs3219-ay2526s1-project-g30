/**
 * Email validation following RFC 5322 specification.
 * Uses a reasonable regex pattern for practical email validation.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Username validation rules:
 * - Must be 3-32 characters long
 * - Must only contain alphanumeric characters, dashes, or underscores
 * - Case-insensitive storage, but case is preserved for display
 */
export function validateUsername(username: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!username) {
    return { isValid: false, errorMessage: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, errorMessage: 'Username must be at least 3 characters' };
  }

  if (username.length > 32) {
    return { isValid: false, errorMessage: 'Username must be at most 32 characters' };
  }

  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  
  if (!usernameRegex.test(username)) {
    return { isValid: false, errorMessage: 'Username can only contain letters, numbers, periods, dashes, and underscores' };
  }

  return { isValid: true };
}

/**
 * Password validation rules:
 * - Must be at least 8 characters long
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!password) {
    return { isValid: false, errorMessage: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, errorMessage: 'Password must be at least 8 characters' };
  }

  return { isValid: true };
}
