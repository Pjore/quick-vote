import { getTopicsByScore } from "./actions"
import { UserTopicCard } from "@/components/user-topic-card"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { initializeDatabase } from "@/lib/db-init"

export default async function Home() {
  // Initialize database if needed
  await initializeDatabase()

  // Fetch topics
  const topics = await getTopicsByScore()

  return (
    <main className="min-h-screen bg-background">
      <NavBar />

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Top Lightning Talk Topics</h1>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-4">No topics yet</h2>
            <p className="text-muted-foreground mb-6">Be the first to propose a lightning talk topic!</p>
            <Button asChild>
              <Link href="/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {topics.map((topic) => (
              <UserTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
