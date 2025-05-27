import { cookies } from "next/headers"
import { NavBar } from "@/components/nav-bar"
import { DraggableTopicList } from "@/components/draggable-topic-list"
import { getTopicsWithUserOrder, getUserVotes } from "../actions"
import { initializeDatabase } from "@/lib/db-init"

export default async function VotePage() {
  // Initialize database if needed
  await initializeDatabase()

  // Get session ID from cookie
  const cookieStore = cookies()
  const sessionId = cookieStore.get("lightning_talk_session_id")?.value || ""

  // Get topics ordered by user's votes
  const topics = await getTopicsWithUserOrder(sessionId)

  // Get user's votes to determine which topics they've already voted on
  const userVotes = await getUserVotes(sessionId)
  const userVotedTopicIds = userVotes.map((vote) => vote.topic_id)

  return (
    <main className="min-h-screen bg-background">
      <NavBar />

      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Vote on Topics</h1>
        <p className="text-muted-foreground mb-8">
          Drag and drop topics to rank them. Your votes are saved automatically.
        </p>

        {topics.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-4">No topics to vote on yet</h2>
            <p className="text-muted-foreground">Check back later when topics have been added.</p>
          </div>
        ) : (
          <DraggableTopicList topics={topics} userVotedTopicIds={userVotedTopicIds} />
        )}
      </div>
    </main>
  )
}
