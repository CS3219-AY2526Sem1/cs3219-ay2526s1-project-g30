// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

'use client'

import { useEffect, useState } from 'react'
import { getUserPreferredLanguages } from '@/app/actions/profile'

export function usePreferredLanguages() {
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPreferredLanguages() {
      try {
        const languages = await getUserPreferredLanguages()
        setPreferredLanguages(languages || [])
      } catch (error) {
        console.error('Failed to load preferred languages:', error)
        setPreferredLanguages([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferredLanguages()
  }, [])

  return { preferredLanguages, isLoading, setPreferredLanguages }
}
