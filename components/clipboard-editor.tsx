"use client"

import { useEffect, useCallback, useState } from "react"
import { Save, Clock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Topic } from "@/components/topic-sidebar"

interface ClipboardEditorProps {
  topic: Topic | null
  content: string
  onContentChange: (content: string) => void
  onSave: () => void
  isSaving: boolean
  lastSaved: string | null
}

export function ClipboardEditor({
  topic,
  content,
  onContentChange,
  onSave,
  isSaving,
  lastSaved,
}: ClipboardEditorProps) {
  const [showSaved, setShowSaved] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        onSave()
      }
    },
    [onSave]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastSaved])

  if (!topic) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-4xl text-muted-foreground/50">
            <Save className="mx-auto h-12 w-12" />
          </div>
          <p className="text-muted-foreground">Select a topic to start editing</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Or create a new topic from the sidebar
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-medium text-foreground">{topic.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last saved: {lastSaved ? formatDate(lastSaved) : formatDate(topic.updated_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showSaved && (
            <span className="flex items-center gap-1 text-sm text-primary">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          <Button onClick={onSave} disabled={isSaving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <span className="text-xs text-muted-foreground">Ctrl+S</span>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Paste or type your content here..."
          className="h-full min-h-[calc(100vh-200px)] resize-none font-mono text-sm leading-relaxed"
        />
      </div>
    </div>
  )
}
