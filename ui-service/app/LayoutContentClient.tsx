'use client'

import { usePathname } from 'next/navigation'


interface LayoutContentClientProps {
  children: React.ReactNode
}

export function LayoutContentClient({ children }: LayoutContentClientProps) {
  const pathname = usePathname()
  const isLoginPage = pathname.startsWith('/login')
  const isRootPage = pathname === '/'

  return (
    <>
      {/* Navbar is rendered by NavbarUserLayout; only hide it on login/root */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </>
  )
}
