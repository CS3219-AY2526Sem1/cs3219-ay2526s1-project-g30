'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCounter } from '@/hooks/use-counter'

export function useChatScroll(messageCount: number) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const lastProcessedCountRef = useRef<number | null>(null)
  const { count: newMessageCount, increment, reset } = useCounter(0)
  const incrementRef = useRef(increment)

  useLayoutEffect(() => {
    incrementRef.current = increment
  }, [increment])

  useLayoutEffect(() => {
    if (lastProcessedCountRef.current === null) {
      lastProcessedCountRef.current = messageCount
      return
    }

    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      lastProcessedCountRef.current = messageCount
      return
    }

    if (messageCount > lastProcessedCountRef.current) {
      const delta = messageCount - lastProcessedCountRef.current
      Promise.resolve().then(() => {
        for (let i = 0; i < delta; i += 1) {
          incrementRef.current()
        }
      })
      lastProcessedCountRef.current = messageCount
    }
  }, [messageCount, isScrolledToBottom])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setIsScrolledToBottom(atBottom)
    if (atBottom) {
      reset()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return {
    scrollAreaRef,
    messagesEndRef,
    isScrolledToBottom,
    newMessageCount,
    handleScroll,
    scrollToBottom,
    resetNewMessages: reset,
  }
}
