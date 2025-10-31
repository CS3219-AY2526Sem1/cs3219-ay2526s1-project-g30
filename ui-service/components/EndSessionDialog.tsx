'use client'

import { LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface EndSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  showIcon?: boolean
}

export function EndSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'End Collaborative Session?',
  description = 'Are you sure you want to leave? This will end the session for both users. Any unsaved progress will be lost.',
}: EndSessionDialogProps) {
  const handleConfirm = async () => {
    onOpenChange(false)
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel><X />No, return to session</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm}>
            <LogOut />
            End session
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
