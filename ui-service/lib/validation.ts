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

/**
 * Check if a username is available by calling the user service.
 * Returns true if available, false if already taken.
 * 
 * TODO: Replace mock implementation with actual API call to user service.
 * Mock behaviour: Returns unavailable if username contains "invalid", otherwise available.
 */
export async function checkUsernameAvailability(username: string): Promise<{
  isAvailable: boolean;
  errorMessage?: string;
}> {
  // Mock implementation: simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock: username containing "invalid" is not available
  if (username.toLowerCase().includes('invalid')) {
    return { isAvailable: false, errorMessage: 'Username is already taken' };
  }

  // All other usernames are available
  return { isAvailable: true };
}

/**
 * Sign in with email and password.
 * 
 * TODO: Replace mock implementation with actual API call to auth service.
 * Expected: POST /api/auth/signin with { email, password }
 * On success: return { success: true }
 * On error: return { success: false, errorMessage: string }
 * 
 * Mock behaviour: Fails if password is empty or "invalid", otherwise succeeds.
 */
export async function signInWithPassword(email: string, password: string): Promise<{
  success: boolean;
  errorMessage?: string;
}> {
  // Mock implementation: simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock validation: fail if password is empty or "invalid"
  if (!password || password.toLowerCase() === 'invalid') {
    return { success: false, errorMessage: 'Incorrect email or password' };
  }

  // Mock: sign-in successful
  return { success: true };
}

/**
 * Request a password reset email.
 * 
 * TODO: Replace mock implementation with actual API call to auth service.
 * Expected: POST /api/auth/request-password-reset with { email }
 * On success: return { success: true }
 * On error: return { success: false }
 * 
 * Mock behaviour: Fails if email is empty, otherwise succeeds after 1.2 second delay.
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
}> {
  // Mock implementation: simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Mock: fail if no email
  if (!email) {
    return { success: false };
  }
  
  // Mock: fail if email is "fail@example.com"
  if (email.toLowerCase() === 'fail@example.com') {
    return { success: false };
  }

  // Mock: password reset email sent successfully
  return { success: true };
}
