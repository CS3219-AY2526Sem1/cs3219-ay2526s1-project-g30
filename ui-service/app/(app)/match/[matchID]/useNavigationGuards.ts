// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

'use client'

import { useEffect } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

interface UseNavigationGuardsOptions {
  router: AppRouterInstance
  hasActiveSession: () => boolean
  isTerminatingRef: React.MutableRefObject<boolean>
}

export function useNavigationGuards({
  router,
  hasActiveSession,
  isTerminatingRef,
}: UseNavigationGuardsOptions) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasActiveSession() || isTerminatingRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasActiveSession, isTerminatingRef])

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a')
      if (!target || !hasActiveSession() || isTerminatingRef.current) return

      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http')) return

      event.preventDefault()
      event.stopPropagation()
      console.log('[Match Page] Intercepted link click:', href)
    }

    const handleDropdownItemClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[role="menuitem"]')
      if (!target || !hasActiveSession() || isTerminatingRef.current) return

      const isDestructiveItem =
        target.getAttribute('data-variant') === 'destructive' ||
        target.textContent?.toLowerCase().includes('log out') ||
        target.textContent?.toLowerCase().includes('logout')

      if (!isDestructiveItem) return

      event.preventDefault()
      event.stopPropagation()
      console.log('[Match Page] Intercepted logout attempt')
    }

    document.addEventListener('click', handleLinkClick, true)
    document.addEventListener('click', handleDropdownItemClick, true)
    return () => {
      document.removeEventListener('click', handleLinkClick, true)
      document.removeEventListener('click', handleDropdownItemClick, true)
    }
  }, [hasActiveSession, isTerminatingRef])
}
