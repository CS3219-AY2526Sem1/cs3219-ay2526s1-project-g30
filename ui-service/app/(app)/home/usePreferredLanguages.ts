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
