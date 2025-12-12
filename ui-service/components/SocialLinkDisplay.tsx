// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

import { SocialLink, getPlatformIcon, getPlatformLabel } from "@/types/social";
import { Button } from "@/components/ui/button";

interface SocialLinkDisplayProps {
  links: SocialLink[];
}

export function SocialLinkDisplay({ links }: SocialLinkDisplayProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const IconComponent = getPlatformIcon(link.platform);
        const label = getPlatformLabel(link.platform);

        return (
          <Button
            key={link.id}
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <IconComponent className="size-4" />
              {label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}
