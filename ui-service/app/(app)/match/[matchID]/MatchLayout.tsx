'use client'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { CodeEditor } from '@/components/CodeEditor'
import { QuestionPanel } from '@/components/QuestionPanel'
import { ChatPanel } from '@/components/ChatPanel'
import { StatusBar } from '@/components/StatusBar'
import { EditorToolbar } from '@/components/EditorToolbar'
import { EndSessionDialog } from '@/components/EndSessionDialog'
import { Spinner } from '@/components/ui/spinner'
import type { Question } from '@/lib/questionServiceClient'
import type { ChatClientInstance } from '@/lib/chatClient'

interface MatchLayoutProps {
  isLoadingQuestion: boolean
  questionError: string | null
  question: Question | null
  programmingLanguage: string
  difficultyDisplay: 'Easy' | 'Medium' | 'Hard'
  languageDisplayName: string
  isEditorOnLeft: boolean
  isVerticalSplit: boolean
  textSize: number
  isChatVisible: boolean
  currentUserId: string | null
  currentUsername: string | null
  chatClient: ChatClientInstance | null
  editorRef: React.RefObject<any>
  editorInstance: any | null
  onEditorReady: (editor: any, monaco: any) => void
  onSwapPanels: () => void
  onToggleSplitDirection: () => void
  onTextSizeChange: (size: number) => void
  onToggleChatVisibility: () => void
  isNavigationConfirmOpen: boolean
  onNavigationConfirmOpenChange: (open: boolean) => void
  onConfirmEndSession: () => void
}

export function MatchLayout({
  isLoadingQuestion,
  questionError,
  question,
  programmingLanguage,
  difficultyDisplay,
  languageDisplayName,
  isEditorOnLeft,
  isVerticalSplit: isHorizontalSplit,
  textSize,
  isChatVisible,
  currentUserId,
  currentUsername,
  chatClient,
  editorRef,
  editorInstance,
  onEditorReady,
  onSwapPanels,
  onToggleSplitDirection,
  onTextSizeChange,
  onToggleChatVisibility,
  isNavigationConfirmOpen,
  onNavigationConfirmOpenChange,
  onConfirmEndSession,
}: MatchLayoutProps) {
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

  const editorPanel = (
    <ResizablePanel defaultSize={50} minSize={30}>
      <div className="h-full w-full overflow-hidden">
        <CodeEditor
          language={programmingLanguage}
          onEditorReady={onEditorReady}
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
          constraints={[]}
          textSize={textSize}
          questionId={question._id}
        />
      </div>
    </ResizablePanel>
  )

  const panelGroup: 'horizontal' | 'vertical' = isHorizontalSplit ? 'vertical' : 'horizontal'

  return (
    <div className="flex flex-col bg-background text-foreground h-full overflow-hidden">
      {/* Toolbar with editor layout controls */}
       <EditorToolbar
         isEditorOnLeft={isEditorOnLeft}
         onSwapPanels={onSwapPanels}
         isHorizontalSplit={isHorizontalSplit}
         onToggleSplitDirection={onToggleSplitDirection}
         textSize={textSize}
         onTextSizeChange={onTextSizeChange}
         editorInstance={editorInstance}
         isChatVisible={isChatVisible}
         onToggleChatVisibility={onToggleChatVisibility}
       />

      {/* Main content area with resizable panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: editor + question, layout controlled by isVerticalSplit and isEditorOnLeft */}
          <ResizablePanel defaultSize={80} minSize={40}>
            <div className="h-full w-full overflow-hidden">
              {isHorizontalSplit ? (
                <ResizablePanelGroup direction="vertical" className="h-full">
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
              ) : (
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
              )}
            </div>
          </ResizablePanel>

          {/* Right: Chat panel, always rightmost; visibility controlled via classes */}
          <ResizableHandle withHandle className={isChatVisible ? '' : 'hidden'} />
          <ResizablePanel
            defaultSize={20}
            minSize={16}
            className={isChatVisible ? '' : 'hidden'}
          >
            <ChatPanel
              chatClient={chatClient || undefined}
              currentUserId={currentUserId || undefined}
              currentUsername={currentUsername || undefined}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
 
      {/* Bottom status bar */}
      <div className="border-t border-border">
        <StatusBar
          questionName={question.title}
          programmingLanguage={languageDisplayName}
          difficulty={difficultyDisplay}
          onEndSession={() => onNavigationConfirmOpenChange(true)}
        />
      </div>
 
      <EndSessionDialog
        open={isNavigationConfirmOpen}
        onOpenChange={onNavigationConfirmOpenChange}
        onConfirm={async () => {
          await onConfirmEndSession()
          onNavigationConfirmOpenChange(false)
        }}
        title="End Collaborative Session?"
        description="Are you sure you want to leave? This will end the session for both users. Any unsaved progress will be lost."
      />
    </div>
  )
}
