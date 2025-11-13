import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { LayoutContentClient } from './LayoutContentClient'

export function LayoutContent({ children }: { children: React.ReactNode }) {

  return (
    <>
      <Suspense>
        <LayoutContentClient>
          {children}
        </LayoutContentClient>
      </Suspense>
      <Toaster />
    </>
  )
}
