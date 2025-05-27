import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Client-side version of generateSummary
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

// Client-side validation
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
