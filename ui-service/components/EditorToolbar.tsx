'use client'

import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

interface EditorToolbarProps {
  isEditorOnLeft: boolean
  onSwapPanels: () => void
  isVerticalSplit: boolean
  onToggleSplitDirection: () => void
  textSize: number
  onTextSizeChange: (size: number) => void
}

export function EditorToolbar({
  isEditorOnLeft,
  onSwapPanels,
  isVerticalSplit,
  onToggleSplitDirection,
  textSize,
  onTextSizeChange,
}: EditorToolbarProps) {
  const TEXT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24]

  return (
    <TooltipProvider>
      <div className="flex items-center justify-start bg-background border-b border-border px-4 py-3 gap-4">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <Type />
                    <span className="text-xs">{textSize}px</span>
                    <ChevronDown />
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
