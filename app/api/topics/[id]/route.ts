import { NextResponse } from "next/server"
import { getD1, mockDB } from "@/lib/d1"

export const runtime = "edge"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topicId = parseInt(id)
    const db = getD1()

    if (db) {
      const topic = await db
        .prepare("SELECT * FROM topics WHERE id = ?")
        .bind(topicId)
        .first()
      
      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }
      return NextResponse.json(topic)
    }

    const topic = await mockDB.getTopic(topicId)
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }
    return NextResponse.json(topic)
  } catch (error) {
    console.error("Failed to fetch topic:", error)
    return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topicId = parseInt(id)
    const { content } = await request.json()
    const db = getD1()

    if (db) {
      const result = await db
        .prepare("UPDATE topics SET content = ?, updated_at = datetime('now') WHERE id = ? RETURNING *")
        .bind(content, topicId)
        .first()
      
      if (!result) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    const topic = await mockDB.updateTopicContent(topicId, content)
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }
    return NextResponse.json(topic)
  } catch (error) {
    console.error("Failed to update topic:", error)
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topicId = parseInt(id)
    const { name } = await request.json()
    const db = getD1()

    if (db) {
      const result = await db
        .prepare("UPDATE topics SET name = ?, updated_at = datetime('now') WHERE id = ? RETURNING *")
        .bind(name, topicId)
        .first()
      
      if (!result) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    const topic = await mockDB.updateTopicName(topicId, name)
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }
    return NextResponse.json(topic)
  } catch (error) {
    console.error("Failed to rename topic:", error)
    return NextResponse.json({ error: "Failed to rename topic" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topicId = parseInt(id)
    const db = getD1()

    if (db) {
      await db
        .prepare("DELETE FROM topics WHERE id = ?")
        .bind(topicId)
        .run()
      return NextResponse.json({ success: true })
    }

    await mockDB.deleteTopic(topicId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete topic:", error)
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
  }
}
