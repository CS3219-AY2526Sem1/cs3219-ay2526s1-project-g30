'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatClientInstance, ChatMessage as ChatMessageType } from '@/lib/chatClient'
import { getUserAvatarUrl } from '@/lib/userProfileCache'
import { toast } from 'sonner'

interface UseChatMessagesParams {
  chatClient?: ChatClientInstance
  currentUserId?: string
  currentUsername?: string
}

export function useChatMessages({
  chatClient,
  currentUserId,
  currentUsername,
}: UseChatMessagesParams) {
   const messagesRef = useRef<ChatMessageType[]>([])
   const [displayedMessages, setDisplayedMessages] = useState<ChatMessageType[]>([])
  const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(new Set())
  const [chatError, setChatError] = useState<string | null>(null)
  const [isChatConnected, setIsChatConnected] = useState(false)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('')

  const chatClientRef = useRef(chatClient)
  const recentlySentRef = useRef<
    Map<string, { id: string; timestamp: number }>
  >(new Map())

  // Update client ref
  useEffect(() => {
    chatClientRef.current = chatClient
  }, [chatClient])

  // Load current user avatar
  useEffect(() => {
    if (!currentUsername) return

    getUserAvatarUrl(currentUsername)
      .then((avatarUrl) => {
        setCurrentUserAvatar(avatarUrl || '')
      })
      .catch((error) => {
        console.error('[Chat] Failed to fetch current user avatar:', error)
      })
  }, [currentUsername])

  // Wire chat client events
  useEffect(() => {
    if (!chatClientRef.current) {
      return
    }

    const client = chatClientRef.current

    client.setOnMessageReceived((message: ChatMessageType) => {
      const sendKey = `${message.username}:${message.content}`
      const sentInfo = recentlySentRef.current.get(sendKey)
 
      if (sentInfo && message.username === currentUsername) {
        const timeDiff = Date.now() - sentInfo.timestamp
        if (timeDiff < 2000) {
          // Treat this as the server ack for our optimistic message
           setDisplayedMessages((prev) => {
             const next = prev.map((msg) =>
               msg.id === sentInfo.id
                 ? { ...message, avatar: msg.avatar || message.avatar || '' }
                 : msg,
             )
             messagesRef.current = next
             return next
           })
          setSendingMessageIds((prev) => {
            const next = new Set(prev)
            next.delete(sentInfo.id)
            return next
          })
          recentlySentRef.current.delete(sendKey)
          return
        }
      }
 
      const messageId = message.id
       getUserAvatarUrl(message.username)
         .then((avatarUrl) => {
           setDisplayedMessages((prev) => {
             const next = prev.map((msg) =>
               msg.id === messageId ? { ...msg, avatar: avatarUrl || '' } : msg,
             )
             messagesRef.current = next
             return next
           })
         })
        .catch((error) => {
          console.error('[Chat] Failed to fetch avatar for', message.username, error)
        })
 
       setDisplayedMessages((prev) => {
         const next = [...prev, message]
         messagesRef.current = next
         return next
       })
    })

    client.setOnConnected(() => {
      setIsChatConnected(true)
      setChatError(null)
    })

    client.setOnConnectionClose(() => {
      setIsChatConnected(false)
    })

    client.setOnNotificationReceived((notification: string) => {
      toast.info(notification, { duration: 5000 })
    })

    client.setOnError((error: string) => {
      console.error('[Chat] Chat error:', error)
      setChatError(error)
      toast.error(error, { duration: 6000 })
    })

    client.connect()

    return () => {
      // Keep connection management at higher level; no disconnect here.
    }
  }, [currentUsername])

  const sendMessage = useCallback(
    (raw: string) => {
      const client = chatClientRef.current
      if (!client || !currentUserId || !currentUsername) return

      const content = raw.trim()
      if (!content) return

      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`
      const optimistic: ChatMessageType = {
        id: optimisticId,
        userId: currentUserId,
        username: currentUsername,
        content,
        timestamp: new Date(),
        avatar: currentUserAvatar,
      }

       setDisplayedMessages((prev) => {
         const next = [...prev, optimistic]
         messagesRef.current = next
         return next
       })
       setSendingMessageIds((prev) => {
         const next = new Set(prev)
         next.add(optimisticId)
         return next
       })

      const sendKey = `${currentUsername}:${content}`
      recentlySentRef.current.set(sendKey, {
        id: optimisticId,
        timestamp: Date.now(),
      })

      client.sendMessage(content)
    },
    [currentUserAvatar, currentUserId, currentUsername],
  )

  return {
    displayedMessages,
    sendingMessageIds,
    chatError,
    isChatConnected,
    sendMessage,
  }
}
