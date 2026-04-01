import { NextResponse } from "next/server"
import { getD1, mockDB } from "@/lib/d1"

export const runtime = "edge"

export async function GET() {
  const requestId = crypto.randomUUID()

  try {
    const db = getD1()

    if (!db) {
      console.warn(`[auth][${requestId}] D1 binding missing, using mock DB`)
      return NextResponse.json({ ok: true, mode: "mock", requestId })
    }

    const result = await db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .bind("password")
      .first<{ value: string }>()

    return NextResponse.json({
      ok: true,
      mode: "d1",
      hasPassword: Boolean(result?.value),
      requestId,
    })
  } catch (error) {
    console.error(`[auth][${requestId}] GET check failed`, error)
    return NextResponse.json({ error: "Auth health check failed", requestId }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    const body = (await request.json().catch((error) => {
      console.error(`[auth][${requestId}] Invalid JSON body`, error)
      return null
    })) as { password?: string } | null

    const password = body?.password

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 })
    }

    const db = getD1()
    let storedPassword: string

    if (db) {
      let result: { value: string } | null = null

      try {
        result = await db
          .prepare("SELECT value FROM settings WHERE key = ?")
          .bind("password")
          .first<{ value: string }>()
      } catch (error) {
        console.error(`[auth][${requestId}] D1 query failed`, error)
        throw error
      }

      storedPassword = result?.value || "clipboard123"
    } else {
      console.warn(`[auth][${requestId}] D1 binding missing, using mock DB`)
      storedPassword = await mockDB.getPassword()
    }

    if (password === storedPassword) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  } catch (error) {
    console.error(`[auth][${requestId}] Auth error`, error)
    return NextResponse.json({ error: "Authentication failed", requestId }, { status: 500 })
  }
}
