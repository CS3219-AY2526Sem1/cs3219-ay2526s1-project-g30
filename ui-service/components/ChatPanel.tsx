'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { ChevronDown, Send, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCounter } from '@/hooks/use-counter'
import { cn } from '@/lib/utils'
import { ChatMessage } from '@/components/ChatMessage'

interface ChatMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  messages?: ChatMessage[]
  currentUserId?: string
}

export function ChatPanel({
  isOpen = true,
  onOpenChange,
  messages = [],
  currentUserId = 'user2',
}: ChatPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(!isOpen)
  const [inputValue, setInputValue] = useState('')
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>(messages)
  const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(new Set())
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const { count: newMessageCount, increment: incrementNewMessages, reset: resetNewMessages } = useCounter(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    onOpenChange?.(!isCollapsed)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = element
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsScrolledToBottom(isAtBottom)

    if (isAtBottom) {
      resetNewMessages()
    }
  }

  const lastProcessedMessageCountRef = useRef<number | null>(null)
  const incrementNewMessagesRef = useRef(incrementNewMessages)

  // Update the ref whenever the function changes
  useLayoutEffect(() => {
    incrementNewMessagesRef.current = incrementNewMessages
  }, [incrementNewMessages])

  useLayoutEffect(() => {
    // Initialize on first mount only
    if (lastProcessedMessageCountRef.current === null) {
      lastProcessedMessageCountRef.current = displayedMessages.length
      return
    }

    if (isScrolledToBottom) {
      scrollToBottom()
      lastProcessedMessageCountRef.current = displayedMessages.length
    } else {
      // Check if there are new messages we haven't counted yet
      if (displayedMessages.length > lastProcessedMessageCountRef.current) {
        const newMessageCountToAdd = displayedMessages.length - lastProcessedMessageCountRef.current
        
        // Schedule the increments to avoid double-execution in StrictMode
        Promise.resolve().then(() => {
          for (let i = 0; i < newMessageCountToAdd; i++) {
            incrementNewMessagesRef.current()
          }
        })
        
        // Mark these messages as processed
        lastProcessedMessageCountRef.current = displayedMessages.length
      }
    }
  }, [displayedMessages.length, isScrolledToBottom])

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault()
    if (inputValue.trim()) {
      const messageId = `msg-${Date.now()}`
      const newMessage: ChatMessage = {
        id: messageId,
        userId: currentUserId,
        username: 'You',
        content: inputValue,
        timestamp: new Date(),
      }
      setDisplayedMessages([...displayedMessages, newMessage])
      setSendingMessageIds((prev) => new Set([...prev, messageId]))
      setInputValue('')
      setIsScrolledToBottom(true)
      resetNewMessages()

      // Simulate sending delay (remove from sending state after 1 second)
      setTimeout(() => {
        setSendingMessageIds((prev) => {
          const updated = new Set(prev)
          updated.delete(messageId)
          return updated
        })
      }, 1000)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter allows new line (default textarea behaviour)
        return
      }
      // Enter sends the message
      event.preventDefault()
      if (inputValue.trim()) {
        const messageId = `msg-${Date.now()}`
        const newMessage: ChatMessage = {
          id: messageId,
          userId: currentUserId,
          username: 'You',
          content: inputValue,
          timestamp: new Date(),
        }
        setDisplayedMessages([...displayedMessages, newMessage])
        setSendingMessageIds((prev) => new Set([...prev, messageId]))
        setInputValue('')
        setIsScrolledToBottom(true)
        resetNewMessages()

        // Simulate sending delay (remove from sending state after 1 second)
        setTimeout(() => {
          setSendingMessageIds((prev) => {
            const updated = new Set(prev)
            updated.delete(messageId)
            return updated
          })
        }, 1000)
      }
    }
  }

  const mockReceiveMessage = () => {
    const mockMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: 'user1',
      username: 'Alice',
      content: 'This is a mock message from the other user!',
      timestamp: new Date(),
    }
    setDisplayedMessages([...displayedMessages, mockMessage])
    // Don't call incrementNewMessages here - let the effect handle it
  }

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Chat</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={mockReceiveMessage}
            aria-label="Mock receive message"
            title="Mock receiving a message"
          >
            <Send className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      {!isCollapsed && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div 
            className="flex-1 overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="flex flex-col gap-3 items-start px-2 py-4 w-full">
              {displayedMessages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                displayedMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    id={message.id}
                    userId={message.userId}
                    username={message.username}
                    content={message.content}
                    timestamp={message.timestamp}
                    avatar={message.avatar}
                    isCurrentUser={currentUserId === message.userId}
                    isSending={sendingMessageIds.has(message.id)}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* New Messages Button - Floating above input */}
          <div className="relative h-0 overflow-visible flex justify-center pointer-events-none z-10">
            <AnimatePresence>
              {newMessageCount > 0 && !isScrolledToBottom && (
                <motion.div
                  className="absolute bottom-4 flex justify-center pointer-events-none"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setIsScrolledToBottom(true)
                      resetNewMessages()
                    }}
                    className="pointer-events-auto shadow-md"
                  >
                    <ChevronDownIcon className="size-4 mr-1" />
                    {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area - Sticky to Bottom */}
          <div className="shrink-0 border-t border-border px-2 py-3">
            <form onSubmit={handleSendMessage}>
              <InputGroup>
                <InputGroupTextarea
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                  rows={1}
                />
                <InputGroupAddon align="block-end" className="justify-end">
                  <TooltipProvider>
                    <Tooltip delayDuration={500}>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          size="icon-xs"
                          variant="default"
                          type="submit"
                          disabled={!inputValue.trim()}
                          aria-label="Send message"
                        >
                          <Send className="size-3.5" />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4}>
                        Send
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
