'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { StatusBar } from '@/components/StatusBar'
import { EditorToolbar } from '@/components/EditorToolbar'
import { CodeEditor } from '@/components/CodeEditor'
import { QuestionPanel } from '@/components/QuestionPanel'
import { ChatPanel } from '@/components/ChatPanel'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { EndSessionDialog } from '@/components/EndSessionDialog'
import { Spinner } from '@/components/ui/spinner'
import type { Question } from '@/lib/questionServiceClient'
import { setupYJS } from '@/lib/yjs-setup'
import { createChatClient } from '@/lib/chatClient'
import { config } from '@/lib/config'
import type { ChatClientInstance } from '@/lib/chatClient'
import { getCurrentSessionUser, terminateCollaborativeSession, fetchQuestionAction } from '@/app/actions/matching'
import { toast } from 'sonner'

// Map programming language names from matching service to Monaco editor language IDs
const LANGUAGE_MAP: Record<string, string> = {
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'c++': 'cpp',
  'cpp': 'cpp',
  'c': 'c',
  'go': 'go',
  'rust': 'rust',
  'typescript': 'typescript',
  'ruby': 'ruby',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'php': 'php',
  'csharp': 'csharp',
  'c#': 'csharp',
}

// Map language to display name for status bar
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  'javascript': 'JavaScript',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c': 'C',
  'go': 'Go',
  'rust': 'Rust',
  'typescript': 'TypeScript',
  'ruby': 'Ruby',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'php': 'PHP',
  'csharp': 'C#',
}

interface MatchPageProps {
  params: Promise<{ matchID: string }>
}

export default function MatchPage({ params }: MatchPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [programmingLanguage, setProgrammingLanguage] = useState<string>('javascript')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true)
  const [questionError, setQuestionError] = useState<string | null>(null)

  const [isEditorOnLeft, setIsEditorOnLeft] = useState(true)
  const [isVerticalSplit, setIsVerticalSplit] = useState(false)
  const [textSize, setTextSize] = useState(14)
  const [isNavigationConfirmOpen, setIsNavigationConfirmOpen] = useState(false)
  const [isSessionTerminating, setIsSessionTerminating] = useState(false)

  const yjsInstanceRef = useRef<any>(null)
  const editorRef = useRef<any>(null)
  const isTerminatingRef = useRef(false)
  const chatClientRef = useRef<ChatClientInstance | null>(null)

  // Extract sessionId from URL params and questionId + language from search params
  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      const sid = resolvedParams.matchID
      const qid = searchParams.get('questionID')
      const lang = searchParams.get('language')

      console.log('[Match Page] Loading params:', {
        sessionId: sid,
        questionId: qid,
        language: lang,
        timestamp: new Date().toISOString(),
      })

      if (!sid || !qid) {
        toast.error('Invalid match URL - missing session or question ID', { duration: 5000 })
        router.push('/home')
        return
      }

      setSessionId(sid)
      setQuestionId(qid)
      
      if (lang) {
        const monacoLang = LANGUAGE_MAP[lang.toLowerCase()] || 'javascript'
        setProgrammingLanguage(monacoLang)
      }
    }

    loadParams()
  }, [params, searchParams, router])

  // Fetch question data when questionId is available
  useEffect(() => {
    if (!questionId) return

    async function loadQuestion() {
      setIsLoadingQuestion(true)
      setQuestionError(null)

      console.log('[Match Page] Starting to fetch question:', {
        questionId,
        questionIdType: typeof questionId,
        questionIdLength: questionId?.length,
      })

      try {
        const result = await fetchQuestionAction(questionId!)
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch question')
        }

        setQuestion(result.data)
        console.log('[Match Page] Question loaded successfully:', {
          title: result.data.title,
          difficulty: result.data.difficulty,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load question'
        console.error('[Match Page] Failed to load question:', {
          error,
          errorMessage,
          questionId,
        })
        setQuestionError(errorMessage)
        toast.error(errorMessage, { duration: 6000 })
      } finally {
        setIsLoadingQuestion(false)
      }
    }

    loadQuestion()
  }, [questionId])

  // Set up navigation guard to prevent accidental leaving
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Show browser's native confirmation dialog
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Set up in-app navigation guard by intercepting link clicks and router navigation
  useEffect(() => {
    // Store the original push method
    const originalPush = router.push;

    // Override router.push to show our confirmation dialog
    (router as any).push = (href: any) => {
      // Don't block if session is already terminating or if there's no YJS instance
      if (isTerminatingRef.current || !yjsInstanceRef.current) {
        return (originalPush as any).call(router, href);
      }
      // Show our custom dialog
      console.log('[Match Page] Intercepted router.push:', href);
      setIsNavigationConfirmOpen(true);
      // Don't actually navigate - let the dialog handle it
      return Promise.resolve();
    };

    // Clean up by restoring the original method
    return () => {
      (router as any).push = originalPush;
    };
  }, [router]);

    // Intercept link clicks (for Navbar and other Link components)
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      
      // Only intercept if we have an active session and session is not terminating
      if (!target || isTerminatingRef.current || !yjsInstanceRef.current) {
        return;
      }

      // Get the href and check if it's a navigation link (not a hash link or external)
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) {
        return;
      }

      // Prevent default navigation
      event.preventDefault();
      event.stopPropagation();
      
      // Show confirmation dialog
      console.log('[Match Page] Intercepted link click:', href);
      setIsNavigationConfirmOpen(true);
    };

    // Also handle logout button click (DropdownMenuItem with logout action)
    const handleDropdownItemClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[role="menuitem"]');
      
      // Only intercept if we have an active session and session is not terminating
      if (!target || isTerminatingRef.current || !yjsInstanceRef.current) {
        return;
      }

      // Check if this is a logout/destructive menu item
      const isDestructiveItem = target.getAttribute('data-variant') === 'destructive' || 
                                target.textContent?.toLowerCase().includes('log out') ||
                                target.textContent?.toLowerCase().includes('logout');
      
      if (!isDestructiveItem) {
        return;
      }

      // Prevent default action
      event.preventDefault();
      event.stopPropagation();
      
      // Show confirmation dialog
      console.log('[Match Page] Intercepted logout attempt');
      setIsNavigationConfirmOpen(true);
    };

    document.addEventListener('click', handleLinkClick, true);
    document.addEventListener('click', handleDropdownItemClick, true);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('click', handleDropdownItemClick, true);
    };
  }, []);

  // Initialize YJS collaborative editing when editor is ready
  const handleEditorReady = useCallback(
    async (editor: any, monaco: any) => {
      editorRef.current = editor;

      // Don't initialize YJS if we don't have a session ID yet
      if (!sessionId) {
        console.log('[Match Page] Skipping YJS init - no session ID');
        return;
      }

      try {
        // Get current user info
        const currentUser = await getCurrentSessionUser();
        if (!currentUser) {
          console.warn('[Match Page] Could not get current user for YJS');
          return;
        }

        console.log('[Match Page] Initializing YJS with user:', currentUser);

        // Set up YJS collaborative editing (async because of dynamic imports)
        const yjsInstance = await setupYJS({
          sessionId,
          userId: currentUser.userId,
          editor,
          monaco,
          language: programmingLanguage,
          username: currentUser.username,
          onSessionTerminated: () => {
            console.log('[Match Page] Session terminated by other user');
            // Set ref immediately to prevent showing confirmation dialog or errors
            isTerminatingRef.current = true;
            setIsSessionTerminating(true);
            toast.info('Session ended by other user', { duration: 6000 });
            router.push('/home');
          },
          onError: (message: string) => {
            // Don't show error toasts if session is already terminating
            if (isTerminatingRef.current) {
              console.log('[Match Page] Suppressing YJS error during termination:', message);
              return;
            }
            console.error('[Match Page] YJS Error:', message);
            toast.error(message, { duration: 6000 });
          },
        });

        yjsInstanceRef.current = yjsInstance;
        console.log('[Match Page] YJS initialized successfully');
      } catch (error) {
        console.error('[Match Page] Failed to initialize YJS:', error);
        toast.error('Failed to initialize collaborative editing', { duration: 6000 });
      }
    },
    [sessionId, programmingLanguage, router]
  );

  // Initialize chat client when session ID and user are available
  // Initialize chat client when session ID and user are available
  useEffect(() => {
    if (!sessionId) return;

    async function initializeChat() {
      try {
        const currentUser = await getCurrentSessionUser();
        if (!currentUser) {
          console.warn('[Match Page] Could not get current user for chat');
          return;
        }

        // Store current user info for use in chat panel
        setCurrentUserId(currentUser.userId);
        setCurrentUsername(currentUser.username);

        console.log('[Match Page] Initializing chat with user:', currentUser);

        const chatClient = createChatClient({
          sessionId: sessionId!,
          userId: currentUser.userId,
          username: currentUser.username,
          wsUrl: config.collaborationService.wsUrl,
          onError: (error: string) => {
            // Don't show error if session is terminating
            if (!isTerminatingRef.current) {
              console.error('[Match Page] Chat error:', error);
              // Only show error as toast if it's a critical failure, not transient connection issues
              // Log for debugging but don't spam user with toasts during initial connection
              // toast.error(error, { duration: 6000 });
            }
          },
          onConnectionClose: () => {
            console.log('[Match Page] Chat connection closed');
          },
        });

        chatClientRef.current = chatClient;
        console.log('[Match Page] Chat client created');
      } catch (error) {
        console.error('[Match Page] Failed to initialize chat:', error);
        toast.error('Failed to initialize chat', { duration: 6000 });
      }
    }

    initializeChat();
  }, [sessionId]);

  const handleSwapPanels = useCallback(() => {
    setIsEditorOnLeft((prev) => !prev)
  }, [])

  const handleToggleSplitDirection = useCallback(() => {
    setIsVerticalSplit((prev) => !prev)
  }, [])

  const handleEndSession = useCallback(async () => {
    try {
      // Set ref immediately to prevent showing errors/dialogs while terminating
      isTerminatingRef.current = true;
      setIsSessionTerminating(true);

      // Clean up YJS before ending session
      if (yjsInstanceRef.current) {
        yjsInstanceRef.current.cleanup();
        yjsInstanceRef.current = null;
      }

      // Clean up chat client
      if (chatClientRef.current) {
        chatClientRef.current.cleanup();
        chatClientRef.current = null;
      }

      // Get current user to terminate session on collab service
      const currentUser = await getCurrentSessionUser();
      if (currentUser && sessionId) {
        try {
          // Use server action to avoid CORS issues
          const result = await terminateCollaborativeSession(sessionId, currentUser.userId);
          if (result.success) {
            console.log('[Match Page] Session terminated on collab service');
          } else {
            console.error('[Match Page] Failed to terminate session on collab service:', result.error);
            // Still redirect even if terminate fails
          }
        } catch (error) {
          console.error('[Match Page] Failed to call terminate action:', error);
          // Still redirect even if terminate fails
        }
      }

      toast.info('Session ended', { duration: 6000 });
      router.push('/home');
    } catch (error) {
      console.error('[Match Page] Error ending session:', error);
      toast.error('Failed to end session properly', { duration: 6000 });
    }
  }, [sessionId, router]);

  // Clean up YJS on component unmount
  useEffect(() => {
    return () => {
      if (yjsInstanceRef.current) {
        yjsInstanceRef.current.cleanup();
        yjsInstanceRef.current = null;
      }
      if (chatClientRef.current) {
        chatClientRef.current.cleanup();
        chatClientRef.current = null;
      }
    };
  }, []);

  const panelGroup: 'horizontal' | 'vertical' = isVerticalSplit ? 'vertical' : 'horizontal'

  // Show loading state while fetching question
  if (isLoadingQuestion) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    )
  }

  // Show error state if question failed to load
  if (questionError || !question) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-destructive font-semibold">Failed to load question</p>
          <p className="text-muted-foreground">{questionError || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  // Map difficulty from API (lowercase) to component format (capitalised)
  const difficultyDisplay = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) as 'Easy' | 'Medium' | 'Hard'
  
  // Get display name for programming language
  const languageDisplayName = LANGUAGE_DISPLAY_NAMES[programmingLanguage] || programmingLanguage.toUpperCase()

  const editorPanel = (
    <ResizablePanel defaultSize={50} minSize={30}>
      <div className="h-full w-full overflow-hidden">
        <CodeEditor
          language={programmingLanguage}
          sessionId={sessionId || undefined}
          onEditorReady={handleEditorReady}
        />
      </div>
    </ResizablePanel>
  )

  const questionPanel = (
    <ResizablePanel defaultSize={50} minSize={30}>
      <div className="h-full w-full overflow-hidden">
        <QuestionPanel
          title={question.title}
          description={question.description}
          difficulty={difficultyDisplay}
          examples={question.examples}
          constraints={[]} // Question model doesn't have constraints field
          textSize={textSize}
          questionId={question._id}
        />
      </div>
    </ResizablePanel>
  )

  return (
    <div className="flex flex-col bg-background text-foreground h-full overflow-hidden">
      {/* Toolbar */}
      <EditorToolbar
        isEditorOnLeft={isEditorOnLeft}
        onSwapPanels={handleSwapPanels}
        isVerticalSplit={isVerticalSplit}
        onToggleSplitDirection={handleToggleSplitDirection}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        editorInstance={editorRef.current}
      />

      {/* Main content area with resizable panels */}
      <div className="flex-1 overflow-hidden">
        {isVerticalSplit ? (
          // Vertical split: editor/question above, chat below
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full w-full overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  {isEditorOnLeft ? (
                    <>
                      {editorPanel}
                      <ResizableHandle withHandle />
                      {questionPanel}
                    </>
                  ) : (
                    <>
                      {questionPanel}
                      <ResizableHandle withHandle />
                      {editorPanel}
                    </>
                  )}
                </ResizablePanelGroup>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <ChatPanel 
                chatClient={chatClientRef.current || undefined} 
                currentUserId={currentUserId || undefined}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Horizontal split: editor/question on left, chat on right
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full w-full overflow-hidden">
                <ResizablePanelGroup direction={isVerticalSplit ? 'vertical' : 'horizontal'} className="h-full">
                  {isEditorOnLeft ? (
                    <>
                      {editorPanel}
                      <ResizableHandle withHandle />
                      {questionPanel}
                    </>
                  ) : (
                    <>
                      {questionPanel}
                      <ResizableHandle withHandle />
                      {editorPanel}
                    </>
                  )}
                </ResizablePanelGroup>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <ChatPanel 
                chatClient={chatClientRef.current || undefined} 
                currentUserId={currentUserId || undefined}
                currentUsername={currentUsername || undefined}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Status Bar at bottom */}
      <StatusBar
        questionName={question.title}
        programmingLanguage={languageDisplayName}
        difficulty={difficultyDisplay}
        onEndSession={() => setIsNavigationConfirmOpen(true)}
      />

      {/* Navigation confirmation dialog */}
      <EndSessionDialog
        open={isNavigationConfirmOpen}
        onOpenChange={setIsNavigationConfirmOpen}
        onConfirm={handleEndSession}
        title="End Collaborative Session?"
        description="Are you sure you want to leave? This will end the session for both users. Any unsaved progress will be lost."
      />
    </div>
  )
}