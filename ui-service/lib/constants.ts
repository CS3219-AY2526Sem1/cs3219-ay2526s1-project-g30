/**
 * Application-wide constants for UI options and configurations.
 *
 * These constants define the available options for multi-select fields,
 * topics, and other UI-driven configurations.
 */

import type { MultiSelectOption } from '@/components/ui/multi-select';

/**
 * Available pronoun options for user profiles.
 * Users can select one or more pronouns from this list.
 */
export const PRONOUNS_OPTIONS: MultiSelectOption[] = [
  { label: 'he/him', value: 'he/him' },
  { label: 'she/her', value: 'she/her' },
  { label: 'they/them', value: 'they/them' },
  { label: 'it/its', value: 'it/its' },
];

/**
 * Available programming language options for user preferences.
 * Users can select their preferred programming languages from this list.
 * Labels are properly capitalized for the UI; values are lowercase for backend consistency.
 */
export const PROGRAMMING_LANGUAGE_OPTIONS: MultiSelectOption[] = [
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'C/C++', value: 'cpp' },
];

/**
 * Available interview topics/categories for question matching.
 * These match the available topics in the question database.
 * Values are lowercase for backend consistency, labels are properly capitalized for the UI.
 */
export const INTERVIEW_TOPIC_OPTIONS = [
  { label: 'Array', value: 'array' },
  { label: 'Linked List', value: 'linked list' },
  { label: 'Dynamic Programming', value: 'dynamic programming' },
] as const;

/**
 * Available difficulty levels for interview questions.
 */
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;
