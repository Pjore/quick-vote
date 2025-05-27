import { query } from "./db"
import { initializeDatabase } from "./db-init"

export type Vote = {
  id: number
  session_id: string
  topic_id: number
  placement: number
  created_at?: string
}

export type Topic = {
  id: number
  description: string
  summary: string
  user_name: string
  session_id: string
  created_at: string
  score?: number
}

export async function calculateScores(topics: Topic[]): Promise<Topic[]> {
  // Ensure database is initialized
  await initializeDatabase()

  try {
    // Get all votes
    const votes = await query<Vote>(`SELECT * FROM votes`)

    // Group votes by session
    const votesBySession: Record<string, Vote[]> = {}
    votes.forEach((vote) => {
      if (!votesBySession[vote.session_id]) {
        votesBySession[vote.session_id] = []
      }
      votesBySession[vote.session_id].push(vote)
    })

    // Calculate normalized Borda count for each topic
    const topicsWithScores = topics.map((topic) => {
      let totalScore = 0
      let totalVoters = 0

      // For each session that has votes
      Object.values(votesBySession).forEach((sessionVotes) => {
        // Skip if this session has no votes
        if (sessionVotes.length === 0) return

        // Find this topic's vote in the session
        const vote = sessionVotes.find((v) => v.topic_id === topic.id)

        // If the topic has a vote in this session
        if (vote) {
          // Calculate normalized score: (N - position) / N
          // where N is the total number of topics voted on in this session
          const normalizedScore = (sessionVotes.length - vote.placement) / sessionVotes.length
          totalScore += normalizedScore
        }

        totalVoters++
      })

      // Average score across all voters, or 0 if no votes
      const score = totalVoters > 0 ? totalScore / totalVoters : 0

      return {
        ...topic,
        score,
      }
    })

    return topicsWithScores
  } catch (error) {
    console.error("Error in calculateScores:", error)
    return topics.map((topic) => ({ ...topic, score: 0 }))
  }
}
