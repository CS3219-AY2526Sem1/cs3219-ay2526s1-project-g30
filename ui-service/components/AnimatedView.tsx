// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

import { ReactNode } from 'react';

interface ViewContentProps {
  viewId: string;
  direction?: 'forward' | 'backward';
  isActive: boolean;
  children: ReactNode;
}

export function ViewContent({
  viewId,
  direction = 'forward',
  isActive,
  children,
}: ViewContentProps) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}
