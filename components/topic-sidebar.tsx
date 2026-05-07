"use client"

import { useState } from "react"
import { Plus, FolderOpen, Trash2, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface Topic {
  id: number
  name: string
  content: string
  updated_at: string
}

interface TopicSidebarProps {
  topics: Topic[]
  selectedTopicId: number | null
  onSelectTopic: (topic: Topic) => void
  onCreateTopic: (name: string) => void
  onDeleteTopic: (id: number) => void
  onRenameTopic: (id: number, name: string) => void
}

export function TopicSidebar({
  topics,
  selectedTopicId,
  onSelectTopic,
  onCreateTopic,
  onDeleteTopic,
  onRenameTopic,
}: TopicSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newTopicName, setNewTopicName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  const handleCreate = () => {
    if (newTopicName.trim()) {
      onCreateTopic(newTopicName.trim())
      setNewTopicName("")
      setIsCreating(false)
    }
  }

  const handleRename = (id: number) => {
    if (editingName.trim()) {
      onRenameTopic(id, editingName.trim())
      setEditingId(null)
      setEditingName("")
    }
  }

  const startEditing = (topic: Topic) => {
    setEditingId(topic.id)
    setEditingName(topic.name)
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-sidebar-border p-4">
        <h2 className="text-sm font-medium text-sidebar-foreground">Topics</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isCreating && (
            <div className="mb-2 flex items-center gap-1 rounded-md bg-accent p-2">
              <Input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Topic name"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                  if (e.key === "Escape") {
                    setIsCreating(false)
                    setNewTopicName("")
                  }
                }}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCreate}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  setIsCreating(false)
                  setNewTopicName("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {topics.map((topic) => (
            <div
              key={topic.id}
              className={cn(
                "group mb-1 flex items-center gap-2 rounded-md px-3 py-2 transition-colors cursor-pointer",
                selectedTopicId === topic.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              )}
              onClick={() => editingId !== topic.id && onSelectTopic(topic)}
            >
              {editingId === topic.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(topic.id)
                      if (e.key === "Escape") {
                        setEditingId(null)
                        setEditingName("")
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRename(topic.id)
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(null)
                      setEditingName("")
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-sm">{topic.name}</span>
                  <div
                    className={cn(
                      "flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100",
                      selectedTopicId === topic.id && "opacity-100"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(topic)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive sm:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTopic(topic.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {topics.length === 0 && !isCreating && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No topics yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
