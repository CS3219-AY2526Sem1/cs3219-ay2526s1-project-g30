'use client'

import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/Navbar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname.startsWith('/login')
  const isRootPage = pathname === '/'

  return (
    <div
      className="relative min-h-screen flex flex-col bg-cover bg-no-repeat bg-center bg-fixed"
      style={{ backgroundImage: 'url(/bg-rings.jpg)', backgroundColor: 'hsl(var(--background))', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
    >
      {!isLoginPage && !isRootPage && <Navbar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <Toaster />
    </div>
  )
}
