"use client"

import { useState } from "react"
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
import { SortableTopicItem } from "./sortable-topic-item"
import { Button } from "@/components/ui/button"
import { updateVotePositions } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface SortableTopicListProps {
  topics: Array<{
    id: number
    topic_id: number
    description: string
    summary: string
    user_name: string
    position: number
  }>
}

export function SortableTopicList({ topics: initialTopics }: SortableTopicListProps) {
  const [topics, setTopics] = useState(initialTopics)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTopics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update positions
        return newItems.map((item, index) => ({
          ...item,
          position: index + 1,
        }))
      })

      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const votes = topics.map((topic) => ({
        topicId: topic.topic_id,
        position: topic.position,
      }))

      const result = await updateVotePositions(votes)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your vote order has been updated",
        })
        setHasChanges(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vote order",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={topics} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {topics.map((topic) => (
              <SortableTopicItem key={topic.id} topic={topic} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {topics.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save Order"}
          </Button>
        </div>
      )}

      {topics.length === 0 && (
        <p className="text-center text-muted-foreground">You haven't voted for any topics yet.</p>
      )}
    </div>
  )
}
