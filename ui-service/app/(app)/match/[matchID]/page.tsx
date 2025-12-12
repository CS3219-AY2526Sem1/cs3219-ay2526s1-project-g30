// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-31
// Scope: Generated implementation based on API requirements and component specifications.
// Author review: Validated correctness, fixed bugs

'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ChatClientInstance } from '@/lib/chatClient'
import { createChatClient } from '@/lib/chatClient'
import { config } from '@/lib/config'
import { getCurrentSessionUser, terminateCollaborativeSession } from '@/app/actions/matching'
import { setupYJS } from '@/lib/yjs-setup'
import { MatchLayout } from './MatchLayout'
import { useMatchParams } from './useMatchParams'
import { useMatchQuestion } from './useMatchQuestion'
import { useNavigationGuards } from './useNavigationGuards'

interface MatchPageProps {
  params: Promise<{ matchID: string }>
}

export default function MatchPage({ params }: MatchPageProps) {
  const router = useRouter()
  const { sessionId, questionId, programmingLanguage } = useMatchParams(params)
  const { question, isLoading, error } = useMatchQuestion(questionId)

  const [isEditorOnLeft, setIsEditorOnLeft] = useState(true)
  const [isVerticalSplit, setIsVerticalSplit] = useState(false)
  const [textSize, setTextSize] = useState(14)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isNavigationConfirmOpen, setIsNavigationConfirmOpen] = useState(false)
  const [isSessionTerminating, setIsSessionTerminating] = useState(false)

  const yjsInstanceRef = useRef<any>(null)
  const editorRef = useRef<any>(null)
  const isTerminatingRef = useRef(false)
  const chatClientRef = useRef<ChatClientInstance | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [chatClientState, setChatClientState] = useState<ChatClientInstance | null>(null)
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const hasActiveSession = useCallback(
    () => Boolean(sessionId && yjsInstanceRef.current && !isSessionTerminating),
    [sessionId, isSessionTerminating]
  )

  useNavigationGuards({ router, hasActiveSession, isTerminatingRef })

  const handleEditorReady = useCallback(
    async (editor: any, monaco: any) => {
      editorRef.current = editor
      setEditorInstance(editor)

      if (!sessionId) {
        console.log('[Match Page] Skipping YJS init - no session ID')
        return
      }

      try {
        const currentUser = await getCurrentSessionUser()
        if (!currentUser) {
          console.warn('[Match Page] Could not get current user for YJS')
          return
        }

        console.log('[Match Page] Initializing YJS with user:', currentUser)

        const yjsInstance = await setupYJS({
          sessionId,
          userId: currentUser.userId,
          editor,
          monaco,
          language: programmingLanguage,
          username: currentUser.username,
          onSessionTerminated: () => {
            console.log('[Match Page] Session terminated by other user')
            isTerminatingRef.current = true
            setIsSessionTerminating(true)
            toast.info('Session ended by other user', { duration: 6000 })
            router.push('/home')
          },
          onError: (message: string) => {
            if (isTerminatingRef.current) {
              console.log('[Match Page] Suppressing YJS error during termination:', message)
              return
            }
            console.error('[Match Page] YJS Error:', message)
            toast.error(message, { duration: 6000 })
          },
        })

        yjsInstanceRef.current = yjsInstance
        console.log('[Match Page] YJS initialized successfully')
      } catch (error) {
        console.error('[Match Page] Failed to initialize YJS:', error)
        toast.error('Failed to initialize collaborative editing', { duration: 6000 })
      }
    },
    [sessionId, programmingLanguage, router]
  )

  const initializeChat = useCallback(async () => {
    if (!sessionId || chatClientRef.current) return

    try {
      const currentUser = await getCurrentSessionUser()
      if (!currentUser) {
        console.warn('[Match Page] Could not get current user for chat')
        return
      }

      setCurrentUserId(currentUser.userId)
      setCurrentUsername(currentUser.username)

      console.log('[Match Page] Initializing chat with user:', currentUser)

      const chatClient = createChatClient({
        sessionId,
        userId: currentUser.userId,
        username: currentUser.username,
        wsUrl: config.collaborationService.wsUrl,
        onConnected: () => {
          console.log('[Match Page] Chat connected')
          toast.success('Chat connected', { duration: 3000 })
        },
        onNotificationReceived: (notification: string) => {
          console.log('[Match Page] Chat notification:', notification)
          toast.info(notification, { duration: 5000 })
        },
        onError: (err: string) => {
          if (!isTerminatingRef.current) {
            console.error('[Match Page] Chat error:', err)
            toast.error(err, { duration: 6000 })
          }
        },
        onConnectionClose: () => {
          console.log('[Match Page] Chat connection closed')
          if (!isTerminatingRef.current) {
            toast.warning('Chat disconnected', { duration: 5000 })
          }
        },
      })

      chatClientRef.current = chatClient
      setChatClientState(chatClient)
      console.log('[Match Page] Chat client created')
    } catch (error) {
      console.error('[Match Page] Failed to initialize chat:', error)
      toast.error('Failed to initialize chat', { duration: 6000 })
    }
  }, [sessionId])

  const handleSwapPanels = useCallback(() => {
    setIsEditorOnLeft((prev) => !prev)
  }, [])

  const handleToggleSplitDirection = useCallback(() => {
    setIsVerticalSplit((prev) => !prev)
  }, [])

  const handleEndSession = useCallback(async () => {
    try {
      isTerminatingRef.current = true
      setIsSessionTerminating(true)

      if (yjsInstanceRef.current) {
        yjsInstanceRef.current.cleanup()
        yjsInstanceRef.current = null
      }

      if (chatClientRef.current) {
        chatClientRef.current.cleanup()
        chatClientRef.current = null
      }
      setChatClientState(null)

      const currentUser = await getCurrentSessionUser()
      if (currentUser && sessionId) {
        try {
          const result = await terminateCollaborativeSession(sessionId, currentUser.userId)
          if (result.success) {
            console.log('[Match Page] Session terminated on collab service')
          } else {
            console.error('[Match Page] Failed to terminate session on collab service:', result.error)
          }
        } catch (error) {
          console.error('[Match Page] Failed to call terminate action:', error)
        }
      }

      toast.info('Session ended', { duration: 6000 })
      router.push('/home')
    } catch (error) {
      console.error('[Match Page] Error ending session:', error)
      toast.error('Failed to end session properly', { duration: 6000 })
    }
  }, [sessionId, router])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (yjsInstanceRef.current) {
      yjsInstanceRef.current.cleanup()
      yjsInstanceRef.current = null
    }
    if (chatClientRef.current) {
      chatClientRef.current.cleanup()
      chatClientRef.current = null
    }
  }, [])

  const difficultyDisplay = question
    ? (question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)) as
        | 'Easy'
        | 'Medium'
        | 'Hard'
    : 'Easy'

  const languageDisplayName = programmingLanguage
    ? programmingLanguage.charAt(0).toUpperCase() + programmingLanguage.slice(1)
    : 'JavaScript'

  return (
    <MatchLayout
      isLoadingQuestion={isLoading}
      questionError={error}
      question={question}
      programmingLanguage={programmingLanguage}
      difficultyDisplay={difficultyDisplay}
      languageDisplayName={languageDisplayName}
      isEditorOnLeft={isEditorOnLeft}
      isVerticalSplit={isVerticalSplit}
      textSize={textSize}
      isChatVisible={isChatVisible}
      currentUserId={currentUserId}
      currentUsername={currentUsername}
      chatClient={chatClientState}
       editorRef={editorRef}
       editorInstance={editorInstance}
      onEditorReady={(editor, monaco) => {
        handleEditorReady(editor, monaco)
        void initializeChat()
      }}
      onSwapPanels={handleSwapPanels}
      onToggleSplitDirection={handleToggleSplitDirection}
      onTextSizeChange={setTextSize}
      onToggleChatVisibility={() => setIsChatVisible((prev) => !prev)}
      isNavigationConfirmOpen={isNavigationConfirmOpen}
      onNavigationConfirmOpenChange={setIsNavigationConfirmOpen}
      onConfirmEndSession={handleEndSession}
    />
  )
}
