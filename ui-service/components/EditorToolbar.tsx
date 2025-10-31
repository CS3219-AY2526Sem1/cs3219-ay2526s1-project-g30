'use client'

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowLeftRight,
  Columns2,
  Rows2,
  Type,
  ChevronDown,
  Undo,
  Redo,
  Copy,
  Scissors,
  ClipboardPaste,
  AArrowDown,
  AArrowUp,
} from 'lucide-react'

interface EditorToolbarProps {
  isEditorOnLeft: boolean
  onSwapPanels: () => void
  isVerticalSplit: boolean
  onToggleSplitDirection: () => void
  textSize: number
  onTextSizeChange: (size: number) => void
  editorInstance?: any
}

const TEXT_SIZE_PRESETS = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]

export function EditorToolbar({
  isEditorOnLeft,
  onSwapPanels,
  isVerticalSplit,
  onToggleSplitDirection,
  textSize,
  onTextSizeChange,
  editorInstance,
}: EditorToolbarProps) {
  const handleTextSizeDecrease = useCallback(() => {
    const currentIndex = TEXT_SIZE_PRESETS.indexOf(textSize)
    if (currentIndex > 0) {
      onTextSizeChange(TEXT_SIZE_PRESETS[currentIndex - 1])
    }
  }, [textSize, onTextSizeChange])

  const handleTextSizeIncrease = useCallback(() => {
    const currentIndex = TEXT_SIZE_PRESETS.indexOf(textSize)
    if (currentIndex < TEXT_SIZE_PRESETS.length - 1) {
      onTextSizeChange(TEXT_SIZE_PRESETS[currentIndex + 1])
    }
  }, [textSize, onTextSizeChange])

  const handleUndo = useCallback(() => {
    if (editorInstance) {
      editorInstance.focus()
      editorInstance.trigger('', 'undo')
    }
  }, [editorInstance])

  const handleRedo = useCallback(() => {
    if (editorInstance) {
      editorInstance.focus()
      editorInstance.trigger('', 'redo')
    }
  }, [editorInstance])

  const handleCopy = useCallback(async () => {
    if (editorInstance) {
      editorInstance.focus()
      const selection = editorInstance.getSelection()
      if (selection && !selection.isEmpty()) {
        const model = editorInstance.getModel()
        const text = model.getValueInRange(selection)
        try {
          await navigator.clipboard.writeText(text)
        } catch (error) {
          console.error('Failed to copy:', error)
        }
      }
    }
  }, [editorInstance])

  const handleCut = useCallback(async () => {
    if (editorInstance) {
      editorInstance.focus()
      const selection = editorInstance.getSelection()
      if (selection && !selection.isEmpty()) {
        const model = editorInstance.getModel()
        const text = model.getValueInRange(selection)
        try {
          await navigator.clipboard.writeText(text)
          const command = {
            identifier: 'delete',
            label: 'Delete',
            run: () => {
              editorInstance.executeEdits('delete', [
                {
                  range: selection,
                  text: null,
                },
              ])
            },
          }
          command.run()
        } catch (error) {
          console.error('Failed to cut:', error)
        }
      }
    }
  }, [editorInstance])

  const handlePaste = useCallback(async () => {
    if (editorInstance) {
      editorInstance.focus()
      try {
        const text = await navigator.clipboard.readText()
        const selection = editorInstance.getSelection()
        editorInstance.executeEdits('paste', [
          {
            range: selection,
            text,
          },
        ])
      } catch (error) {
        console.error('Failed to paste:', error)
      }
    }
  }, [editorInstance])

  return (
    <TooltipProvider>
      <div className="flex items-center justify-start bg-background border-b border-border px-4 py-3 gap-4">
        {/* Edit controls */}
        <div className="flex items-center gap-2">
          {/* Undo button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!editorInstance}
              >
                <Undo />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Undo
            </TooltipContent>
          </Tooltip>

          {/* Redo button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!editorInstance}
              >
                <Redo />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Redo
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* Copy button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!editorInstance}
              >
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Copy
            </TooltipContent>
          </Tooltip>

          {/* Cut button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCut}
                disabled={!editorInstance}
              >
                <Scissors />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Cut
            </TooltipContent>
          </Tooltip>

          {/* Paste button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                disabled={!editorInstance}
              >
                <ClipboardPaste />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Paste
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Layout controls */}
        <div className="flex items-center gap-2">
          {/* Swap panels button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSwapPanels}
              >
                <ArrowLeftRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Swap editor and question panels
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* Split direction toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSplitDirection}
              >
                {isVerticalSplit ? <Columns2 /> : <Rows2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isVerticalSplit
                ? 'Switch to horizontal split'
                : 'Switch to vertical split'}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* Text size control */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ButtonGroup>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTextSizeDecrease}
                  disabled={textSize === TEXT_SIZE_PRESETS[0]}
                >
                  <AArrowDown />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <span className="text-xs">{textSize}px</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {TEXT_SIZE_PRESETS.map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() => onTextSizeChange(size)}
                        className={textSize === size ? 'bg-accent' : ''}
                      >
                        <span className="text-sm">{size}px</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTextSizeIncrease}
                  disabled={textSize === TEXT_SIZE_PRESETS[TEXT_SIZE_PRESETS.length - 1]}
                >
                  <AArrowUp />
                </Button>
              </ButtonGroup>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Adjust question text size
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
