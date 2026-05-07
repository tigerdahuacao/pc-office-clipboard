import { getRequestContext } from "@cloudflare/next-on-pages"

export function getD1() {
  try {
    const { env } = getRequestContext()
    return env.DB
  } catch {
    return null
  }
}

export interface User {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export interface Session {
  id: string
  user_id: number
  expires_at: string
}

export interface Topic {
  id: number
  user_id: number
  name: string
  content: string
  created_at: string
  updated_at: string
}

// Mock data for development without D1
const mockUsers: User[] = [
  { id: 1, username: "demo", password_hash: "password123", created_at: new Date().toISOString() },
]

const mockSessions: Session[] = []

const mockTopicsData: Topic[] = [
  { id: 1, user_id: 1, name: "Default", content: "Welcome to your personal clipboard!", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export const mockDB = {
  async getUserByUsername(username: string): Promise<User | null> {
    return mockUsers.find(u => u.username === username) || null
  },

  async getUserById(id: number): Promise<User | null> {
    return mockUsers.find(u => u.id === id) || null
  },

  async createSession(userId: number): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      user_id: userId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }
    mockSessions.push(session)
    return session
  },

  async getSession(sessionId: string): Promise<Session | null> {
    const session = mockSessions.find(s => s.id === sessionId)
    if (!session) return null
    if (new Date(session.expires_at) < new Date()) {
      const index = mockSessions.findIndex(s => s.id === sessionId)
      if (index > -1) mockSessions.splice(index, 1)
      return null
    }
    return session
  },

  async deleteSession(sessionId: string): Promise<void> {
    const index = mockSessions.findIndex(s => s.id === sessionId)
    if (index > -1) mockSessions.splice(index, 1)
  },

  async getTopics(userId: number) {
    return mockTopicsData.filter(t => t.user_id === userId)
  },

  async getTopic(id: number, userId: number) {
    return mockTopicsData.find(t => t.id === id && t.user_id === userId) || null
  },

  async createTopic(name: string, userId: number) {
    const topic: Topic = {
      id: mockTopicsData.length + 1,
      user_id: userId,
      name,
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockTopicsData.push(topic)
    return topic
  },

  async updateTopicContent(id: number, content: string, userId: number) {
    const topic = mockTopicsData.find(t => t.id === id && t.user_id === userId)
    if (topic) {
      topic.content = content
      topic.updated_at = new Date().toISOString()
      return topic
    }
    return null
  },

  async updateTopicName(id: number, name: string, userId: number) {
    const topic = mockTopicsData.find(t => t.id === id && t.user_id === userId)
    if (topic) {
      topic.name = name
      topic.updated_at = new Date().toISOString()
      return topic
    }
    return null
  },

  async deleteTopic(id: number, userId: number) {
    const index = mockTopicsData.findIndex(t => t.id === id && t.user_id === userId)
    if (index > -1) {
      mockTopicsData.splice(index, 1)
      return true
    }
    return false
  }
}

// Helper function to extract session from cookies and get user
export async function getUserFromRequest(request: Request, db: any): Promise<User | null> {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [key, ...val] = c.trim().split("=")
      return [key, val.join("=")]
    })
  )

  const sessionId = cookies["clipboard_session"]
  if (!sessionId) return null

  if (db) {
    const session = await db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first()

    if (!session) return null

    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run()
      return null
    }

    const user = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(session.user_id)
      .first()

    return user || null
  }

  const session = await mockDB.getSession(sessionId)
  if (!session) return null

  return mockDB.getUserById(session.user_id)
}