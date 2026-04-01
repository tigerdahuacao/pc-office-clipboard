"use client"

import { useState, useEffect, useCallback } from "react"
import { LogOut, Clipboard, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopicSidebar, type Topic } from "@/components/topic-sidebar"
import { ClipboardEditor } from "@/components/clipboard-editor"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function Dashboard() {
  const { logout } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const fetchTopics = useCallback(async () => {
    try {
      const response = await fetch("/api/topics")
      if (response.ok) {
        const data = await response.json()
        setTopics(data)
        if (data.length > 0 && !selectedTopic) {
          setSelectedTopic(data[0])
          setContent(data[0].content || "")
        }
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTopic])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic)
    setContent(topic.content || "")
    setLastSaved(topic.updated_at)
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTopic) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/topics/${selectedTopic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const updated = await response.json()
        setLastSaved(updated.updated_at)
        setTopics((prev) =>
          prev.map((t) => (t.id === selectedTopic.id ? { ...t, content, updated_at: updated.updated_at } : t))
        )
        setSelectedTopic((prev) => (prev ? { ...prev, content, updated_at: updated.updated_at } : null))
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTopic = async (name: string) => {
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        const newTopic = await response.json()
        setTopics((prev) => [...prev, newTopic])
        setSelectedTopic(newTopic)
        setContent(newTopic.content || "")
      }
    } catch (error) {
      console.error("Failed to create topic:", error)
    }
  }

  const handleDeleteTopic = async (id: number) => {
    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTopics((prev) => prev.filter((t) => t.id !== id))
        if (selectedTopic?.id === id) {
          const remaining = topics.filter((t) => t.id !== id)
          if (remaining.length > 0) {
            setSelectedTopic(remaining[0])
            setContent(remaining[0].content || "")
          } else {
            setSelectedTopic(null)
            setContent("")
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete topic:", error)
    }
  }

  const handleRenameTopic = async (id: number, name: string) => {
    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        const updated = await response.json()
        setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, name: updated.name } : t)))
        if (selectedTopic?.id === id) {
          setSelectedTopic((prev) => (prev ? { ...prev, name: updated.name } : null))
        }
      }
    } catch (error) {
      console.error("Failed to rename topic:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">Open topics</span>
            </Button>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Clipboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-medium text-foreground">Clipboard</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <div className="w-64 shrink-0">
            <TopicSidebar
              topics={topics}
              selectedTopicId={selectedTopic?.id ?? null}
              onSelectTopic={handleSelectTopic}
              onCreateTopic={handleCreateTopic}
              onDeleteTopic={handleDeleteTopic}
              onRenameTopic={handleRenameTopic}
            />
          </div>
        )}
        <ClipboardEditor
          topic={selectedTopic}
          content={content}
          onContentChange={setContent}
          onSave={handleSave}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      </div>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[85vw] p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Topics</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-hidden">
            <TopicSidebar
              topics={topics}
              selectedTopicId={selectedTopic?.id ?? null}
              onSelectTopic={handleSelectTopic}
              onCreateTopic={handleCreateTopic}
              onDeleteTopic={handleDeleteTopic}
              onRenameTopic={handleRenameTopic}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
