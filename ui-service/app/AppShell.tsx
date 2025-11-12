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
