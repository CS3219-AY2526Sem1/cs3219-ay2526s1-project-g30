'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronDown as ChevronDownIcon } from 'lucide-react'

interface NewMessagesIndicatorProps {
  count: number
  visible: boolean
  onClick: () => void
}

export function NewMessagesIndicator({
  count,
  visible,
  onClick,
}: NewMessagesIndicatorProps) {
  return (
    <div className="relative h-0 overflow-visible flex justify-center pointer-events-none z-10">
      <AnimatePresence>
        {visible && count > 0 && (
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
              onClick={onClick}
              className="pointer-events-auto shadow-md"
            >
              <ChevronDownIcon className="size-4 mr-1" />
              {count} new {count === 1 ? 'message' : 'messages'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
