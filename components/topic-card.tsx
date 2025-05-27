"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteTopic } from "@/app/actions"
import { getSessionId } from "@/lib/session"
import type { Topic } from "@/lib/score-calculator"

interface TopicCardProps {
  topic: Topic
  isDraggable?: boolean
  isOwner?: boolean
  onDelete?: () => void
}

export function TopicCard({ topic, isDraggable = false, isOwner = false, onDelete }: TopicCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const sessionId = getSessionId()
    const result = await deleteTopic(topic.id, sessionId)
    setIsDeleting(false)

    if (result.success && onDelete) {
      onDelete()
    }
  }

  return (
    <Card className={`w-full mb-4 ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-lg">{topic.summary}</h3>
            <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
          </div>
          {topic.score !== undefined && (
            <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm">
              Score: {topic.score.toFixed(2)}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Proposed by: {topic.user_name}</div>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
