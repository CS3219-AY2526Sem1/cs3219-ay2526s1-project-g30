import type { ReactNode } from 'react'
import { NavbarUserLayout } from '../NavbarUserLayout'

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return <NavbarUserLayout>{children}</NavbarUserLayout>
}
