import { NextResponse } from "next/server"
import { getD1, mockDB, getUserFromRequest } from "@/lib/d1"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const db = getD1()
    const user = await getUserFromRequest(request, db)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (db) {
      const { results } = await db
        .prepare("SELECT * FROM topics WHERE user_id = ? ORDER BY updated_at DESC")
        .bind(user.id)
        .all()
      return NextResponse.json(results)
    }

    const topics = await mockDB.getTopics(user.id)
    return NextResponse.json(topics)
  } catch (error) {
    console.error("Failed to fetch topics:", error)
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    const db = getD1()
    const user = await getUserFromRequest(request, db)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (db) {
      const result = await db
        .prepare("INSERT INTO topics (user_id, name, content, updated_at) VALUES (?, ?, '', datetime('now')) RETURNING *")
        .bind(user.id, name)
        .first()
      return NextResponse.json(result)
    }

    const topic = await mockDB.createTopic(name, user.id)
    return NextResponse.json(topic)
  } catch (error) {
    console.error("Failed to create topic:", error)
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 })
  }
}