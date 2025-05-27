"use client"

import { useState } from "react"
import Link from "next/link"
import type { Topic } from "@/lib/db"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Award, Users } from "lucide-react"
import { deleteTopic } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface TopicCardProps {
  topic: Topic
  isOwner?: boolean
  ranking?: number
}

export function TopicCard({ topic, isOwner = false, ranking }: TopicCardProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this topic?")) {
      setIsDeleting(true)
      const result = await deleteTopic(topic.id)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        setIsDeleting(false)
      }
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{topic.summary}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            {ranking && (
              <Badge variant={ranking <= 3 ? "default" : "outline"} className="ml-2">
                {ranking === 1 && <Award className="w-3 h-3 mr-1" />}
                Rank #{ranking}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="ml-2">
                Score: {topic.average_score ? topic.average_score : "-"}
              </Badge>
              {topic.vote_count > 0 && (
                <Badge variant="outline" className="ml-1">
                  <Users className="w-3 h-3 mr-1" /> {topic.vote_count}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{topic.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">Proposed by: {topic.user_name}</p>
      </CardContent>
      {isOwner && (
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Link href={`/edit-topic/${topic.id}`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
