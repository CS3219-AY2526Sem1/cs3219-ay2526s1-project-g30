'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useActionState } from 'react'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { getUserPreferredLanguages } from '@/app/actions/profile'
import { startMatching } from '@/app/actions/matching'
import { PROGRAMMING_LANGUAGE_OPTIONS, INTERVIEW_TOPIC_OPTIONS, DIFFICULTY_LEVELS } from '@/lib/constants'
import { config } from '@/lib/config'

const LANGUAGE_OPTIONS = PROGRAMMING_LANGUAGE_OPTIONS

const DIFFICULTY_OPTIONS = DIFFICULTY_LEVELS

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false)
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>(INTERVIEW_TOPIC_OPTIONS[0].value)
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true)
  const [difficultyLevel, setDifficultyLevel] = useState<string>('Medium')
  const toastIdRef = useRef<string | number | null>(null)
  const errorToastIdRef = useRef<string | number | null>(null)
  const matchingDescriptionRef = useRef<string>('')
  const [isMatchingActive, setIsMatchingActive] = useState(false)

  const [countdownSeconds, setCountdownSeconds] = useState<number>(config.matchingService.timeoutSeconds)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)

  // Manage the interval when isCountingDown changes
  useEffect(() => {
    if (!isCountingDown) {
      // Clean up interval if it exists
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    // Start a new interval
    intervalIdRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const newValue = prev - 1
        if (newValue <= 0) {
          // Automatically stop counting when reaching 0
          setIsCountingDown(false)
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
          }
          return 0
        }
        return newValue
      })
    }, 1000)

    // Cleanup function
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [isCountingDown])

  const startCountdown = useCallback(() => {
    setCountdownSeconds(config.matchingService.timeoutSeconds)
    setIsCountingDown(true)
  }, [])

  const stopCountdown = useCallback(() => {
    setIsCountingDown(false)
  }, [])

  const resetCountdown = useCallback(() => {
    setIsCountingDown(false)
    setCountdownSeconds(config.matchingService.timeoutSeconds)
  }, [])

  const [matchingState, matchingAction, isMatchingPending] = useActionState(
    startMatching,
    undefined
  )

  // Set mounted flag to avoid hydration issues with Radix components
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load user's preferred languages on mount
  useEffect(() => {
    async function loadPreferredLanguages() {
      try {
        const languages = await getUserPreferredLanguages()
        setPreferredLanguages(languages || [])
      } catch (error) {
        console.error('Failed to load preferred languages:', error)
        setPreferredLanguages([])
      } finally {
        setIsLoadingLanguages(false)
      }
    }

    loadPreferredLanguages()
  }, [])

  // When matching starts, create toast and start countdown
  useEffect(() => {
    if (!isMatchingActive) return

    // Dismiss any existing toasts from previous attempts
    if (errorToastIdRef.current) {
      toast.dismiss(errorToastIdRef.current)
      errorToastIdRef.current = null
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }

    // Generate unique toast ID for this attempt
    toastIdRef.current = Math.random()

    // Reset and start countdown
    resetCountdown()
    startCountdown()

    // Create initial toast
    toast(
      <div className="flex items-center gap-3">
        <Spinner className="size-5" />
        <div className="flex-1">
          <div className="font-semibold">Finding a match...</div>
          <div className="text-sm text-muted-foreground">
            {matchingDescriptionRef.current} · <span>{config.matchingService.timeoutSeconds}s</span>
          </div>
        </div>
      </div>,
      {
        id: toastIdRef.current,
        duration: Infinity,
        position: 'top-center',
      }
    )
  }, [isMatchingActive, resetCountdown, startCountdown])

  // Update toast countdown display when countdown changes
  useEffect(() => {
    if (!isMatchingActive || !toastIdRef.current) return

    if (countdownSeconds === 0) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
      setIsMatchingActive(false)
      return
    }

    // Update the toast with the new countdown value
    toast(
      <div className="flex items-center gap-3">
        <Spinner className="size-5" />
        <div className="flex-1">
          <div className="font-semibold">Finding a match...</div>
          <div className="text-sm text-muted-foreground">
            {matchingDescriptionRef.current} · <span>{countdownSeconds}s</span>
          </div>
        </div>
      </div>,
      {
        id: toastIdRef.current,
        duration: Infinity,
        position: 'top-center',
      }
    )
  }, [countdownSeconds, isMatchingActive])

  // Handle errors and timeout
  useEffect(() => {
    if (matchingState?.error) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = null
      }
      stopCountdown()
      setIsMatchingActive(false)

      // Show all errors including timeout errors with longer duration (8 seconds) so users can read them
      const id = toast.error(matchingState.error, {
        duration: 8000,
        position: 'top-center',
      })
      errorToastIdRef.current = id
    }
  }, [matchingState?.error, stopCountdown])

  // Handle successful match
  useEffect(() => {
    if (matchingState?.success && matchingState?.matchData) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = null
      }
      stopCountdown()
      setIsMatchingActive(false)

      // Show success toast for 1.5 seconds before redirecting
      toast.success('Match found! Redirecting to interview room...', {
        duration: 1500,
        position: 'top-center',
      })

      // Redirect after 1.5 seconds
      const { sessionId, questionId, programmingLang } = matchingState.matchData
      const searchParams = new URLSearchParams({
        questionID: questionId,
        language: programmingLang,
      })
      setTimeout(() => {
        window.location.href = `/match/${sessionId}?${searchParams.toString()}`
      }, 1500)
    }
  }, [matchingState?.success, matchingState?.matchData, stopCountdown])

  // Show loading skeleton before mounting to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-[90vw] max-w-2xl">
          <div className="mb-4 pl-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Home
            </h1>
          </div>
          <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border p-8">
            <div className="flex flex-col gap-8">
              <div className="border-b border-border pb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Find a coding interview partner
                </h2>
              </div>
              <div className="space-y-4">
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-10 bg-primary/20 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-[90vw] max-w-2xl">
        {/* Floating Header */}
        <div className="mb-4 pl-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Home
          </h1>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border p-8">
          <main className="flex flex-col gap-8">
            {/* Card Header */}
            <div className="border-b border-border pb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Find a coding interview partner
              </h2>
            </div>

            {/* Preferred Programming Languages */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Programming languages
              </Label>
              <MultiSelect
                options={LANGUAGE_OPTIONS}
                defaultValue={preferredLanguages}
                onValueChange={setPreferredLanguages}
              />
            </div>

            {/* Topic Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Topic
              </Label>
              <Tabs value={selectedTopic} onValueChange={setSelectedTopic}>
                <TabsList className="grid w-full grid-cols-3">
                  {INTERVIEW_TOPIC_OPTIONS.map((option) => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Difficulty level
              </Label>
              <Tabs value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <TabsList className="grid w-full grid-cols-3">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <TabsTrigger key={option} value={option}>
                      {option}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <Separator />

            <form action={matchingAction} className="space-y-4">
              <input type="hidden" name="difficulty" value={difficultyLevel} />
              <input type="hidden" name="topic" value={selectedTopic} />
              <input type="hidden" name="languages" value={preferredLanguages.join(',')} />

              <Button
                size="lg"
                type="submit"
                className="w-full text-base font-semibold"
                disabled={isMatchingPending || preferredLanguages.length === 0}
                onClick={() => {
                  if (isMatchingPending) return

                  const selectedLanguageLabels = preferredLanguages
                    .map((lang) => {
                      const option = LANGUAGE_OPTIONS.find((opt) => opt.value === lang)
                      return option?.label || lang
                    })
                    .join(', ') || 'No languages selected'
                  
                  const selectedTopicLabel = INTERVIEW_TOPIC_OPTIONS.find((opt) => opt.value === selectedTopic)?.label || selectedTopic
                  
                  const matchingDescription = `${selectedTopicLabel} | ${selectedLanguageLabels} | ${difficultyLevel}`

                  // Store description in ref for use in effects
                  matchingDescriptionRef.current = matchingDescription

                  // Trigger matching attempt - this will fire the toast/countdown effects
                  setIsMatchingActive(true)
                }}
              >
                {isMatchingPending ? (
                  <>
                    <Spinner className="size-4" /> Matching...
                  </>
                ) : (
                  <>
                    <ArrowRight /> Start matching
                  </>
                )}
              </Button>
            </form>
          </main>
        </div>
      </div>
    </div>
  )
}
