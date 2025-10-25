'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'
import { CurrentUser } from '@/lib/useCurrentUser'
import { MOCK_USER } from '@/lib/mockData'
import { clearMockJWT } from '@/lib/mockAuth'

interface NavbarProps {
  currentUser?: CurrentUser
}

export function Navbar({ currentUser }: NavbarProps) {
  // Use mock user data if currentUser is not provided
  const user = currentUser ?? {
    id: MOCK_USER.id,
    username: MOCK_USER.username,
    displayName: MOCK_USER.displayName,
    profileImage: MOCK_USER.profileImage,
  }

  const router = useRouter()
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-white hover:opacity-80 transition-opacity"
        >
          PeerPrep
        </Link>

        {/* Right side - Avatar dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
              <Avatar>
                <AvatarImage src={user.profileImage || undefined} alt="User avatar" />
                <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info section */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.username}`} className="flex cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={user.profileImage || undefined}
                        alt="User avatar"
                      />
                      <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-sm">
                      <p className="font-medium leading-none">{user.displayName}</p>
                      <p className="font-mono text-muted-foreground text-xs mt-1">@{user.username}</p>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Separator */}
            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex cursor-pointer">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Separator */}
            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  // TODO: Replace mock logout with real logout Server Action
                  // Expected: POST /api/auth/logout (call from a Server Action)
                  // On success: clear auth token from cookies, redirect to login page
                  // Implementation: Create a Server Action that calls the logout endpoint,
                  // then redirect to /login
                  
                  // For now, use mock JWT flow:
                  console.log('[Navbar] Logging out...')
                  clearMockJWT()
                  console.log('[Navbar] Mock JWT cleared, redirecting to /login')
                  router.push('/login')
                }}
              >
                <LogOut />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
