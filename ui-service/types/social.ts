// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

import { Globe } from "lucide-react";
import {
  SiGithub,
  SiLinkedin,
  SiX,
  SiInstagram,
  SiTiktok,
  SiFacebook,
  SiDiscord,
  SiTelegram,
  SiReddit,
  SiMedium,
  SiDribbble,
  SiBehance,
  SiWechat,
  SiLine,
  SiKakaotalk,
  SiSnapchat,
  SiThreads,
  SiMastodon,
  SiCodepen,
  SiGitlab,
  SiHackerrank,
  SiLeetcode,
  SiYoutube,
  SiBluesky,
} from "react-icons/si";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "wechat"
  | "telegram"
  | "bluesky"
  | "twitter"
  | "reddit"
  | "snapchat"
  | "discord"
  | "linkedin"
  | "github"
  | "medium"
  | "line"
  | "kakaotalk"
  | "threads"
  | "mastodon"
  | "behance"
  | "dribbble"
  | "codepen"
  | "gitlab"
  | "leetcode"
  | "hackerrank"
  | "web"

export interface SocialLink {
  id: string
  platform: SocialPlatform | undefined
  url: string
  label?: string
}

export interface SocialPlatformConfig {
  value: SocialPlatform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}

/**
 * Centralised configuration for all supported social media platforms.
 *
 * To add a new platform:
 * 1. Add a new entry to this array with value, label, icon, and placeholder
 * 2. Update the SocialPlatform type above
 * 3. The platform will automatically be available in both SocialLinksSection and SocialLinkDisplay
 *
 * The order here determines the order in the platform selector dropdown.
 */
export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    value: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    placeholder: "https://instagram.com/yourusername",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: SiFacebook,
    placeholder: "https://facebook.com/yourprofile",
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: SiTiktok,
    placeholder: "https://tiktok.com/@yourusername",
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    placeholder: "https://youtube.com/@yourchannel",
  },
  {
    value: "wechat",
    label: "WeChat",
    icon: SiWechat,
    placeholder: "https://wechat.com/yourprofile",
  },
  {
    value: "telegram",
    label: "Telegram",
    icon: SiTelegram,
    placeholder: "https://t.me/yourusername",
  },
  {
    value: "bluesky",
    label: "Bluesky",
    icon: SiBluesky,
    placeholder: "https://bsky.app/profile/yourusername",
  },
  {
    value: "twitter",
    label: "Twitter/X",
    icon: SiX,
    placeholder: "https://twitter.com/yourusername",
  },
  {
    value: "reddit",
    label: "Reddit",
    icon: SiReddit,
    placeholder: "https://reddit.com/u/yourusername",
  },
  {
    value: "snapchat",
    label: "Snapchat",
    icon: SiSnapchat,
    placeholder: "https://snapchat.com/add/yourusername",
  },
  {
    value: "discord",
    label: "Discord",
    icon: SiDiscord,
    placeholder: "https://discord.com/users/yourprofile",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: SiLinkedin,
    placeholder: "https://linkedin.com/in/yourprofile",
  },
  {
    value: "github",
    label: "GitHub",
    icon: SiGithub,
    placeholder: "https://github.com/yourusername",
  },
  {
    value: "medium",
    label: "Medium",
    icon: SiMedium,
    placeholder: "https://medium.com/@yourusername",
  },
  {
    value: "line",
    label: "LINE",
    icon: SiLine,
    placeholder: "https://line.me/R/ti/p/@yourusername",
  },
  {
    value: "kakaotalk",
    label: "Kakao Talk",
    icon: SiKakaotalk,
    placeholder: "https://talk.kakao.com/yourusername",
  },
  {
    value: "threads",
    label: "Threads",
    icon: SiThreads,
    placeholder: "https://threads.net/@yourusername",
  },
  {
    value: "mastodon",
    label: "Mastodon",
    icon: SiMastodon,
    placeholder: "https://mastodon.social/@yourusername",
  },
  {
    value: "behance",
    label: "Behance",
    icon: SiBehance,
    placeholder: "https://behance.net/yourprofile",
  },
  {
    value: "dribbble",
    label: "Dribbble",
    icon: SiDribbble,
    placeholder: "https://dribbble.com/yourprofile",
  },
  {
    value: "codepen",
    label: "CodePen",
    icon: SiCodepen,
    placeholder: "https://codepen.io/yourprofile",
  },
  {
    value: "gitlab",
    label: "GitLab",
    icon: SiGitlab,
    placeholder: "https://gitlab.com/yourusername",
  },
  {
    value: "leetcode",
    label: "LeetCode",
    icon: SiLeetcode,
    placeholder: "https://leetcode.com/yourusername",
  },
  {
    value: "hackerrank",
    label: "HackerRank",
    icon: SiHackerrank,
    placeholder: "https://hackerrank.com/yourusername",
  },
  {
    value: "web",
    label: "Web/Other",
    icon: Globe,
    placeholder: "https://yourwebsite.com",
  },
];

/**
 * Get the configuration for a specific social platform.
 */
export function getPlatformConfig(platform: SocialPlatform | undefined): SocialPlatformConfig | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.value === platform);
}

/**
 * Get the icon component for a specific social platform.
 */
export function getPlatformIcon(platform: SocialPlatform | undefined): React.ComponentType<{ className?: string }> {
  return getPlatformConfig(platform)?.icon ?? Globe;
}

/**
 * Get the human-readable label for a specific social platform.
 */
export function getPlatformLabel(platform: SocialPlatform | undefined): string {
  return getPlatformConfig(platform)?.label ?? "Link";
}
