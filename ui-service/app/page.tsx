'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMockJWT, isValidMockJWT } from '@/lib/mockAuth'

/**
 * TODO: Replace mock JWT authentication with real auth check
 *
 * Current flow (mock):
 * - Checks localStorage for mock JWT token
 * - Redirects to /home if valid, /login if invalid
 *
 * Future implementation:
 *
 * 1. Create app/actions.ts with getAuthToken Server Function:
 *    - Server Function (not Server Action): async function getAuthToken()
 *    - Reads auth cookie (HTTP-only, secure)
 *    - Validates token on server side
 *    - Returns { isAuthenticated: boolean, user?: UserData }
 *    - Do NOT use useEffect for this; use a Server Component instead
 *
 * 2. Convert this to a Server Component:
 *    - Remove 'use client' directive
 *    - Remove useEffect hook (server-side logic only)
 *    - Call getAuthToken() directly
 *    - Use redirect() from next/navigation for redirects
 *    - Pattern:
 *      export default async function RootPage() {
 *        const { isAuthenticated } = await getAuthToken();
 *        if (isAuthenticated) {
 *          redirect('/home');
 *        }
 *        redirect('/login');
 *      }
 *
 * 3. Benefits of Server Component approach:
 *    - Auth check happens server-side before page renders
 *    - No flash of wrong page on client-side
 *    - More secure (token validation on server)
 *    - Simpler logic without useEffect/router
 *
 * 4. Keep mock flow for now:
 *    - Replace getMockJWT() with getAuthToken() when ready
 *    - Keep useEffect for client-side demo
 *    - Update to Server Component approach later
 */

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    console.log('[RootPage] Checking authentication...')
    // TODO: Replace mock JWT check with real auth validation
    // See comments above for implementation details
    // For now, use mock JWT flow:
    
    // Check localStorage synchronously without delay
    const token = getMockJWT()
    const isValid = isValidMockJWT(token)

    console.log('[RootPage] Auth check result:', { hasToken: !!token, isValid })

    // Use replace() instead of push() to avoid adding to browser history
    if (isValid) {
      // User is authenticated, redirect to home
      console.log('[RootPage] Valid token found, redirecting to /home')
      router.replace('/home')
    } else {
      // User is not authenticated, redirect to login
      console.log('[RootPage] No valid token, redirecting to /login')
      router.replace('/login')
    }
  }, [router])

  // Return null or a loading state while redirecting
  return null
}
