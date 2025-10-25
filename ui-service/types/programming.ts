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
