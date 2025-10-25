/**
 * Centralised mock data for the entire application.
 *
 * All mock user data is defined here to ensure consistency across the project.
 * This includes profile information, preferences, and UI options.
 *
 * To update mock user data globally, edit the constants in this file.
 * All components will automatically use the updated values.
 *
 * TODO: Replace all imports with actual API calls when backend services are ready.
 */

import { SocialLink, SocialPlatform } from '@/types/social';
import { ProgrammingLanguage } from '@/types/programming';
import type { MultiSelectOption } from '@/components/ui/multi-select';

/**
 * Mock user profile data.
 * Used across settings, profile viewing, and home pages.
 */
export const MOCK_USER = {
  id: 'user-1',
  username: 'johndoe',
  displayName: 'John Doe',
  headline: 'Software Engineer',
  bio: 'Passionate about coding and problem-solving. Always learning and exploring new technologies.',
  profileImage: 'https://github.com/shadcn.png',
  pronouns: ['he/him'],
  preferredLanguages: ['java', 'python'] as ProgrammingLanguage[],
  socialLinks: [
    {
      id: 'link-1',
      platform: 'github' as SocialPlatform,
      url: 'https://github.com/johndoe',
    },
    {
      id: 'link-2',
      platform: 'linkedin' as SocialPlatform,
      url: 'https://linkedin.com/in/johndoe',
    },
    {
      id: 'link-3',
      platform: 'twitter' as SocialPlatform,
      url: 'https://twitter.com/johndoe',
    },
  ] as SocialLink[],
};

/**
 * Initial state values for settings page form fields.
 * Derived from MOCK_USER for consistency.
 */
export const INITIAL_DISPLAY_NAME = MOCK_USER.displayName;
export const INITIAL_HEADLINE = MOCK_USER.headline;
export const INITIAL_BIO = MOCK_USER.bio;
export const INITIAL_PROFILE_IMAGE = MOCK_USER.profileImage;
export const INITIAL_PRONOUNS = MOCK_USER.pronouns;
export const INITIAL_PREFERRED_LANGUAGES = MOCK_USER.preferredLanguages;
export const INITIAL_SOCIAL_LINKS = MOCK_USER.socialLinks;

/**
 * UI option configurations.
 */
export const INITIAL_PRONOUNS_OPTIONS: MultiSelectOption[] = [
  { label: 'he/him', value: 'he/him' },
  { label: 'she/her', value: 'she/her' },
  { label: 'they/them', value: 'they/them' },
  { label: 'it/its', value: 'it/its' },
];

export const INITIAL_PROGRAMMING_LANGUAGE_OPTIONS: MultiSelectOption[] = [
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'C/C++', value: 'cpp' },
];
