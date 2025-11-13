// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

'use client'

import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import type { MultiSelectOption } from '@/components/ui/multi-select'
import { ArrowRight } from 'lucide-react'

interface HomeLayoutProps {
  isMounted: boolean
  preferredLanguages: string[]
  onPreferredLanguagesChange: (value: string[]) => void
  availableTopics: MultiSelectOption[]
  selectedTopic: string
  onSelectedTopicChange: (value: string) => void
  difficultyLevel: string
  onDifficultyLevelChange: (value: string) => void
  isLoadingStats: boolean
  isMatchingActive: boolean
  canStartMatching: boolean
  onStartMatchingClick: () => void
  languagesOptions: MultiSelectOption[]
  buildDifficultyOptions: () => string[]
  isStartDisabled: boolean
  isPending: boolean
}

export function HomeLayout({
  isMounted,
  preferredLanguages,
  onPreferredLanguagesChange,
  availableTopics,
  selectedTopic,
  onSelectedTopicChange,
  difficultyLevel,
  onDifficultyLevelChange,
  isLoadingStats,
  isMatchingActive,
  canStartMatching,
  onStartMatchingClick,
  languagesOptions,
  buildDifficultyOptions,
  isStartDisabled,
  isPending,
}: HomeLayoutProps) {
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-[90vw] max-w-2xl">
          <div className="mb-4 pl-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Home</h1>
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

  const availableDifficultiesForTopic = buildDifficultyOptions()

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-[90vw] max-w-2xl">
        <div className="mb-4 pl-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Home</h1>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border p-8">
          <main className="flex flex-col gap-8">
            <div className="border-b border-border pb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Find a coding interview partner
              </h2>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Programming languages</Label>
              <MultiSelect
                options={languagesOptions}
                defaultValue={preferredLanguages}
                onValueChange={onPreferredLanguagesChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Topic</Label>
                {isLoadingStats ? (
                  <div className="h-10 bg-muted animate-pulse rounded" />
                ) : (
                  <Select value={selectedTopic} onValueChange={onSelectedTopicChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopics.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Difficulty level</Label>
                {isLoadingStats ? (
                  <div className="h-10 bg-muted animate-pulse rounded" />
                ) : (
                  <Select value={difficultyLevel} onValueChange={onDifficultyLevelChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDifficultiesForTopic.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Separator />

            <Button
              size="lg"
              className="w-full text-base font-semibold"
              disabled={isStartDisabled || !canStartMatching}
              onClick={onStartMatchingClick}
            >
              {isMatchingActive || isPending ? (
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
    </div>
  )
}
