// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑11-11
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

'use client'

import { useState } from 'react'
import type { ChatClientInstance } from '@/lib/chatClient'
import type { ChatMessage as ChatMessageType } from '@/lib/chatClient'
import { cn } from '@/lib/utils'
import { useChatMessages } from './chat/useChatMessages'
import { useChatScroll } from './chat/useChatScroll'
import { ChatMessagesList } from './chat/ChatMessagesList'
import { ChatInput } from './chat/ChatInput'
import { NewMessagesIndicator } from './chat/NewMessagesIndicator'

interface ChatPanelProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  messages?: ChatMessageType[]
  currentUserId?: string
  currentUsername?: string
  chatClient?: ChatClientInstance
}

export function ChatPanel({
  isOpen = true,
  onOpenChange,
  messages = [],
  currentUserId,
  currentUsername,
  chatClient,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')

  const { displayedMessages, sendingMessageIds, chatError, isChatConnected, sendMessage } =
    useChatMessages({ chatClient, currentUserId, currentUsername })

  const {
    scrollAreaRef,
    messagesEndRef,
    isScrolledToBottom,
    newMessageCount,
    handleScroll,
    scrollToBottom,
  } = useChatScroll(displayedMessages.length)

  const disabled = !isChatConnected || !!chatError

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col border-l border-border bg-background overflow-hidden',
      )}
    >
      {chatError && (
        <div className="shrink-0 border-b border-destructive bg-destructive/10 px-4 py-2">
          <p className="text-xs text-destructive">{chatError}</p>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessagesList
          messages={displayedMessages}
           sendingMessageIds={sendingMessageIds}
           currentUserId={currentUserId}
           currentUsername={currentUsername}
           chatError={chatError}
           scrollAreaRef={scrollAreaRef}
          messagesEndRef={messagesEndRef}
          onScroll={handleScroll}
        />

        <NewMessagesIndicator
          count={newMessageCount}
          visible={!isScrolledToBottom}
          onClick={() => {
            scrollToBottom()
          }}
        />

        <ChatInput
          value={inputValue}
          onValueChange={setInputValue}
          onSend={sendMessage}
          disabled={disabled}
          chatError={chatError}
        />
      </div>
    </div>
  )
}
