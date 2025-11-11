'use client'

import { useMemo } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  isCurrentUser?: boolean
  avatar?: string
  isSending?: boolean
}

export function ChatMessage({
  id,
  userId,
  username,
  content,
  timestamp,
  isCurrentUser,
  avatar,
  isSending,
}: ChatMessageProps) {
  const formattedTime = useMemo(() => {
    if (isSending) return 'Sending...'

    const date = new Date(timestamp)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }, [timestamp, isSending])

  return (
    <div className={cn('flex gap-2 w-full', isCurrentUser && 'justify-end')}>
      <div className={cn('flex flex-col gap-2 w-fit', isCurrentUser && 'items-end')}>
        <div className={cn('flex items-center gap-2', isCurrentUser && 'justify-end')}>
          {isCurrentUser ? (
            <>
              <span
                className="text-xs text-primary/70 flex items-center align-middle gap-1"
                suppressHydrationWarning
              >
                {isSending && <Spinner className="size-3" />}
                {formattedTime}
              </span>
              <span className="text-sm font-medium flex items-center align-middle">You</span>
              <Avatar className="size-6 flex items-center justify-center align-middle">
                <AvatarFallback className="text-xs">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <Avatar className="size-6 flex items-center justify-center align-middle">
                <AvatarFallback className="text-xs">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium flex items-center align-middle">{username}</span>
              <span
                className="text-xs text-muted-foreground flex items-center align-middle"
                suppressHydrationWarning
              >
                {formattedTime}
              </span>
            </>
          )}
        </div>
        <div
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            isCurrentUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
            isSending && 'opacity-60'
          )}
        >
          {content}
        </div>
      </div>
    </div>
  )
}
