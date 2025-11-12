'use client'

import { useMemo, useState } from 'react'
import { PROGRAMMING_LANGUAGE_OPTIONS } from '@/lib/constants'
import type { MultiSelectOption } from '@/components/ui/multi-select'
import { useHomeQuestionStats } from './useHomeQuestionStats'
import { usePreferredLanguages } from './usePreferredLanguages'
import { useMatchingFlow } from './useMatchingFlow'
import { HomeLayout } from './HomeLayout'

const LANGUAGE_OPTIONS = PROGRAMMING_LANGUAGE_OPTIONS

export default function HomePage() {
  const { availableTopics, allStats, isLoading: isLoadingStats } = useHomeQuestionStats()
  const {
    preferredLanguages,
    isLoading: isLoadingLanguages,
    setPreferredLanguages,
  } = usePreferredLanguages()
  const { isMatchingActive, isPending, canStartMatching, startMatching } = useMatchingFlow()

  const initialTopic = availableTopics[0]?.value ?? ''
  const [selectedTopic, setSelectedTopic] = useState(initialTopic)
  const [difficultyLevel, setDifficultyLevel] = useState('')

  const buildDifficultyOptions = () => {
    if (!selectedTopic || !allStats) return []
    const topicStats = allStats[selectedTopic]
    if (!topicStats) return []
    return Object.keys(topicStats)
      .map((diff) => diff.charAt(0).toUpperCase() + diff.slice(1))
      .sort()
  }

  const availableDifficulties = buildDifficultyOptions()

  const effectiveDifficulty = difficultyLevel || availableDifficulties[0] || ''

  const isStartDisabled = useMemo(() => {
    if (!canStartMatching) return true
    if (isMatchingActive) return true
    if (isLoadingStats || isLoadingLanguages) return true
    if (!selectedTopic || !effectiveDifficulty) return true
    if (preferredLanguages.length === 0) return true
    return false
  }, [
    canStartMatching,
    isMatchingActive,
    isLoadingStats,
    isLoadingLanguages,
    selectedTopic,
    effectiveDifficulty,
    preferredLanguages.length,
  ])

  const handleStartMatchingClick = () => {
    if (isStartDisabled) return

    const selectedLanguageLabels = preferredLanguages
      .map((lang) => {
        const option = LANGUAGE_OPTIONS.find((opt: MultiSelectOption) => opt.value === lang)
        return option?.label || lang
      })
      .join(', ') || 'No languages selected'

    const selectedTopicLabel =
      availableTopics.find((opt) => opt.value === selectedTopic)?.label || selectedTopic

    const matchingDescription = `${selectedTopicLabel} | ${selectedLanguageLabels} | ${effectiveDifficulty}`

    startMatching({
      difficulty: effectiveDifficulty,
      topic: selectedTopic,
      languages: preferredLanguages,
      matchingDescription,
    })
  }

  return (
    <HomeLayout
      isMounted
      preferredLanguages={preferredLanguages}
      onPreferredLanguagesChange={setPreferredLanguages}
      availableTopics={availableTopics}
      selectedTopic={selectedTopic}
      onSelectedTopicChange={setSelectedTopic}
      difficultyLevel={effectiveDifficulty}
      onDifficultyLevelChange={setDifficultyLevel}
      isLoadingStats={isLoadingStats}
      isMatchingActive={isMatchingActive}
      canStartMatching={canStartMatching}
      onStartMatchingClick={handleStartMatchingClick}
      languagesOptions={LANGUAGE_OPTIONS}
      buildDifficultyOptions={buildDifficultyOptions}
      isStartDisabled={isStartDisabled}
      isPending={isPending}
    />
  )
}
