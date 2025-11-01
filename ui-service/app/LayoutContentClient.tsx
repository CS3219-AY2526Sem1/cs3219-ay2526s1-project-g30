'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import type { User } from '@/types/auth'

interface LayoutContentClientProps {
  children: React.ReactNode
  userProfile: User | null
}

export function LayoutContentClient({ children, userProfile }: LayoutContentClientProps) {
  const pathname = usePathname()
  const isLoginPage = pathname.startsWith('/login')
  const isRootPage = pathname === '/'

  return (
    <>
      {!isLoginPage && !isRootPage && <Navbar userProfile={userProfile} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </>
  )
}
