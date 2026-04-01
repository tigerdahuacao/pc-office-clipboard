import { getRequestContext } from "@cloudflare/next-on-pages"

export function getD1() {
  try {
    const { env } = getRequestContext()
    return env.DB
  } catch {
    // For development without D1
    return null
  }
}

// Mock data for development without D1
const mockTopics = [
  { id: 1, name: "Default", content: "Welcome to your personal clipboard!", updated_at: new Date().toISOString(), created_at: new Date().toISOString() },
]

const mockSettings = {
  password: "clipboard123"
}

let mockTopicsData = [...mockTopics]
let nextId = 2

export const mockDB = {
  async getPassword(): Promise<string> {
    return mockSettings.password
  },

  async getTopics() {
    return mockTopicsData
  },

  async getTopic(id: number) {
    return mockTopicsData.find(t => t.id === id) || null
  },

  async createTopic(name: string) {
    const topic = {
      id: nextId++,
      name,
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockTopicsData.push(topic)
    return topic
  },

  async updateTopicContent(id: number, content: string) {
    const topic = mockTopicsData.find(t => t.id === id)
    if (topic) {
      topic.content = content
      topic.updated_at = new Date().toISOString()
      return topic
    }
    return null
  },

  async updateTopicName(id: number, name: string) {
    const topic = mockTopicsData.find(t => t.id === id)
    if (topic) {
      topic.name = name
      topic.updated_at = new Date().toISOString()
      return topic
    }
    return null
  },

  async deleteTopic(id: number) {
    const index = mockTopicsData.findIndex(t => t.id === id)
    if (index > -1) {
      mockTopicsData.splice(index, 1)
      return true
    }
    return false
  }
}
