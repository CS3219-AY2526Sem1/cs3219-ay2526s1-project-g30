// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

'use client'

import { useEffect, useState } from 'react'
import type { Question } from '@/lib/questionServiceClient'
import { fetchQuestionAction } from '@/app/actions/matching'
import { toast } from 'sonner'

interface UseMatchQuestionResult {
  question: Question | null
  isLoading: boolean
  error: string | null
}

export function useMatchQuestion(questionId: string | null): UseMatchQuestionResult {
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!questionId) return

    async function loadQuestion() {
      setIsLoading(true)
      setError(null)

      console.log('[Match Page] Starting to fetch question:', {
        questionId,
        questionIdType: typeof questionId,
      })

      try {
        const result = await fetchQuestionAction(questionId!)

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch question')
        }

        setQuestion(result.data)
        console.log('[Match Page] Question loaded successfully:', {
          title: result.data.title,
          difficulty: result.data.difficulty,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load question'
        console.error('[Match Page] Failed to load question:', {
          error: err,
          errorMessage,
          questionId,
        })
        setError(errorMessage)
        toast.error(errorMessage, { duration: 6000 })
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestion()
  }, [questionId])

  return { question, isLoading, error }
}
