"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Topic } from "@/lib/db"
import { generateSummary } from "@/lib/utils"
import { createTopic, updateTopic } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface TopicFormProps {
  topic?: Topic
}

export function TopicForm({ topic }: TopicFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [description, setDescription] = useState(topic?.description || "")
  const [summary, setSummary] = useState(topic?.summary || "")
  const [userName, setUserName] = useState(topic?.user_name || "")
  const [autoGenerateSummary, setAutoGenerateSummary] = useState(!topic)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate summary when description changes
  useEffect(() => {
    if (autoGenerateSummary && description.length >= 10) {
      setSummary(generateSummary(description))
    }
  }, [description, autoGenerateSummary])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)

    // Don't redirect automatically, handle it manually
    formData.set("redirect", "false")

    try {
      const result = topic ? await updateTopic(formData) : await createTopic(formData)

      if (result && result.success) {
        toast({
          title: "Success",
          description: topic ? "Topic updated successfully" : "Topic created successfully",
        })
        router.push("/")
        router.refresh()
      } else if (result && !result.success) {
        setErrors(result.errors)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{topic ? "Edit Topic" : "Add New Topic"}</CardTitle>
          <CardDescription>
            {topic ? "Update your lightning talk topic" : "Propose a new topic for a lightning talk"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your topic in detail (min 10 characters)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoGenerateSummary"
              name="autoGenerateSummary"
              checked={autoGenerateSummary}
              onCheckedChange={(checked) => setAutoGenerateSummary(checked as boolean)}
            />
            <Label htmlFor="autoGenerateSummary">Auto-generate summary from description</Label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="summary">Summary</Label>
              {autoGenerateSummary && (
                <span className="text-xs text-muted-foreground">Auto-generated (max 40 characters)</span>
              )}
              {!autoGenerateSummary && (
                <span className={`text-xs ${summary.length > 40 ? "text-destructive" : "text-muted-foreground"}`}>
                  {summary.length}/40 characters
                </span>
              )}
            </div>
            <Input
              id="summary"
              name="summary"
              placeholder="A brief summary of your topic (min 5 characters)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={autoGenerateSummary}
              maxLength={40}
            />
            {errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              name="userName"
              placeholder="Enter your name (min 3 characters)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            {errors.userName && <p className="text-sm text-destructive">{errors.userName}</p>}
          </div>

          {errors.general && (
            <div className="p-3 text-sm border rounded-md bg-destructive/10 text-destructive border-destructive/20">
              {errors.general}
            </div>
          )}

          {topic && <Input type="hidden" name="id" value={topic.id} />}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : topic ? "Update Topic" : "Add Topic"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
