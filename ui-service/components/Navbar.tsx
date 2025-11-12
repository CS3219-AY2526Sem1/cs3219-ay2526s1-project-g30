'use client'

import Link from 'next/link'
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
import { logout } from '@/app/actions/auth'
import type { User } from '@/types/auth'

interface NavbarProps {
  userProfile: User | null
}

interface NavbarWithoutPropsProps {
  userProfile?: User | null
}

function NavbarSkeleton() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="size-10 rounded-full bg-muted animate-pulse" />
      </div>
    </nav>
  )
}

interface UserMenuProps {
  user: User
}

function UserMenu({ user }: UserMenuProps) {
  const displayName = user.displayName || user.username
  const profileImageUrl = user.profilePictureUrl || null

  const handleLogout = async () => {
    await logout()
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
          <Avatar>
            <AvatarImage src={profileImageUrl || undefined} alt="User avatar" />
            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/profile/${user.username}`} className="flex cursor-pointer">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="size-10">
                  <AvatarImage
                    src={profileImageUrl || undefined}
                    alt="User avatar"
                  />
                  <AvatarFallback>
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-sm">
                  <p className="font-medium leading-none">{displayName}</p>
                  <p className="font-mono text-muted-foreground text-xs mt-1">
                    @{user.username}
                  </p>
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex cursor-pointer">
              <Settings />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Navbar({ userProfile }: NavbarProps) {
  if (!userProfile) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black">
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold text-white hover:opacity-80 transition-opacity"
        >
          PeerPrep
        </Link>

        <UserMenu user={userProfile} />
      </div>
    </nav>
  )
}
