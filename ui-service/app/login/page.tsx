// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on specifications and API requirements.
// Author review: Validated correctness, fixed bugs

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginContent } from './LoginContent';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const resetKey = searchParams.get('reset') === 'true' ? 'reset' : 'normal';
  
  return <LoginContent key={resetKey} />;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

