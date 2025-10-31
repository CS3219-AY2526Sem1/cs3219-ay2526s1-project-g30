/**
 * Authentication Proxy
 *
 * Protects routes and performs optimistic authorization checks based on session cookies.
 *
 * Since Proxy runs on every route (including prefetched routes), we only perform
 * fast optimistic checks reading from cookies. Database checks should be done
 * in Server Actions or API routes for better performance.
 *
 * Public routes: Accessible to all users
 * Protected routes: Require valid session cookie
 * Auth routes: Redirect to home if already authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptSession } from '@/lib/session';
import { config as appConfig } from '@/lib/config';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/health',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/home',
  '/match',
  '/profile',
  '/settings',
];

// Routes that should redirect to home if user is already logged in
const AUTH_ROUTES = [
  '/login',
];

/**
 * Verifies session by reading and decrypting the session cookie.
 * This is an optimistic check - use DAL for secure authorization.
 *
 * @param request The incoming request
 * @returns The session payload or null if invalid
 */
async function getSessionFromRequest(request: NextRequest) {
  const sessionCookie = request.cookies.get(appConfig.session.cookieName)?.value;

  if (!sessionCookie) {
    return null;
  }

  return decryptSession(sessionCookie);
}

/**
 * Checks if a route requires authentication.
 *
 * @param pathname The request pathname
 * @returns True if the route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Checks if a route is an authentication route.
 *
 * @param pathname The request pathname
 * @returns True if the route is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Checks if a route is public (doesn't require authentication).
 *
 * @param pathname The request pathname
 * @returns True if the route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Authentication Proxy Function
 *
 * Handles:
 * - Redirects unauthenticated users to /login for protected routes
 * - Redirects authenticated users away from /login to /home
 * - Allows public access to /login and /api routes
 *
 * @param request The incoming request
 * @returns The response (next, redirect, or rewrite)
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static assets and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session from cookies (optimistic check)
  const session = await getSessionFromRequest(request);
  const isAuthenticated = session !== null;

  // If user is trying to access a protected route without authentication
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access an auth route
  // Allow them to stay on /login (they might be in the middle of signup/profile setup)
  // The login page component will handle redirects as needed
  if (isAuthRoute(pathname) && isAuthenticated && pathname !== '/login') {
    // Redirect to home page
    return NextResponse.redirect(new URL('/home', request.nextUrl.origin));
  }

  return NextResponse.next();
}

/**
 * Proxy Configuration
 *
 * Specifies which routes the proxy should apply to.
 * Excludes static assets and Next.js internals.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - image files (.png, .svg, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$).*)',
  ],
};
