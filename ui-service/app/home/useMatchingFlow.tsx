'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { config } from '@/lib/config'
import type { ReactNode } from 'react'

interface StartMatchingParams {
  difficulty: string
  topic: string
  languages: string[]
  matchingDescription: string
}

interface MatchingFlowResult {
  isMatchingActive: boolean
  countdownSeconds: number
  isPending: boolean
  canStartMatching: boolean
  startMatching: (params: StartMatchingParams) => void
}

export function useMatchingFlow(): MatchingFlowResult {
  const [isMatchingActive, setIsMatchingActive] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    config.matchingService.timeoutSeconds,
  )
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [isPending, startTransition] = useTransition()

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const toastIdRef = useRef<string | number | null>(null)
  const errorToastIdRef = useRef<string | number | null>(null)
  const userCancelledRef = useRef(false)
  const matchingDescriptionRef = useRef('')

  const resetCountdown = useCallback(() => {
    setIsCountingDown(false)
    setCountdownSeconds(config.matchingService.timeoutSeconds)
  }, [])

  const startCountdown = useCallback(() => {
    setCountdownSeconds(config.matchingService.timeoutSeconds)
    setIsCountingDown(true)
  }, [])

  const stopCountdown = useCallback(() => {
    setIsCountingDown(false)
  }, [])

  const renderMatchingToast = (remainingSeconds: number): ReactNode => {
    return (
      <div className="flex items-center gap-3">
        <Spinner className="size-5" />
        <div className="flex-1">
          <div className="font-semibold">Finding a match...</div>
          <div className="text-sm text-muted-foreground">
            {matchingDescriptionRef.current} · {remainingSeconds}s
          </div>
        </div>
      </div>
    )
  }

  const showMatchingToast = useCallback(
    (remainingSeconds: number) => {
      toast(renderMatchingToast(remainingSeconds), {
        id: toastIdRef.current ?? undefined,
        duration: Infinity,
        position: 'top-center',
         actionButtonStyle: {
           backgroundColor: 'var(--destructive)',
           color: 'white',
         },
         action: {
           label: 'Cancel',
           icon: 'x',
          onClick: async () => {
            userCancelledRef.current = true
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current)
              toastIdRef.current = null
            }
            stopCountdown()
            try {
              const response = await fetch('/api/matching/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
              const result = await response.json()
              if (result.success) {
                setIsMatchingActive(false)
                toast.success('Match request cancelled', {
                  duration: 2000,
                  position: 'top-center',
                })
              } else {
                toast.error(result.error || 'Failed to cancel match request', {
                  duration: 4000,
                  position: 'top-center',
                })
              }
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred'
              toast.error(message, {
                duration: 4000,
                position: 'top-center',
              })
            }
          },
        },
      })
    },
    [stopCountdown],
  )

  useEffect(() => {
    if (!isCountingDown) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    intervalIdRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const next = prev - 1
        if (next <= 0) {
          setIsCountingDown(false)
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
          }
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [isCountingDown])

  useEffect(() => {
    if (!isMatchingActive) return

    if (errorToastIdRef.current) {
      toast.dismiss(errorToastIdRef.current)
      errorToastIdRef.current = null
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }

    toastIdRef.current = Math.random()

    // Schedule state changes to avoid cascading renders in effect body
    queueMicrotask(() => {
      resetCountdown()
      startCountdown()
      showMatchingToast(config.matchingService.timeoutSeconds)
    })
  }, [
    isMatchingActive,
    resetCountdown,
    startCountdown,
    showMatchingToast,
  ])

  useEffect(() => {
    if (!isMatchingActive || !toastIdRef.current) return

    if (countdownSeconds === 0) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
      // Deactivate matching after timeout via microtask to satisfy lint rule
      queueMicrotask(() => setIsMatchingActive(false))
      return
    }

    showMatchingToast(countdownSeconds)
  }, [countdownSeconds, isMatchingActive, showMatchingToast])

  const startMatching = useCallback(
    ({ difficulty, topic, languages, matchingDescription }: StartMatchingParams) => {
      if (isMatchingActive) return

      matchingDescriptionRef.current = matchingDescription
      userCancelledRef.current = false
      setIsMatchingActive(true)

      const formData = new FormData()
      formData.append('difficulty', difficulty.toLowerCase())
      formData.append('topic', topic)
      formData.append('languages', languages.join(','))

      startTransition(async () => {
        try {
          const response = await fetch('/api/matching/start', {
            method: 'POST',
            body: formData,
          })
          const result = (await response.json()) as {
            success: boolean
            matchData?: {
              sessionId: string
              questionId: string
              programmingLang: string
            }
            error?: string
          }

          if (result.success && result.matchData) {
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current)
              toastIdRef.current = null
            }
            stopCountdown()
            setIsMatchingActive(false)

            toast.success('Match found! Redirecting to interview room...', {
              duration: 1500,
              position: 'top-center',
            })

            const { sessionId, questionId, programmingLang } = result.matchData
            const searchParams = new URLSearchParams({
              questionID: questionId,
              language: programmingLang,
            })

            setTimeout(() => {
              window.location.href = `/match/${sessionId}?${searchParams.toString()}`
            }, 1500)
          } else if (result.error) {
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current)
              toastIdRef.current = null
            }
            stopCountdown()
            setIsMatchingActive(false)

            if (!userCancelledRef.current) {
              const id = toast.error(result.error, {
                duration: 8000,
                position: 'top-center',
              })
              errorToastIdRef.current = id
            }
          }
        } catch (error) {
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current)
            toastIdRef.current = null
          }
          stopCountdown()
          setIsMatchingActive(false)

          if (!userCancelledRef.current) {
            const message =
              error instanceof Error ? error.message : 'An unexpected error occurred'
            const id = toast.error(message, {
              duration: 8000,
              position: 'top-center',
            })
            errorToastIdRef.current = id
          }
        }
      })
    },
    [isMatchingActive, stopCountdown],
  )

  const canStartMatching = !isMatchingActive

  return {
    isMatchingActive,
    countdownSeconds,
    isPending,
    canStartMatching,
    startMatching,
  }
}
