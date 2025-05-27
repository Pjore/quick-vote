export function generateSummary(description: string): string {
  // Simple summary generation: take the first 97 characters and add "..."
  if (description.length <= 100) {
    return description
  }

  // Find the last space before the 97th character to avoid cutting words
  const lastSpaceIndex = description.substring(0, 97).lastIndexOf(" ")

  if (lastSpaceIndex === -1) {
    // If no space found, just cut at 97 characters
    return description.substring(0, 97) + "..."
  }

  return description.substring(0, lastSpaceIndex) + "..."
}
