"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { sql, getTopicById, getUserVoteForTopic, ensureTablesExist } from "./db"
import { generateSummary, validateTopicInput } from "./server-utils"

// Create a new topic
export async function createTopic(formData: FormData) {
  const description = formData.get("description") as string
  const summary = formData.get("summary") as string
  const userName = formData.get("userName") as string
  const autoGenerateSummary = formData.get("autoGenerateSummary") === "on"
  const shouldRedirect = formData.get("redirect") === "true"

  // Validate input
  const finalSummary = autoGenerateSummary ? generateSummary(description) : summary
  const errors = validateTopicInput(description, finalSummary, userName)

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    // Ensure tables exist
    const tablesExist = await ensureTablesExist()
    if (!tablesExist.success) {
      return {
        success: false,
        errors: { general: "Database initialization failed. Please try again." },
      }
    }

    // Get or create user session
    const cookieStore = cookies()
    let sessionId = cookieStore.get("user_session_id")?.value

    if (!sessionId) {
      sessionId = uuidv4()
      cookieStore.set("user_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })

      // Create user session in database
      await sql`
        INSERT INTO user_sessions (id)
        VALUES (${sessionId})
        ON CONFLICT (id) DO NOTHING
      `
    } else {
      // Check if session exists in database, create if not
      const sessionExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM user_sessions WHERE id = ${sessionId}
        ) as exists
      `

      if (!sessionExists[0].exists) {
        await sql`
          INSERT INTO user_sessions (id)
          VALUES (${sessionId})
          ON CONFLICT (id) DO NOTHING
        `
      }
    }

    // Create topic
    await sql`
      INSERT INTO topics (description, summary, user_name, user_session_id)
      VALUES (${description}, ${finalSummary}, ${userName}, ${sessionId})
    `

    revalidatePath("/")

    // Only redirect if explicitly requested
    if (shouldRedirect) {
      redirect("/")
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating topic:", error)
    return {
      success: false,
      errors: { general: "Failed to create topic. Please try again." },
    }
  }
}

// Update a topic
export async function updateTopic(formData: FormData) {
  const id = Number(formData.get("id"))
  const description = formData.get("description") as string
  const summary = formData.get("summary") as string
  const userName = formData.get("userName") as string
  const shouldRedirect = formData.get("redirect") === "true"

  // Validate input
  const errors = validateTopicInput(description, summary, userName)

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    // Get user session
    const cookieStore = cookies()
    const sessionId = cookieStore.get("user_session_id")?.value

    if (!sessionId) {
      return {
        success: false,
        errors: { general: "Session not found. Please try again." },
      }
    }

    // Check if topic belongs to user
    const topic = await getTopicById(id)

    if (!topic || topic.user_session_id !== sessionId) {
      return { success: false, errors: { general: "You can only edit your own topics" } }
    }

    // Update topic
    await sql`
      UPDATE topics
      SET description = ${description}, summary = ${summary}, user_name = ${userName}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_session_id = ${sessionId}
    `

    revalidatePath("/")

    // Only redirect if explicitly requested
    if (shouldRedirect) {
      redirect("/")
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating topic:", error)
    return {
      success: false,
      errors: { general: "Failed to update topic. Please try again." },
    }
  }
}

// Delete a topic
export async function deleteTopic(id: number) {
  try {
    // Get user session
    const cookieStore = cookies()
    const sessionId = cookieStore.get("user_session_id")?.value

    if (!sessionId) {
      return { success: false, message: "Session not found" }
    }

    // Check if topic belongs to user
    const topic = await getTopicById(id)

    if (!topic || topic.user_session_id !== sessionId) {
      return { success: false, message: "You can only delete your own topics" }
    }

    // Delete topic
    await sql`
      DELETE FROM topics
      WHERE id = ${id} AND user_session_id = ${sessionId}
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting topic:", error)
    return { success: false, message: "Failed to delete topic" }
  }
}

// Set or update a vote position
export async function setVotePosition(topicId: number, position: number) {
  try {
    // Get user session
    const cookieStore = cookies()
    const sessionId = cookieStore.get("user_session_id")?.value

    if (!sessionId) {
      return { success: false, message: "Session not found" }
    }

    // Check if user has already voted for this topic
    const existingVote = await getUserVoteForTopic(sessionId, topicId)

    if (existingVote) {
      // Update existing vote
      await sql`
        UPDATE votes
        SET position = ${position}, updated_at = CURRENT_TIMESTAMP
        WHERE topic_id = ${topicId} AND user_session_id = ${sessionId}
      `
    } else {
      // Create new vote
      await sql`
        INSERT INTO votes (topic_id, user_session_id, position)
        VALUES (${topicId}, ${sessionId}, ${position})
      `
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error setting vote position:", error)
    return { success: false, message: "Failed to set vote position" }
  }
}

// Update vote positions for multiple topics
export async function updateVotePositions(votes: { topicId: number; position: number }[]) {
  try {
    // Get user session
    const cookieStore = cookies()
    const sessionId = cookieStore.get("user_session_id")?.value

    if (!sessionId) {
      return { success: false, message: "Session not found" }
    }

    // First, delete all existing votes for this user
    await sql`
      DELETE FROM votes
      WHERE user_session_id = ${sessionId}
    `

    // Then insert the new votes with their positions
    for (const vote of votes) {
      if (vote.position > 0) {
        // Only insert votes with a position (ranked topics)
        await sql`
          INSERT INTO votes (topic_id, user_session_id, position)
          VALUES (${vote.topicId}, ${sessionId}, ${vote.position})
        `
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating vote positions:", error)
    return { success: false, message: "Failed to update vote positions" }
  }
}

// Remove a vote
export async function removeVote(topicId: number) {
  try {
    // Get user session
    const cookieStore = cookies()
    const sessionId = cookieStore.get("user_session_id")?.value

    if (!sessionId) {
      return { success: false, message: "Session not found" }
    }

    // Delete vote
    await sql`
      DELETE FROM votes
      WHERE topic_id = ${topicId} AND user_session_id = ${sessionId}
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error removing vote:", error)
    return { success: false, message: "Failed to remove vote" }
  }
}
