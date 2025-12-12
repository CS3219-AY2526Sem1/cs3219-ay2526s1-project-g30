import { redirect } from 'next/navigation'

/**
 * Root page that redirects authenticated users to home
 *
 * Authentication routing is now handled by proxy.ts:
 * - Unauthenticated users are redirected to /login by proxy
 * - Authenticated users reach this page and are redirected to /home
 *
 * This page serves as a fallback in case:
 * - Proxy fails or is disabled
 * - JavaScript is disabled in browser
 * - Manual navigation to root path occurs
 *
 * The error message below displays when redirect() fails to execute,
 * providing guidance to users on what went wrong.
 */

export default function RootPage() {
  // Redirect authenticated users to home
  // If this throws, the error boundary below will catch it
  redirect('/home')

  // Fallback content (reached if redirect somehow fails or JS is disabled)
  // This will only display if redirect() doesn't work as expected
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-white">Redirecting...</h1>
        <p className="text-slate-300">
          You should be redirected shortly. If you aren&apos;t, please enable JavaScript or try{' '}
          <a href="/home" className="font-semibold text-blue-400 hover:text-blue-300 underline">
            clicking here
          </a>
          .
        </p>
        <p className="pt-4 text-xs text-slate-500">
          If you see this page repeatedly, there may be an authentication issue. Please try{' '}
          <a href="/login" className="font-semibold text-blue-400 hover:text-blue-300 underline">
            logging in again
          </a>
          .
        </p>
      </div>
    </div>
  )
}
