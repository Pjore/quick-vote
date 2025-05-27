import { sql } from "./db"

export async function initializeDatabase() {
  try {
    console.log("Initializing database...")

    // Create topics table
    await sql`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 10),
        summary TEXT NOT NULL CHECK (LENGTH(summary) >= 5),
        user_name TEXT NOT NULL CHECK (LENGTH(user_name) >= 3),
        user_session_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create votes table
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        user_session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id, user_session_id)
      )
    `

    // Create indexes for faster querying
    await sql`CREATE INDEX IF NOT EXISTS idx_topics_user_session_id ON topics(user_session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_votes_user_session_id ON votes(user_session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_votes_topic_id ON votes(topic_id)`

    console.log("Database initialized successfully")
    return { success: true }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, error }
  }
}
