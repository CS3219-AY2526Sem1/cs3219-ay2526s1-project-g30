// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      key={viewId}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
