import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

// Get or create a user session ID (server-side only)
export function getUserSessionId() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get("user_session_id")?.value

  if (!sessionId) {
    sessionId = uuidv4()
    // Note: This is handled in the server action to set the cookie
  }

  return sessionId
}

// Generate a summary from a description
export function generateSummary(description: string): string {
  // Simple summary generation - take first sentence or first 40 chars
  const firstSentence = description.split(/[.!?]/).filter(Boolean)[0]

  if (firstSentence) {
    // If first sentence is longer than 40 chars, truncate it
    if (firstSentence.length > 40) {
      return firstSentence.substring(0, 37).trim() + "..."
    }

    // If first sentence is at least 5 chars, use it
    if (firstSentence.length >= 5) {
      return firstSentence.trim()
    }
  }

  // If first sentence is too short, take first 40 chars or the whole description
  return description.length > 40 ? description.substring(0, 37) + "..." : description
}

// Validate topic input
export function validateTopicInput(description: string, summary: string, userName: string) {
  const errors: Record<string, string> = {}

  if (!description || description.length < 10) {
    errors.description = "Description must be at least 10 characters long"
  }

  if (!summary || summary.length < 5) {
    errors.summary = "Summary must be at least 5 characters long"
  } else if (summary.length > 40) {
    errors.summary = "Summary must be at most 40 characters long"
  }

  if (!userName || userName.length < 3) {
    errors.userName = "Name must be at least 3 characters long"
  }

  return errors
}
