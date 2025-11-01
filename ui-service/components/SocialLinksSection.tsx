"use client"

import { useState, useRef, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  GripVertical,
  Plus,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { SocialPlatform, SocialLink, SOCIAL_PLATFORMS } from "@/types/social"

interface SocialLinkItemProps {
  link: SocialLink
  onPlatformChange: (platform: SocialPlatform) => void
  onUrlChange: (url: string) => void
  onLabelChange?: (label: string) => void
  onDelete: () => void
  shouldFocusOnMount?: boolean
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>
}

function SocialLinkItem({
  link,
  onPlatformChange,
  onUrlChange,
  onLabelChange,
  onDelete,
  shouldFocusOnMount = false,
  triggerButtonRef,
}: SocialLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const currentPlatform = SOCIAL_PLATFORMS.find((p) => p.value === link.platform)
  const [open, setOpen] = useState(false)
  const comboboxButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (shouldFocusOnMount && triggerButtonRef?.current) {
      const isKeyboard = (triggerButtonRef.current as HTMLButtonElement & { dataset: { keyboard?: string } }).dataset?.keyboard === "true"
      if (isKeyboard && comboboxButtonRef.current) {
        comboboxButtonRef.current.focus()
        setTimeout(() => {
          setOpen(true)
        }, 0)
      }
    }
  }, [shouldFocusOnMount, triggerButtonRef])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3"
    >
      {/* Grab Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <GripVertical />
      </button>

      {/* Platform Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={comboboxButtonRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-48 justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {currentPlatform && (
                <currentPlatform.icon className="shrink-0" />
              )}
              <span className="truncate">
                {currentPlatform?.label || "Select platform..."}
              </span>
            </div>
            <ChevronsUpDown className="opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0">
          <Command>
            <CommandInput placeholder="Search platforms..." />
            <CommandEmpty>
              <div className="flex flex-col gap-1 py-2 text-center">
                <p>No platform found.</p>
                <p className="text-xs text-muted-foreground">Use Web/Other to add custom links.</p>
              </div>
            </CommandEmpty>
            <CommandList>
              <CommandGroup>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <CommandItem
                    key={platform.value}
                    value={platform.value}
                    onSelect={(currentValue) => {
                      onPlatformChange(currentValue as SocialPlatform)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <platform.icon />
                      <span className="flex-1">{platform.label}</span>
                      <Check
                        className={cn(
                          "shrink-0",
                          link.platform === platform.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Label Input (Web only) */}
      {link.platform === "web" && (
        <Input
          value={link.label || ""}
          onChange={(e) => onLabelChange?.(e.target.value)}
          placeholder="e.g., Portfolio"
          className="w-32"
        />
      )}
      
      {/* URL Input */}
      <Input
        value={link.url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder={currentPlatform?.placeholder || "Enter URL"}
        className="flex-1"
      />

      {/* Delete Button */}
      <Button
        onClick={onDelete}
        size="icon"
        variant="ghost"
		aria-label="Delete"
        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
      >
        <X />
      </Button>
    </div>
  )
}

interface SocialLinksSectionProps {
  links: SocialLink[]
  onLinksChange: (links: SocialLink[]) => void
}

export function SocialLinksSection({
  links,
  onLinksChange,
}: SocialLinksSectionProps) {
  const [lastAddedLinkId, setLastAddedLinkId] = useState<string | null>(null)
  const [wasKeyboardTriggered, setWasKeyboardTriggered] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id)
      const newIndex = links.findIndex((link) => link.id === over.id)

      onLinksChange(arrayMove(links, oldIndex, newIndex))
    }
  }

  const handlePlatformChange = (id: string, platform: SocialPlatform) => {
    onLinksChange(
      links.map((link) =>
        link.id === id ? { ...link, platform } : link
      )
    )
  }

  const handleUrlChange = (id: string, url: string) => {
    onLinksChange(
      links.map((link) =>
        link.id === id ? { ...link, url } : link
      )
    )
  }

  const handleDelete = (id: string) => {
    onLinksChange(links.filter((link) => link.id !== id))
  }

  const handleLabelChange = (id: string, label: string) => {
    onLinksChange(
      links.map((link) =>
        link.id === id ? { ...link, label } : link
      )
    )
  }

  const handleAddLink = () => {
    const newLinkId = `link-${Date.now()}`
    const newLink: SocialLink = {
      id: newLinkId,
      platform: undefined,
      url: "",
    }
    setLastAddedLinkId(newLinkId)
    onLinksChange([...links, newLink])
  }

  const handleAddLinkKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      setWasKeyboardTriggered(true)
      addButtonRef.current?.click()
    }
  }

  const handleAddLinkClick = () => {
    setWasKeyboardTriggered(false)
    handleAddLink()
  }

  return (
    <FieldSet>
      <FieldLegend>Social Links</FieldLegend>
      <FieldGroup>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((link) => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 w-full">
              {links.map((link) => (
                <SocialLinkItem
                  key={link.id}
                  link={link}
                  onPlatformChange={(platform) =>
                    handlePlatformChange(link.id, platform)
                  }
                  onUrlChange={(url) => handleUrlChange(link.id, url)}
                  onLabelChange={(label) => handleLabelChange(link.id, label)}
                  onDelete={() => handleDelete(link.id)}
                  shouldFocusOnMount={link.id === lastAddedLinkId && wasKeyboardTriggered}
                  triggerButtonRef={addButtonRef}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex justify-end">
          <Button
            ref={addButtonRef}
            onClick={handleAddLinkClick}
            onKeyDown={handleAddLinkKeyDown}
          >
            <Plus /> Add social link
          </Button>
        </div>
      </FieldGroup>
    </FieldSet>
  )
}
