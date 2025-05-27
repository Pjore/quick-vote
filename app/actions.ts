"use server"

import { revalidatePath } from "next/cache"
import { query } from "@/lib/db"
import { generateSummary } from "@/lib/summary-generator"
import { calculateScores, type Topic } from "@/lib/score-calculator"
import { initializeDatabase } from "@/lib/db-init"

// Add a new topic
export async function addTopic(formData: FormData) {
  // Ensure database is initialized
  await initializeDatabase()

  const description = formData.get("description") as string
  const summary = formData.get("summary") as string
  const userName = formData.get("userName") as string
  const sessionId = formData.get("sessionId") as string

  // Validate inputs
  if (description.length < 10) {
    return { error: "Description must be at least 10 characters long" }
  }

  if (summary.length < 5 || summary.length > 100) {
    return { error: "Summary must be between 5 and 100 characters long" }
  }

  if (userName.length < 3) {
    return { error: "User name must be at least 3 characters long" }
  }

  try {
    const result = await query<{ id: number }>(
      `INSERT INTO topics (description, summary, user_name, session_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [description, summary, userName, sessionId],
    )

    revalidatePath("/")
    revalidatePath("/vote")

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error adding topic:", error)
    return { error: "Failed to add topic" }
  }
}

// Delete a topic
export async function deleteTopic(topicId: number, sessionId: string) {
  // Ensure database is initialized
  await initializeDatabase()

  try {
    // First check if the topic belongs to the user
    const topic = await query<Topic>(`SELECT * FROM topics WHERE id = $1 AND session_id = $2`, [topicId, sessionId])

    if (topic.length === 0) {
      return { error: "Topic not found or you do not have permission to delete it" }
    }

    await query(`DELETE FROM topics WHERE id = $1`, [topicId])

    revalidatePath("/")
    revalidatePath("/vote")

    return { success: true }
  } catch (error) {
    console.error("Error deleting topic:", error)
    return { error: "Failed to delete topic" }
  }
}

// Save votes
export async function saveVotes(votes: { topicId: number; placement: number }[], sessionId: string) {
  // Ensure database is initialized
  await initializeDatabase()

  try {
    // Delete existing votes for this session
    await query(`DELETE FROM votes WHERE session_id = $1`, [sessionId])

    // Insert new votes
    for (const vote of votes) {
      await query(`INSERT INTO votes (session_id, topic_id, placement) VALUES ($1, $2, $3)`, [
        sessionId,
        vote.topicId,
        vote.placement,
      ])
    }

    revalidatePath("/")
    revalidatePath("/vote")

    return { success: true }
  } catch (error) {
    console.error("Error saving votes:", error)
    return { error: "Failed to save votes" }
  }
}

// Get all topics
export async function getTopics(): Promise<Topic[]> {
  // Ensure database is initialized
  await initializeDatabase()

  try {
    const topics = await query<Topic>(`SELECT * FROM topics ORDER BY created_at DESC`)

    // Calculate scores for all topics
    const topicsWithScores = await calculateScores(topics)

    return topicsWithScores
  } catch (error) {
    console.error("Error in getTopics:", error)
    return []
  }
}

// Get topics ordered by score
export async function getTopicsByScore(): Promise<Topic[]> {
  const topics = await getTopics()

  // Sort by score (highest first)
  return topics.sort((a, b) => (b.score || 0) - (a.score || 0))
}

// Get user's votes
export async function getUserVotes(sessionId: string) {
  // Ensure database is initialized
  await initializeDatabase()

  try {
    const votes = await query<{ id: number; session_id: string; topic_id: number; placement: number }>(
      `SELECT * FROM votes WHERE session_id = $1 ORDER BY placement ASC`,
      [sessionId],
    )

    return votes
  } catch (error) {
    console.error("Error in getUserVotes:", error)
    return []
  }
}

// Get topics ordered by user's votes
export async function getTopicsWithUserOrder(sessionId: string): Promise<Topic[]> {
  const topics = await getTopics()
  const userVotes = await getUserVotes(sessionId)

  // Create a map of topic ID to placement
  const placementMap: Record<number, number> = {}
  userVotes.forEach((vote) => {
    placementMap[vote.topic_id] = vote.placement
  })

  // Sort topics based on user's votes
  const sortedTopics = [...topics].sort((a, b) => {
    const placementA = placementMap[a.id] !== undefined ? placementMap[a.id] : Number.MAX_SAFE_INTEGER
    const placementB = placementMap[b.id] !== undefined ? placementMap[b.id] : Number.MAX_SAFE_INTEGER
    return placementA - placementB
  })

  return sortedTopics
}

// Generate summary from description
export async function generateTopicSummary(description: string) {
  const summary = generateSummary(description)
  return { summary }
}
