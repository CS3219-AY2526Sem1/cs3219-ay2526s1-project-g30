'use client'

import { useCallback } from 'react'
import { Send } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ChatInputProps {
  value: string
  onValueChange: (value: string) => void
  onSend: (value: string) => void
  disabled: boolean
  chatError: string | null
}

export function ChatInput({
  value,
  onValueChange,
  onSend,
  disabled,
  chatError,
}: ChatInputProps) {
  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      onSend(value)
      onValueChange('')
    },
    [onSend, onValueChange, value],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        onSend(value)
        onValueChange('')
      }
    },
    [onSend, onValueChange, value],
  )

  return (
    <div className="shrink-0 border-t border-border px-2 py-3">
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupTextarea
            placeholder={chatError ? 'Connection error...' : 'Type a message...'}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
            rows={1}
            disabled={disabled}
          />
          <InputGroupAddon align="block-end" className="justify-end">
            <TooltipProvider>
              <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    size="icon-xs"
                    variant="default"
                    type="submit"
                    disabled={disabled || !value.trim()}
                    aria-label="Send message"
                  >
                    <Send className="size-3.5" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  {disabled
                    ? chatError
                      ? 'Connection error'
                      : 'Connecting...'
                    : 'Send'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  )
}
