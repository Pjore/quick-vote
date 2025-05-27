"use client"

import { useEffect, useState } from "react"
import { TopicCard } from "./topic-card"
import { getSessionId } from "@/lib/session"
import type { Topic } from "@/lib/score-calculator"

interface UserTopicCardProps {
  topic: Topic
  onDelete?: () => void
}

export function UserTopicCard({ topic, onDelete }: UserTopicCardProps) {
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const sessionId = getSessionId()
    setIsOwner(topic.session_id === sessionId)
  }, [topic.session_id])

  return <TopicCard topic={topic} isOwner={isOwner} onDelete={onDelete} />
}
