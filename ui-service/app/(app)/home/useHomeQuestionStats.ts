// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { MultiSelectOption } from '@/components/ui/multi-select'

interface QuestionStatsResult {
  availableTopics: MultiSelectOption[]
  allStats: Record<string, Record<string, number>> | null
  isLoading: boolean
  error: string | null
}

export function useHomeQuestionStats(): QuestionStatsResult {
  const [availableTopics, setAvailableTopics] = useState<MultiSelectOption[]>([])
  const [allStats, setAllStats] = useState<Record<string, Record<string, number>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuestionStats() {
      try {
        setIsLoading(true)
        setError(null)

        const { fetchQuestionStatsAction } = await import('@/app/actions/matching')
        const result = await fetchQuestionStatsAction()

        if (!result.success || !result.stats) {
          throw new Error(result.error || 'Failed to load question stats')
        }

        const stats = result.stats
        setAllStats(stats.difficultyCounts)

        const topicOptions: MultiSelectOption[] = stats.categories
          .map((category: string) => ({
            label: category,
            value: category,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        setAvailableTopics(topicOptions)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load question stats'
        console.error('Failed to load question stats:', err)
        setError(message)
        toast.error(message, { duration: 5000 })
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestionStats()
  }, [])

  return { availableTopics, allStats, isLoading, error }
}
