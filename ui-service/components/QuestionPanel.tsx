'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface QuestionPanelProps {
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  examples?: {
    input: string
    output: string
    explanation?: string
  }[]
  constraints?: string[]
  textSize?: number
  // Future question-service integration parameters
  questionId?: string
  onFetchQuestion?: (questionId: string) => Promise<void>
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
    case 'medium':
      return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
    case 'hard':
      return 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

export function QuestionPanel({
  title,
  description,
  difficulty,
  examples = [],
  constraints = [],
  textSize = 14,
}: QuestionPanelProps) {
  const baseFontSize = textSize / 14 // 14px is our base

  return (
    <ScrollArea className="h-full w-full bg-background text-foreground">
      <div className="p-6 space-y-6">
        {/* Title and Difficulty */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-2">
            <Badge className={`${getDifficultyColor(difficulty)} font-semibold`}>
              {difficulty}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground">Description</h2>
          <p
            className="text-foreground leading-relaxed"
            style={{ fontSize: `${textSize}px` }}
          >
            {description}
          </p>
        </div>

        {/* Examples */}
        {examples.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground">Examples</h2>
            <div className="space-y-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className="bg-muted rounded-lg p-4 space-y-2 border border-border"
                >
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Example {index + 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono uppercase">Input:</p>
                    <p
                      className="text-foreground font-mono mt-1"
                      style={{ fontSize: `${textSize - 2}px` }}
                    >
                      {example.input}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono uppercase">Output:</p>
                    <p
                      className="text-foreground font-mono mt-1"
                      style={{ fontSize: `${textSize - 2}px` }}
                    >
                      {example.output}
                    </p>
                  </div>
                  {example.explanation && (
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase">
                        Explanation:
                      </p>
                      <p
                        className="text-foreground mt-1"
                        style={{ fontSize: `${textSize}px` }}
                      >
                        {example.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground">Constraints</h2>
            <ul className="space-y-2">
              {constraints.map((constraint, index) => (
                <li
                  key={index}
                  className="text-foreground flex items-start gap-2"
                  style={{ fontSize: `${textSize}px` }}
                >
                  <span className="text-primary mt-1">•</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
