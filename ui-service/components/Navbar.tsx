'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';
import { logout, getUserProfile } from '@/app/actions/auth';
import type { User } from '@/types/auth';

/**
 * Navbar Component that fetches and displays user profile information.
 * Uses server actions to securely fetch user data while remaining a client component
 * to handle conditional rendering based on route.
 */
export function Navbar() {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch user profile on mount using server action
    startTransition(async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  if (isLoading || !userProfile) {
    return null;
  }

  const displayName = userProfile.username;
  const profileImageUrl = userProfile.profilePictureUrl || null;

  const handleLogout = async () => {
    await logout();
  };

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
                <AvatarImage src={profileImageUrl || undefined} alt="User avatar" />
                <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info section */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/profile/${displayName}`} className="flex cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={profileImageUrl || undefined}
                        alt="User avatar"
                      />
                      <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-sm">
                      <p className="font-medium leading-none">{displayName}</p>
                      <p className="font-mono text-muted-foreground text-xs mt-1">@{displayName}</p>
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
                onClick={handleLogout}
              >
                <LogOut />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
