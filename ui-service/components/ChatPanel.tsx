'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { Send, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
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
import { getUserAvatarUrl } from '@/lib/userProfileCache'
import { ChatMessage } from '@/components/ChatMessage'
import type { ChatClientInstance, ChatMessage as ChatMessageType } from '@/lib/chatClient'

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
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessageType[]>(messages)
  const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(new Set())
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const [isChatConnected, setIsChatConnected] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('')
  const { count: newMessageCount, increment: incrementNewMessages, reset: resetNewMessages } = useCounter(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatClientRef = useRef(chatClient)
  // Track recently sent message IDs so we can clear sending state when echo-back arrives
  const recentlySentRef = useRef<Map<string, { id: string; timestamp: number }>>(new Map())

  // Update chat client ref when it changes
  useEffect(() => {
    chatClientRef.current = chatClient
  }, [chatClient])

  // Fetch current user's avatar
  useEffect(() => {
    if (!currentUsername) {
      return
    }
    
    getUserAvatarUrl(currentUsername)
      .then((avatarUrl) => {
        setCurrentUserAvatar(avatarUrl || '')
      })
      .catch((error) => {
        console.error('[ChatPanel] Failed to fetch current user avatar:', error)
      })
  }, [currentUsername])

  // Set up chat client connection and message listeners
  useEffect(() => {
    if (!chatClient) {
      console.log('[ChatPanel] No chat client provided')
      return
    }

    // Handle incoming messages from chat service
    chatClient.setOnMessageReceived((message: ChatMessageType) => {
      console.log('[ChatPanel] Received message from:', message.username)
      
      // Check if this is an echo-back of our message (compare against USERNAME, not userId)
      const sendKey = `${currentUsername}:${message.content}`
      const sentInfo = recentlySentRef.current.get(sendKey)
      
      if (sentInfo && message.username === currentUsername) {
        // This looks like an echo-back of our message
        const timeDiff = Date.now() - sentInfo.timestamp
        if (timeDiff < 2000) {
          // Clear the sending state for this message
          console.log('[ChatPanel] Received echo-back, clearing sending state for:', sentInfo.id)
          setSendingMessageIds((prev) => {
            const newIds = new Set(prev)
            newIds.delete(sentInfo.id)
            return newIds
          })
          // Clean up the tracking
          recentlySentRef.current.delete(sendKey)
          return
        }
      }
      
      // Fetch avatar URL asynchronously and update the message
      const messageId = message.id
      getUserAvatarUrl(message.username).then((avatarUrl) => {
        setDisplayedMessages((prev) => 
          prev.map((msg) => 
            msg.id === messageId ? { ...msg, avatar: avatarUrl || '' } : msg
          )
        )
      }).catch((error) => {
        console.error('[ChatPanel] Failed to fetch avatar for', message.username, error)
        // Still add the message even if avatar fetch fails
      })
      
      // Add the message immediately without avatar, it will be updated when avatar is fetched
      setDisplayedMessages((prev) => [...prev, message])
    })

    // Track connection state
    chatClient.setOnConnected(() => {
      setIsChatConnected(true)
      setChatError(null)
      console.log('[ChatPanel] Chat connected')
    })

    chatClient.setOnConnectionClose(() => {
      setIsChatConnected(false)
      console.log('[ChatPanel] Chat disconnected')
    })

    // Handle notifications from other users (e.g., user joined, user left)
    chatClient.setOnNotificationReceived((notification: string) => {
      console.log('[ChatPanel] Notification:', notification)
      toast.info(notification, { duration: 5000 })
    })

    // Handle errors
    chatClient.setOnError((error: string) => {
      console.error('[ChatPanel] Chat error:', error)
      setChatError(error)
      toast.error(error, { duration: 6000 })
    })

    // Connect to chat
    chatClient.connect()

    // Cleanup: don't disconnect on unmount since the chat might still be needed
    return () => {
      // Keep connection alive
    }
  }, [chatClient, currentUserId, currentUsername])

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

  const handleSendMessage = useCallback((event: React.FormEvent) => {
    event.preventDefault()
    if (inputValue.trim() && chatClientRef.current && currentUserId && currentUsername) {
      // Optimistically add message to display immediately
      const messageContent = inputValue.trim()
      const optimisticMessageId = `optimistic-${Date.now()}-${Math.random()}`
      const optimisticMessage: ChatMessageType = {
        id: optimisticMessageId,
        userId: currentUserId,
        username: currentUsername,
        content: messageContent,
        timestamp: new Date(),
        avatar: currentUserAvatar,
      }
      
      setDisplayedMessages((prevMessages) => [...prevMessages, optimisticMessage])
      
      // Track this as a sent message to avoid duplicates when server echoes it back
      setSendingMessageIds((prev) => new Set([...prev, optimisticMessageId]))
      
      // Also track in ref for deduplication on receipt (use USERNAME for server comparison)
      const sendKey = `${currentUsername}:${messageContent}`
      recentlySentRef.current.set(sendKey, {
        id: optimisticMessageId,
        timestamp: Date.now(),
      })
      
      // Send message via chat client
      chatClientRef.current.sendMessage(messageContent)
      setInputValue('')
      setIsScrolledToBottom(true)
      resetNewMessages()
    }
  }, [inputValue, resetNewMessages, currentUserId, currentUsername, currentUserAvatar])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter allows new line (default textarea behaviour)
        return
      }
      // Enter sends the message
      event.preventDefault()
      if (inputValue.trim() && chatClientRef.current && currentUserId && currentUsername) {
        const messageContent = inputValue.trim()
        const optimisticMessageId = `optimistic-${Date.now()}-${Math.random()}`
        // Optimistically add message to display immediately
        const optimisticMessage: ChatMessageType = {
          id: optimisticMessageId,
          userId: currentUserId,
          username: currentUsername,
          content: messageContent,
          timestamp: new Date(),
          avatar: currentUserAvatar,
        }
        
        setDisplayedMessages((prevMessages) => [...prevMessages, optimisticMessage])
        
        // Track this as a sent message to avoid duplicates when server echoes it back
        setSendingMessageIds((prev) => new Set([...prev, optimisticMessageId]))
        
        // Also track in ref for deduplication on receipt (use USERNAME for server comparison)
        const sendKey = `${currentUsername}:${messageContent}`
        recentlySentRef.current.set(sendKey, {
          id: optimisticMessageId,
          timestamp: Date.now(),
        })
        
        chatClientRef.current.sendMessage(messageContent)
        setInputValue('')
        setIsScrolledToBottom(true)
        resetNewMessages()
      }
    }
  }, [inputValue, resetNewMessages, currentUserId, currentUsername, currentUserAvatar])

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-background overflow-hidden">
      {/* Messages Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {chatError && (
            <div className="shrink-0 border-b border-destructive bg-destructive/10 px-4 py-2">
              <p className="text-xs text-destructive">{chatError}</p>
            </div>
          )}
          <div 
            className="flex-1 overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="flex flex-col gap-3 items-start px-2 py-4 w-full h-full">
              {displayedMessages.length === 0 ? (
                <div className="flex items-center justify-center w-full h-full">
                  <p className="text-sm text-muted-foreground">
                    {chatError ? 'Connection error - messages unavailable' : 'No messages yet'}
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
                  placeholder={chatError ? 'Connection error...' : 'Type a message...'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                  rows={1}
                  disabled={!isChatConnected || !!chatError}
                />
                <InputGroupAddon align="block-end" className="justify-end">
                  <TooltipProvider>
                    <Tooltip delayDuration={500}>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          size="icon-xs"
                          variant="default"
                          type="submit"
                          disabled={!inputValue.trim() || !isChatConnected || !!chatError}
                          aria-label="Send message"
                        >
                          <Send className="size-3.5" />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4}>
                        {!isChatConnected ? 'Connecting...' : chatError ? 'Connection error' : 'Send'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        </div>
    </div>
  )
}
