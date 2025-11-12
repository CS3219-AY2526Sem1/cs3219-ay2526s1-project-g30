import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { LayoutContentClient } from './LayoutContentClient'
import { NavbarSkeleton } from './NavbarSkeleton'
import { getUserProfile } from '@/app/actions/auth'

async function UserLayout({ children }: { children: React.ReactNode }) {
  let userProfile = null

  try {
    userProfile = await getUserProfile()
  } catch (error) {
    // Expected for unauthenticated users; Navbar will be hidden
  }

  return (
    <LayoutContentClient userProfile={userProfile}>
      {children}
    </LayoutContentClient>
  )
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        {/* UserLayout is async Server Component; streamed separately */}
        {/* Wrapped in Suspense to allow streaming with Cache Components */}
        <UserLayout>{children}</UserLayout>
      </Suspense>
      <Toaster />
    </>
  )
}
