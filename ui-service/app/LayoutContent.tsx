import { Toaster } from 'sonner'
import { LayoutContentClient } from './LayoutContentClient'
import { getUserProfile } from '@/app/actions/auth'
import bgImage from '@/public/bg-rings.jpg'

export async function LayoutContent({ children }: { children: React.ReactNode }) {
  // Fetch user profile server-side to pass to Navbar
  let userProfile = null
  try {
    // Try to fetch user profile - will fail if not authenticated
    userProfile = await getUserProfile()
  } catch (error) {
    // User not authenticated or error fetching profile - Navbar will be hidden
    // This is expected for unauthenticated users
  }

  return (
    <div
      className="relative h-screen flex flex-col bg-cover bg-no-repeat bg-center bg-fixed"
      style={{ backgroundImage: `url(${bgImage.src})`, backgroundColor: 'hsl(var(--background))', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
    >
      <LayoutContentClient userProfile={userProfile}>
        {children}
      </LayoutContentClient>
      <Toaster />
    </div>
  )
}
