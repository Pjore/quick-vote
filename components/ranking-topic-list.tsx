"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { RankingTopicItem } from "./ranking-topic-item"
import { updateVotePositions } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import type { Topic } from "@/lib/db"

interface RankingTopicListProps {
  topics: Topic[]
}

export function RankingTopicList({ topics: initialTopics }: RankingTopicListProps) {
  // Single list of all topics
  const [topics, setTopics] = useState<Topic[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Initialize topics sorted by user position first, then creation date
  useEffect(() => {
    const sortedTopics = [...initialTopics].sort((a, b) => {
      // If both have positions, sort by position
      if (a.user_position && b.user_position) {
        return a.user_position - b.user_position
      }
      // If only a has position, a comes first
      if (a.user_position) return -1
      // If only b has position, b comes first
      if (b.user_position) return 1
      // If neither has position, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setTopics(sortedTopics)
  }, [initialTopics])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTopics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })

      // Auto-save the new order
      saveRankings()
    }
  }

  const saveRankings = async () => {
    setIsSaving(true)

    try {
      // Create an array of votes with positions
      const votes = topics.map((topic, index) => ({
        topicId: topic.id,
        position: index + 1, // Position starts at 1
      }))

      const result = await updateVotePositions(votes)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your rankings have been updated",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update rankings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rankings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Arrange Topics in Your Preferred Order</h2>
      <p className="text-muted-foreground mb-4">
        Drag and drop topics to rank them. Changes are saved automatically. Topics at the top will receive higher
        rankings.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="bg-muted/20 p-4 rounded-lg">
          <SortableContext items={topics.map((t) => ({ id: t.id }))} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {topics.length > 0 ? (
                topics.map((topic, index) => (
                  <RankingTopicItem key={topic.id} topic={topic} position={index + 1} isRanked={true} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No topics available to rank</p>
              )}
            </div>
          </SortableContext>
        </div>
      </DndContext>

      {isSaving && <div className="text-center text-sm text-muted-foreground">Saving your rankings...</div>}
    </div>
  )
}
