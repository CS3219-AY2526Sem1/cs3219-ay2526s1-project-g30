/**
 * Mock JWT utilities for authentication
 * These functions will be replaced with real JWT validation
 * when the authentication service is implemented.
 */

const MOCK_JWT_TOKEN_KEY = 'peerprep_mock_jwt'

/**
 * Mock JWT token structure for development
 */
interface MockJWTPayload {
  userId: string
  email: string
  issuedAt: number
  expiresAt: number
}

/**
 * Generates a mock JWT token
 */
export function generateMockJWT(): string {
  const payload: MockJWTPayload = {
    userId: 'mock-user-123',
    email: 'user@example.com',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  const token = JSON.stringify(payload)
  console.log('[MockAuth] Generated JWT:', token)
  return token
}

/**
 * Retrieves the mock JWT token from localStorage
 * In production, this will be replaced with secure HTTP-only cookies
 */
export function getMockJWT(): string | null {
  if (typeof window === 'undefined') {
    console.log('[MockAuth] Window is undefined (server-side), returning null')
    return null
  }
  const token = localStorage.getItem(MOCK_JWT_TOKEN_KEY)
  console.log('[MockAuth] Retrieved JWT from localStorage:', token)
  return token
}

/**
 * Stores a mock JWT token in localStorage
 * In production, this will be replaced with secure HTTP-only cookies
 */
export function setMockJWT(token: string): void {
  if (typeof window === 'undefined') {
    console.log('[MockAuth] Window is undefined (server-side), cannot set token')
    return
  }
  console.log('[MockAuth] Storing JWT in localStorage:', token)
  localStorage.setItem(MOCK_JWT_TOKEN_KEY, token)
  console.log('[MockAuth] JWT stored successfully')
}

/**
 * Clears the mock JWT token from localStorage
 */
export function clearMockJWT(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(MOCK_JWT_TOKEN_KEY)
}

/**
 * Validates a mock JWT token
 */
export function isValidMockJWT(token: string | null): boolean {
  if (!token) {
    console.log('[MockAuth] Token is null/undefined, validation failed')
    return false
  }
  try {
    const payload: MockJWTPayload = JSON.parse(token)
    const isValid = payload.expiresAt > Date.now()
    console.log('[MockAuth] Token validation result:', isValid)
    console.log('[MockAuth] Token expiry:', new Date(payload.expiresAt).toISOString())
    return isValid
  } catch (error) {
    console.log('[MockAuth] Error parsing token:', error)
    return false
  }
}
