export type ProgrammingLanguage = "java" | "python" | "cpp";

export interface ProgrammingLanguageConfig {
  value: ProgrammingLanguage;
  label: string;
}

/**
 * Centralised configuration for all supported programming languages.
 *
 * The platform currently supports Java, Python, and C/C++.
 * To add a new language:
 * 1. Add a new entry to the ProgrammingLanguage type above
 * 2. Add a new configuration object to this array
 */
export const PROGRAMMING_LANGUAGES: ProgrammingLanguageConfig[] = [
  {
    value: "java",
    label: "Java",
  },
  {
    value: "python",
    label: "Python",
  },
  {
    value: "cpp",
    label: "C/C++",
  },
];

/**
 * Get the human-readable label for a programming language.
 */
export function getProgrammingLanguageLabel(language: ProgrammingLanguage): string {
  return PROGRAMMING_LANGUAGES.find((lang) => lang.value === language)?.label ?? language;
}

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface ExperienceLevelConfig {
  value: ExperienceLevel;
  label: string;
}

/**
 * Centralised configuration for experience levels.
 *
 * The platform supports three experience levels: Beginner, Intermediate, and Advanced.
 * To add a new level:
 * 1. Add a new entry to the ExperienceLevel type above
 * 2. Add a new configuration object to this array
 */
export const EXPERIENCE_LEVELS: ExperienceLevelConfig[] = [
  {
    value: "beginner",
    label: "Beginner",
  },
  {
    value: "intermediate",
    label: "Intermediate",
  },
  {
    value: "advanced",
    label: "Advanced",
  },
];

/**
 * Get the human-readable label for an experience level.
 */
export function getExperienceLevelLabel(level: ExperienceLevel): string {
  return EXPERIENCE_LEVELS.find((exp) => exp.value === level)?.label ?? level;
}
