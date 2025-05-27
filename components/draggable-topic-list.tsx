"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { TopicCard } from "./topic-card"
import { saveVotes } from "@/app/actions"
import { getSessionId } from "@/lib/session"
import type { Topic } from "@/lib/score-calculator"

interface DraggableTopicListProps {
  topics: Topic[]
  userVotedTopicIds: number[]
}

export function DraggableTopicList({ topics: initialTopics, userVotedTopicIds }: DraggableTopicListProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update topics when initialTopics changes
  useEffect(() => {
    setTopics(initialTopics)
  }, [initialTopics])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(topics)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setTopics(items)
    setHasChanges(true)

    // Save the new order
    await saveVotesOrder(items)
  }

  const saveVotesOrder = async (items: Topic[]) => {
    setIsSaving(true)

    const sessionId = getSessionId()
    const votes = items.map((topic, index) => ({
      topicId: topic.id,
      placement: index,
    }))

    await saveVotes(votes, sessionId)
    setHasChanges(false)
    setIsSaving(false)
  }

  // Check if there are new topics that the user hasn't voted on yet
  const hasNewTopics = topics.some((topic) => !userVotedTopicIds.includes(topic.id))

  return (
    <div className="w-full max-w-2xl mx-auto">
      {hasNewTopics && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md mb-6">
          There are new topics that you haven't voted on yet. Drag and drop to reorder the list and save your votes.
        </div>
      )}

      {isSaving && <div className="bg-blue-100 text-blue-800 p-4 rounded-md mb-6">Saving your votes...</div>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="topics">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {topics.map((topic, index) => (
                <Draggable key={topic.id} draggableId={topic.id.toString()} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <TopicCard topic={topic} isDraggable={true} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
