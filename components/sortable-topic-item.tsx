"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from "lucide-react"
import { removeVote } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface SortableTopicItemProps {
  topic: {
    id: number
    topic_id: number
    description: string
    summary: string
    user_name: string
    position: number
  }
}

export function SortableTopicItem({ topic }: SortableTopicItemProps) {
  const { toast } = useToast()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topic.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleRemove = async () => {
    if (confirm("Are you sure you want to remove this vote?")) {
      const result = await removeVote(topic.topic_id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Vote removed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove vote",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardContent className="flex items-center p-4">
        <div className="flex items-center justify-center p-2 mr-2 cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{topic.summary}</h3>
          <p className="text-sm text-muted-foreground">by {topic.user_name}</p>
        </div>
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 mr-2 font-bold rounded-full bg-secondary">
            {topic.position}
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove} className="text-destructive">
            <X className="w-4 h-4" />
            <span className="sr-only">Remove vote</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
