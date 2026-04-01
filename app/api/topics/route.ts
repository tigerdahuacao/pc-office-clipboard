import { NextResponse } from "next/server"
import { getD1, mockDB } from "@/lib/d1"

export const runtime = "edge"

export async function GET() {
  try {
    const db = getD1()

    if (db) {
      const { results } = await db
        .prepare("SELECT * FROM topics ORDER BY updated_at DESC")
        .all()
      return NextResponse.json(results)
    }

    const topics = await mockDB.getTopics()
    return NextResponse.json(topics)
  } catch (error) {
    console.error("Failed to fetch topics:", error)
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const db = getD1()

    if (db) {
      const result = await db
        .prepare("INSERT INTO topics (name, content, updated_at) VALUES (?, '', datetime('now')) RETURNING *")
        .bind(name)
        .first()
      return NextResponse.json(result)
    }

    const topic = await mockDB.createTopic(name)
    return NextResponse.json(topic)
  } catch (error) {
    console.error("Failed to create topic:", error)
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 })
  }
}
