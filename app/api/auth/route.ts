import { NextResponse } from "next/server"
import { getD1, mockDB, getUserFromRequest } from "@/lib/d1"

export const runtime = "edge"

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    const db = getD1()
    const user = await getUserFromRequest(request, db)

    // If there's a valid session, return user info
    if (user) {
      return NextResponse.json({
        ok: true,
        mode: db ? "d1" : "mock",
        user: { id: user.id, username: user.username },
        requestId,
      })
    }

    // Otherwise return health check without user
    if (!db) {
      console.warn(`[auth][${requestId}] D1 binding missing, using mock DB`)
      return NextResponse.json({ ok: true, mode: "mock", requestId })
    }

    const result = await db
      .prepare("SELECT COUNT(*) as count FROM users")
      .first<{ count: number }>()

    return NextResponse.json({
      ok: true,
      mode: "d1",
      hasUsers: Boolean(result?.count && result.count > 0),
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
    })) as { username?: string; password?: string } | null

    const username = body?.username?.trim()
    const password = body?.password

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    const db = getD1()
    let user: { id: number; username: string; password_hash: string } | null = null

    if (db) {
      try {
        const result = await db
          .prepare("SELECT * FROM users WHERE username = ?")
          .bind(username)
          .first<{ id: number; username: string; password_hash: string }>()

        user = result || null
      } catch (error) {
        console.error(`[auth][${requestId}] D1 query failed`, error)
        throw error
      }
    } else {
      console.warn(`[auth][${requestId}] D1 binding missing, using mock DB`)
      user = await mockDB.getUserByUsername(username)
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (password !== user.password_hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (db) {
      await db
        .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(sessionId, user.id, expiresAt)
        .run()
    } else {
      await mockDB.createSession(user.id)
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    })

    // Set HTTP-only cookie
    response.cookies.set("clipboard_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(expiresAt),
      path: "/",
    })

    return response
  } catch (error) {
    console.error(`[auth][${requestId}] Auth error`, error)
    return NextResponse.json({ error: "Authentication failed", requestId }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) {
      return NextResponse.json({ success: true })
    }

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [key, ...val] = c.trim().split("=")
        return [key, val.join("=")]
      })
    )

    const sessionId = cookies["clipboard_session"]
    if (!sessionId) {
      return NextResponse.json({ success: true })
    }

    const db = getD1()

    if (db) {
      await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run()
    } else {
      await mockDB.deleteSession(sessionId)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("clipboard_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error(`[auth][${requestId}] Logout error`, error)
    return NextResponse.json({ error: "Logout failed", requestId }, { status: 500 })
  }
}