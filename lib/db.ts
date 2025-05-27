import { neon } from "@neondatabase/serverless"
import { initializeDatabase } from "./db-init"

// Create a SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Topic type definition
export type Topic = {
  id: number
  description: string
  summary: string
  user_name: string
  user_session_id: string
  created_at: string
  updated_at: string
  score?: number
  normalized_score?: number
  average_score?: number
  user_position?: number
  vote_count?: number
}

// Vote type definition
export type Vote = {
  id: number
  topic_id: number
  user_session_id: string
  position: number
  created_at: string
  updated_at: string
}

// Add this function after the type definitions
export async function ensureTablesExist() {
  try {
    // Check if topics table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'topics'
      ) as exists
    `

    if (!result[0].exists) {
      return await initializeDatabase()
    }

    return { success: true }
  } catch (error) {
    console.error("Error checking tables:", error)
    return { success: false, error }
  }
}

// Get all topics with their scores based on Normalized Borda Count
export async function getTopicsWithScores() {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      console.error("Tables don't exist and couldn't be created")
      return []
    }

    // Calculate scores using Normalized Borda Count
    const result = await sql`
      WITH user_topic_counts AS (
        -- Count how many topics each user has ranked
        SELECT 
          user_session_id,
          COUNT(*) as ranked_count
        FROM 
          votes
        GROUP BY 
          user_session_id
      ),
      user_votes AS (
        -- Calculate Borda points for each user's rankings
        SELECT 
          v.topic_id,
          v.user_session_id,
          v.position,
          utc.ranked_count,
          -- Borda points: highest rank gets highest points (ranked_count)
          (utc.ranked_count + 1 - v.position) as borda_points
        FROM 
          votes v
        JOIN 
          user_topic_counts utc ON v.user_session_id = utc.user_session_id
        WHERE 
          v.position > 0
      ),
      topic_scores AS (
        -- Calculate average Borda score for each topic
        SELECT 
          t.id,
          t.description,
          t.summary,
          t.user_name,
          t.user_session_id,
          t.created_at,
          t.updated_at,
          -- Raw sum of Borda points
          COALESCE(SUM(uv.borda_points), 0) as total_score,
          -- Count of users who ranked this topic
          COUNT(DISTINCT uv.user_session_id) as vote_count,
          -- Average Borda score (normalized by users who ranked it)
          CASE 
            WHEN COUNT(DISTINCT uv.user_session_id) > 0 THEN 
              CAST((SUM(uv.borda_points)::float / COUNT(DISTINCT uv.user_session_id)) AS NUMERIC(10,2))
            ELSE 
              0
          END as average_score
        FROM 
          topics t
        LEFT JOIN 
          user_votes uv ON t.id = uv.topic_id
        GROUP BY 
          t.id, t.description, t.summary, t.user_name, t.user_session_id, t.created_at, t.updated_at
      )
      SELECT 
        *
      FROM 
        topic_scores
      ORDER BY 
        -- Sort by: 1) Has votes or not, 2) Average score, 3) Creation date
        CASE WHEN vote_count = 0 THEN 2 ELSE 1 END,
        average_score DESC,
        created_at DESC
    `

    return result as Topic[]
  } catch (error) {
    console.error("Error getting topics with scores:", error)
    return []
  }
}

// Get all topics with user's positions for a specific session
export async function getTopicsWithUserPositions(sessionId: string) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return []
    }

    // Calculate scores using Normalized Borda Count and include user's position
    const result = await sql`
      WITH user_topic_counts AS (
        -- Count how many topics each user has ranked
        SELECT 
          user_session_id,
          COUNT(*) as ranked_count
        FROM 
          votes
        GROUP BY 
          user_session_id
      ),
      user_votes AS (
        -- Calculate Borda points for each user's rankings
        SELECT 
          v.topic_id,
          v.user_session_id,
          v.position,
          utc.ranked_count,
          -- Borda points: highest rank gets highest points (ranked_count)
          (utc.ranked_count + 1 - v.position) as borda_points
        FROM 
          votes v
        JOIN 
          user_topic_counts utc ON v.user_session_id = utc.user_session_id
        WHERE 
          v.position > 0
      ),
      topic_scores AS (
        -- Calculate average Borda score for each topic
        SELECT 
          t.id,
          t.description,
          t.summary,
          t.user_name,
          t.user_session_id,
          t.created_at,
          t.updated_at,
          -- Raw sum of Borda points
          COALESCE(SUM(uv.borda_points), 0) as total_score,
          -- Count of users who ranked this topic
          COUNT(DISTINCT uv.user_session_id) as vote_count,
          -- Average Borda score (normalized by users who ranked it)
          CASE 
            WHEN COUNT(DISTINCT uv.user_session_id) > 0 THEN 
              CAST((SUM(uv.borda_points)::float / COUNT(DISTINCT uv.user_session_id)) AS NUMERIC(10,2))
            ELSE 
              0
          END as average_score,
          -- Get this user's position for the topic
          (SELECT position FROM votes WHERE user_session_id = ${sessionId} AND topic_id = t.id) as user_position
        FROM 
          topics t
        LEFT JOIN 
          user_votes uv ON t.id = uv.topic_id
        GROUP BY 
          t.id, t.description, t.summary, t.user_name, t.user_session_id, t.created_at, t.updated_at
      )
      SELECT 
        *
      FROM 
        topic_scores ts
      ORDER BY 
        CASE WHEN user_position IS NULL THEN 999999 ELSE user_position END ASC,
        ts.created_at DESC
    `

    return result as Topic[]
  } catch (error) {
    console.error("Error getting topics with user positions:", error)
    return []
  }
}

// Get topics by user session
export async function getTopicsByUserSession(sessionId: string) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return []
    }

    const result = await sql`
      SELECT * FROM topics
      WHERE user_session_id = ${sessionId}
      ORDER BY created_at DESC
    `
    return result as Topic[]
  } catch (error) {
    console.error("Error getting topics by user session:", error)
    return []
  }
}

// Get a single topic by ID
export async function getTopicById(id: number) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return undefined
    }

    const result = await sql`
      SELECT * FROM topics
      WHERE id = ${id}
    `
    return result[0] as Topic | undefined
  } catch (error) {
    console.error("Error getting topic by ID:", error)
    return undefined
  }
}

// Get user's vote for a specific topic
export async function getUserVoteForTopic(sessionId: string, topicId: number) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return null
    }

    const result = await sql`
      SELECT * FROM votes
      WHERE user_session_id = ${sessionId} AND topic_id = ${topicId}
    `
    return result[0] as Vote | null
  } catch (error) {
    console.error("Error getting user vote for topic:", error)
    return null
  }
}

// Check if a user has already voted for a topic
export async function hasUserVotedForTopic(sessionId: string, topicId: number) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return false
    }

    const result = await sql`
      SELECT COUNT(*) as count
      FROM votes
      WHERE user_session_id = ${sessionId} AND topic_id = ${topicId}
    `
    return result[0].count > 0
  } catch (error) {
    console.error("Error checking if user voted for topic:", error)
    return false
  }
}

// Get the highest position for a user's votes
export async function getHighestVotePosition(sessionId: string) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return 0
    }

    const result = await sql`
      SELECT MAX(position) as max_position
      FROM votes
      WHERE user_session_id = ${sessionId}
    `
    return result[0].max_position || 0
  } catch (error) {
    console.error("Error getting highest vote position:", error)
    return 0
  }
}

// Get the count of user votes
export async function getUserVoteCount(sessionId: string) {
  try {
    // Ensure tables exist before querying
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return 0
    }

    const result = await sql`
      SELECT COUNT(*) as count
      FROM votes
      WHERE user_session_id = ${sessionId}
    `
    return result[0].count || 0
  } catch (error) {
    console.error("Error getting user vote count:", error)
    return 0
  }
}
