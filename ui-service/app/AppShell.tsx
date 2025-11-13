// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

import bgImage from '@/public/bg-rings.jpg'

export async function AppShell({ children }: { children: React.ReactNode }) {
  'use cache'

  return (
    <div
      className="relative h-screen flex flex-col bg-cover bg-no-repeat bg-center bg-fixed"
      style={{
        backgroundImage: `url(${bgImage.src})`,
        backgroundColor: 'hsl(var(--background))',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {children}
    </div>
  )
}
