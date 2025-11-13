// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-31
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StatusBarProps {
  questionName: string
  programmingLanguage: string
  difficulty: string
  onEndSession: () => void
}

export function StatusBar({
  questionName,
  programmingLanguage,
  difficulty,
  onEndSession,
}: StatusBarProps) {
  return (
    <div className="shrink-0 border-b border-border bg-background">
      <div className="flex items-center justify-between px-6 py-2 gap-4">
        {/* Left - Session Info */}
        <div className="flex-1 text-left text-sm text-muted-foreground">
          {questionName} | {programmingLanguage} | {difficulty}
        </div>

        {/* Right - End Session Button */}
        <div className="shrink-0">
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndSession}
          >
            <LogOut />
            End session
          </Button>
        </div>
      </div>
    </div>
  )
}
