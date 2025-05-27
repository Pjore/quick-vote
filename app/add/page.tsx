import { NavBar } from "@/components/nav-bar"
import { TopicForm } from "@/components/topic-form"
import { initializeDatabase } from "@/lib/db-init"

export default async function AddTopicPage() {
  // Initialize database if needed
  await initializeDatabase()

  return (
    <main className="min-h-screen bg-background">
      <NavBar />

      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Add a New Topic</h1>

        <TopicForm />
      </div>
    </main>
  )
}
