import { cookies } from "next/headers"
import { Navbar } from "@/components/navbar"
import { RankingTopicList } from "@/components/ranking-topic-list"
import { getTopicsWithUserPositions } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MyVotesPage() {
  const cookieStore = cookies()
  const sessionId = cookieStore.get("user_session_id")?.value || ""
  const topics = await getTopicsWithUserPositions(sessionId)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Rank Topics</h1>
          <p className="text-muted-foreground">
            Drag and drop topics to arrange them in your preferred order. Your rankings contribute to the overall topic
            order.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {topics.length > 0 ? (
            <RankingTopicList topics={topics} />
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No topics available to rank</h2>
              <p className="text-muted-foreground mb-6">Add some topics first!</p>
              <Link href="/add-topic">
                <Button>Add Topic</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
