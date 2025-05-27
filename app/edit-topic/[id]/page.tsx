import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { TopicForm } from "@/components/topic-form"
import { getTopicById } from "@/lib/db"

interface EditTopicPageProps {
  params: {
    id: string
  }
}

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const id = Number.parseInt(params.id)

  if (isNaN(id)) {
    notFound()
  }

  const topic = await getTopicById(id)
  const cookieStore = cookies()
  const sessionId = cookieStore.get("user_session_id")?.value || ""

  // Check if topic exists and belongs to the user
  if (!topic || topic.user_session_id !== sessionId) {
    redirect("/")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Topic</h1>
          <p className="text-muted-foreground">Update your lightning talk topic</p>
        </div>

        <TopicForm topic={topic} />
      </main>
    </div>
  )
}
