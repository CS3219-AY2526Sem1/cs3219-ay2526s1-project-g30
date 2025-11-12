'use client'

import { ChatMessage } from '@/components/ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/lib/chatClient'

interface ChatMessagesListProps {
  messages: ChatMessageType[]
  sendingMessageIds: Set<string>
  currentUserId?: string
  currentUsername?: string
  chatError?: string | null
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

export function ChatMessagesList({
  messages,
  sendingMessageIds,
   currentUserId,
   currentUsername,
   chatError,
   scrollAreaRef,
   messagesEndRef,
   onScroll,
}: ChatMessagesListProps) {
  return (
    <div
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto"
      onScroll={onScroll}
    >
      <div className="flex flex-col gap-3 items-start px-2 py-4 w-full h-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-sm text-muted-foreground">
              {chatError ? 'Connection error - messages unavailable' : 'No messages yet'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              id={message.id}
              userId={message.userId}
              username={message.username}
              content={message.content}
              timestamp={message.timestamp}
               avatar={message.avatar}
               isCurrentUser={
                 (currentUserId != null && message.userId === currentUserId) ||
                 (currentUsername != null && message.username === currentUsername)
               }
               isSending={sendingMessageIds.has(message.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
