import { cookies } from "next/headers"
import { Navbar } from "@/components/navbar"
import { TopicCard } from "@/components/topic-card"
import { getTopicsByUserSession } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MyTopicsPage() {
  const cookieStore = cookies()
  const sessionId = cookieStore.get("user_session_id")?.value || ""
  const topics = await getTopicsByUserSession(sessionId)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Topics</h1>
          <p className="text-muted-foreground">Manage your lightning talk topics</p>
        </div>

        {topics.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} isOwner={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">You haven't created any topics yet</h2>
            <p className="text-muted-foreground mb-6">Add a topic to get started!</p>
            <Link href="/add-topic">
              <Button>Add Topic</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
