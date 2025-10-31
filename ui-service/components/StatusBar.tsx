'use client'

import { useState, useEffect } from 'react'
import { X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/hooks/use-countdown'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface StatusBarProps {
  initialTimeRemaining: number
  questionName: string
  programmingLanguage: string
  difficulty: string
  totalTimeAllocated: number
  onEndSession: () => void
}

export function StatusBar({
  initialTimeRemaining,
  questionName,
  programmingLanguage,
  difficulty,
  totalTimeAllocated,
  onEndSession,
}: StatusBarProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [timeRemaining, countdownControllers] = useCountdown({
    countStart: initialTimeRemaining,
    countStop: 0,
  })

  useEffect(() => {
    countdownControllers.startCountdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleConfirmEndSession = () => {
    setIsConfirmDialogOpen(false)
    onEndSession()
  }

  return (
    <>
      <div className="shrink-0 border-b border-border bg-background">
        <div className="flex items-center justify-between px-6 py-2 gap-4">
          {/* Left - Timer */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono text-lg font-semibold text-foreground">
              {formatTime(timeRemaining)}
            </span>
            <span className="text-sm text-muted-foreground">
              Remaining
            </span>
          </div>

          {/* Center - Session Info */}
          <div className="flex-1 text-center text-sm text-muted-foreground">
            {questionName} | {programmingLanguage} | {difficulty} | {totalTimeAllocated} min
          </div>

          {/* Right - End Session Button */}
          <div className="shrink-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              <LogOut />
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel><X />Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmEndSession}
            >
              <LogOut />
              End Session
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
