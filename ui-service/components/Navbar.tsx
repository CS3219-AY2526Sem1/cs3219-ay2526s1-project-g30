'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { logout } from '@/app/actions/auth';
import type { User } from '@/types/auth';

interface NavbarProps {
  userProfile: User | null;
}

/**
 * Navbar Component that displays user profile information.
 * Data is passed as a prop from the server component parent.
 * This is a client component to handle dropdown interactions and logout.
 */
export function Navbar({ userProfile }: NavbarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Hydration: Set mounted flag after hydration to avoid Radix ID mismatches
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  if (!userProfile) {
    return null;
  }

  const displayName = userProfile.displayName || userProfile.username;
  const profileImageUrl = userProfile.profilePictureUrl || null;

  // Don't render Radix components until after hydration to avoid ID mismatches
  if (!isMounted) {
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black">
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-white hover:opacity-80 transition-opacity"
          >
            PeerPrep
          </Link>
          <div className="size-10 rounded-full bg-muted animate-pulse" />
        </div>
      </nav>
    );
  }

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
                <Link href={`/profile/${userProfile.username}`} className="flex cursor-pointer">
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
                      <p className="font-mono text-muted-foreground text-xs mt-1">@{userProfile.username}</p>
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
