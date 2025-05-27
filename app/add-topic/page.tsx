import { Navbar } from "@/components/navbar"
import { TopicForm } from "@/components/topic-form"

export default function AddTopicPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Topic</h1>
          <p className="text-muted-foreground">Propose a topic for a lightning talk</p>
        </div>

        <TopicForm />
      </main>
    </div>
  )
}
