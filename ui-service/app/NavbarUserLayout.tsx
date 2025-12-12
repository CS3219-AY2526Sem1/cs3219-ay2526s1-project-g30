import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { NavbarSkeleton } from './NavbarSkeleton'
import { getUserProfile } from '@/app/actions/auth'


async function NavbarServer() {
  let userProfile = null

  try {
    userProfile = await getUserProfile()
  } catch {
    // On prerender or when cookies() is unavailable, fall back to no navbar.
    userProfile = null
  }

  return <Navbar userProfile={userProfile} />
}

export function NavbarUserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <NavbarServer />
      </Suspense>
      {children}
    </>
  )
}
