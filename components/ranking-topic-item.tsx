"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, Users } from "lucide-react"
import type { Topic } from "@/lib/db"

interface RankingTopicItemProps {
  topic: Topic
  position: number
  isRanked: boolean
}

export function RankingTopicItem({ topic, position }: RankingTopicItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: topic.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card ref={setNodeRef} style={style} className="relative border-primary/20">
      <CardContent className="flex items-center p-4">
        <div className="flex items-center justify-center p-2 mr-2 cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{topic.summary}</h3>
          <p className="text-sm text-muted-foreground">by {topic.user_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="text-xs text-muted-foreground mb-1">Your Rank</div>
            <div className="flex items-center justify-center w-8 h-8 font-bold rounded-full bg-primary/10 text-primary">
              {position}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs text-muted-foreground mb-1">Avg. Score</div>
            <div className="flex items-center justify-center w-12 h-8 font-bold rounded-full bg-secondary/20 text-secondary-foreground">
              {topic.average_score !== undefined ? topic.average_score : "-"}
            </div>
          </div>
          {topic.vote_count > 0 && (
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Voters</div>
              <div className="flex items-center justify-center px-2 h-8 font-bold rounded-full bg-muted/30">
                <Users className="w-3 h-3 mr-1" /> {topic.vote_count}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
