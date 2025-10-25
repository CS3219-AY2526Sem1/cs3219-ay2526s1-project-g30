'use client'

import { useState, useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowRight, X, TriangleAlert, ClockFading } from 'lucide-react'
import { toast } from 'sonner'
import { useTimeout } from '@/hooks/use-timeout'
import { INITIAL_PROGRAMMING_LANGUAGE_OPTIONS, INITIAL_PREFERRED_LANGUAGES } from '@/lib/mockData'

const LANGUAGE_OPTIONS = INITIAL_PROGRAMMING_LANGUAGE_OPTIONS

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard']

// Mock match data
const MOCK_MATCH = {
  questionName: 'Two Sum',
  matchLanguage: 'Python',
  matchDifficulty: 'Medium',
  timeLimit: '45 minutes',
}

export default function HomePage() {
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])
  const [difficultyLevel, setDifficultyLevel] = useState<string>('Medium')
  const [isMatching, setIsMatching] = useState(false)
  const [toastId, setToastId] = useState<string | number | null>(null)
  const [showMatchDialog, setShowMatchDialog] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(20)
  const matchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [rejectionReason, setRejectionReason] = useState<'manual' | 'timeout' | null>(null)

  // Load user's preferred languages on mount
  useEffect(() => {
    // TODO: Replace with actual API call to fetch user's preferred languages
    // For now, use mock data from centralised mockData
    setPreferredLanguages(INITIAL_PREFERRED_LANGUAGES)
  }, [])

  // Countdown timer and dialog management
  useEffect(() => {
    if (!showMatchDialog) return

    if (toastId) {
      toast.dismiss(toastId)
    }

    setCountdownSeconds(20)

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        const next = prev - 1
        if (next <= 0) {
          setShowMatchDialog(false)
          setRejectionReason('timeout')
          setIsMatching(false)
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showMatchDialog, toastId])

  // Show rejection warning toast
  useEffect(() => {
    if (!rejectionReason) return

    const isManualReject = rejectionReason === 'manual'
    const icon = isManualReject ? <TriangleAlert /> : <ClockFading />
    const title = isManualReject
      ? 'A match was found for you, but you rejected it.'
      : 'A match was found for you, but you failed to accept it in time.'
    const description = 'Doing this too often will result in you being deprioritised for matches.'

    toast(
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>,
      {
        duration: Infinity,
        position: 'top-center',
        action: {
          label: 'OK',
          onClick: () => {
            setRejectionReason(null)
          },
        },
      }
    )

    return () => {
      setRejectionReason(null)
    }
  }, [rejectionReason])

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

            <Button
              size="lg"
              className="w-full text-base font-semibold"
              disabled={isMatching}
              onClick={() => {
                const selectedLanguageLabels = preferredLanguages
                  .map((lang) => {
                    const option = LANGUAGE_OPTIONS.find((opt) => opt.value === lang)
                    return option?.label || lang
                  })
                  .join(', ') || 'No languages selected'
                const matchingDescription = `${selectedLanguageLabels} | ${difficultyLevel}`

                setIsMatching(true)

                const id = toast(
                  <div className="flex items-center gap-3">
                    <Spinner className="size-5" />
                    <div className="flex-1">
                      <div className="font-semibold">Finding a match...</div>
                      <div className="text-sm text-muted-foreground">{matchingDescription}</div>
                    </div>
                  </div>,
                  {
                    duration: Infinity,
                    position: 'top-center',
                    actionButtonStyle: {
                      backgroundColor: 'rgb(239, 68, 68)',
                      color: 'rgb(250, 250, 250)',
                    },
                    action: {
                      label: <div className="flex items-center gap-2"><X className="size-4" /> Cancel</div>,
                      onClick: () => {
                        if (id) {
                          toast.dismiss(id)
                        }
                        // Clear the pending match timeout
                        if (matchTimeoutRef.current) {
                          clearTimeout(matchTimeoutRef.current)
                          matchTimeoutRef.current = null
                        }
                        // TODO: Call API to cancel matching
                        // Expected API: POST /api/matching/cancel
                        // - Cancel the ongoing matching session
                        // - Handle any cleanup required
                        setIsMatching(false)
                        setToastId(null)
                      },
                    },
                  }
                )

                setToastId(id)

                // TODO: Implement matching using a Server Action
                // Expected Server Action: async function startMatching(preferredLanguages: string[], difficultyLevel: string)
                // - Call POST /api/matching/start with { preferredLanguages, difficultyLevel }
                // - On success: redirect to /matching/waiting or /interview/:sessionId if matched immediately
                // - On error: display error message to user, dismiss toast, and set isMatching to false
                // Implementation: Create app/actions.ts with the startMatching Server Action

                // TODO: Replace with actual WebSocket/polling to listen for match found event
                // For now, mock a match after 3 seconds
                matchTimeoutRef.current = setTimeout(() => {
                  setShowMatchDialog(true)
                  setCountdownSeconds(20)
                  matchTimeoutRef.current = null
                }, 3000)
              }}
            >
              {isMatching ? (
                <>
                  <Spinner className="size-4" /> Matching...
                </>
              ) : (
                <>
                  <ArrowRight /> Start matching
                </>
              )}
            </Button>
          </main>
        </div>
      </div>

      <AlertDialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Your match is ready!</AlertDialogTitle>
          <AlertDialogDescription>
            {MOCK_MATCH.questionName} | {MOCK_MATCH.matchLanguage} | {MOCK_MATCH.matchDifficulty} |{' '}
            {MOCK_MATCH.timeLimit}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <Button
              variant="destructive"
              onClick={() => {
                setShowMatchDialog(false)
                setRejectionReason('manual')
                // TODO: Call API to reject the match
                // Reset matching state
                setIsMatching(false)
              }}
            >
              <X /> Reject<span className="font-mono">({countdownSeconds})</span>
            </Button>
            <AlertDialogAction asChild>
              <Button>
                <ArrowRight /> Accept
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
