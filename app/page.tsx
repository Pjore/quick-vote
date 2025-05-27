import { Suspense } from "react"
import { cookies } from "next/headers"
import { Navbar } from "@/components/navbar"
import { TopicCard } from "@/components/topic-card"
import { getTopicsWithScores } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const topics = await getTopicsWithScores()

  // Get session ID from cookies
  const cookieStore = cookies()
  const sessionId = cookieStore.get("user_session_id")?.value || ""

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Lightning Talk Topics</h1>
          <p className="text-muted-foreground">
            Topics are ranked based on user preferences.{" "}
            <Link href="/my-votes" className="underline">
              Rank them yourself!
            </Link>
          </p>
        </div>

        <Suspense fallback={<div>Loading topics...</div>}>
          {topics.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  isOwner={topic.user_session_id === sessionId}
                  ranking={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No topics yet</h2>
              <p className="text-muted-foreground mb-6">Be the first to add a topic for discussion!</p>
              <Link href="/add-topic">
                <Button>Add Topic</Button>
              </Link>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}
