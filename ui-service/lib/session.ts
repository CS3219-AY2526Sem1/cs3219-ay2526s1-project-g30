/**
 * Session management module for secure authentication.
 *
 * Handles JWT encryption/decryption, cookie management, and session lifecycle.
 * All session operations are server-only using the 'jose' library for JWT handling.
 */

import 'server-only';

import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { config } from './config';

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  username: string;
  token?: string;
  expiresAt: string | Date;
  profileComplete?: boolean;
}

const encodedKey = new TextEncoder().encode(config.session.secret);

/**
 * Encrypts session data into a signed JWT.
 *
 * @param payload The session payload to encrypt
 * @returns The encrypted JWT token
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

/**
 * Decrypts and verifies a JWT token.
 *
 * @param token The JWT token to decrypt
 * @returns The decrypted payload, or null if verification fails
 */
export async function decryptSession(
  token: string | undefined = ''
): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, encodedKey);
    return verified.payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Creates a new session by encrypting the payload and setting a secure HTTP-only cookie.
 *
 * @param userId The user ID for the session
 * @param email The user's email
 * @param username The user's username
 * @param token Optional authentication token
 * @param profileComplete Whether the user has completed their profile setup
 */
export async function createSession(
  userId: string,
  email: string,
  username: string,
  token?: string,
  profileComplete: boolean = false
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + config.session.expiresInDays * 24 * 60 * 60 * 1000
  );

  const payload: SessionPayload = {
    userId,
    email,
    username,
    token,
    expiresAt,
    profileComplete,
  };

  const encrypted = await encryptSession(payload);
  const cookieStore = await cookies();

  cookieStore.set(config.session.cookieName, encrypted, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.session.expiresInDays * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Updates the session expiration time without modifying the session data.
 *
 * Useful for keeping users logged in when they return to the application.
 *
 * @returns The updated session payload, or null if no valid session exists
 */
export async function updateSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(config.session.cookieName);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const payload = await decryptSession(sessionCookie.value);

  if (!payload) {
    return null;
  }

  const expiresAt = new Date(
    Date.now() + config.session.expiresInDays * 24 * 60 * 60 * 1000
  );

  const newPayload: SessionPayload = {
    ...payload,
    expiresAt,
  };

  const encrypted = await encryptSession(newPayload);

  cookieStore.set(config.session.cookieName, encrypted, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.session.expiresInDays * 24 * 60 * 60,
    path: '/',
  });

  return newPayload;
}

/**
 * Retrieves the current session from cookies without updating expiration.
 *
 * @returns The session payload, or null if no valid session exists
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(config.session.cookieName);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  return decryptSession(sessionCookie.value);
}

/**
 * Deletes the session by removing the session cookie.
 *
 * Typically called on logout.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(config.session.cookieName);
}

/**
 * Generates an authentication token from session data.
 *
 * Creates a JWT token in the format expected by the user-service backend.
 * This token should be sent in the Authorization header as "Bearer <token>".
 *
 * @param userId The user ID
 * @param expiresIn Token expiration time (default: '5h' to match backend)
 * @returns The JWT token string
 */
export async function generateAuthToken(
  userId: string,
  expiresIn: string = '5h'
): Promise<string> {
  const jwtKey = new TextEncoder().encode(config.session.secret);
  const payload = {
    user: {
      id: userId,
    },
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(jwtKey);
}

/**
 * Marks the user's profile as complete in the session.
 *
 * Updates the profileComplete flag to true, indicating the user has finished
 * their initial profile setup after registration.
 *
 * @returns The updated session payload, or null if no valid session exists
 */
export async function markProfileComplete(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(config.session.cookieName);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const payload = await decryptSession(sessionCookie.value);

  if (!payload) {
    return null;
  }

  const expiresAt = new Date(
    Date.now() + config.session.expiresInDays * 24 * 60 * 60 * 1000
  );

  const newPayload: SessionPayload = {
    ...payload,
    expiresAt,
    profileComplete: true,
  };

  const encrypted = await encryptSession(newPayload);

  cookieStore.set(config.session.cookieName, encrypted, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.session.expiresInDays * 24 * 60 * 60,
    path: '/',
  });

  return newPayload;
}
