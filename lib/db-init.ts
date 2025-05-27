import { sql } from "./db"

export async function initializeDatabase() {
  try {
    console.log("Checking if tables exist...")

    // Check if topics table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'topics'
      );
    `

    const tablesExist = tableCheck[0]?.exists

    if (tablesExist) {
      console.log("Tables already exist")
      return { success: true, message: "Tables already exist" }
    }

    console.log("Creating tables...")

    // Create topics table
    await sql`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        summary VARCHAR(100) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        session_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT min_description_length CHECK (LENGTH(description) >= 10),
        CONSTRAINT min_summary_length CHECK (LENGTH(summary) >= 5),
        CONSTRAINT max_summary_length CHECK (LENGTH(summary) <= 100),
        CONSTRAINT min_user_name_length CHECK (LENGTH(user_name) >= 3)
      )
    `

    // Create votes table
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        placement INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, topic_id)
      )
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_topics_session_id ON topics(session_id)
    `

    console.log("Tables created successfully")
    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { error: "Failed to initialize database" }
  }
}
