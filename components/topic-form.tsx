"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { addTopic, generateTopicSummary } from "@/app/actions"
import { getSessionId } from "@/lib/session"

export function TopicForm() {
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [summary, setSummary] = useState("")
  const [userName, setUserName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // Auto-generate summary when description changes
  useEffect(() => {
    const generateSummary = async () => {
      if (description.length >= 10) {
        setIsGeneratingSummary(true)
        const result = await generateTopicSummary(description)
        setSummary(result.summary)
        setIsGeneratingSummary(false)
      }
    }

    // Use a debounce to avoid too many requests
    const timeoutId = setTimeout(generateSummary, 500)
    return () => clearTimeout(timeoutId)
  }, [description])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Validate inputs
    if (description.length < 10) {
      setError("Description must be at least 10 characters long")
      setIsSubmitting(false)
      return
    }

    if (summary.length < 5 || summary.length > 100) {
      setError("Summary must be between 5 and 100 characters long")
      setIsSubmitting(false)
      return
    }

    if (userName.length < 3) {
      setError("User name must be at least 3 characters long")
      setIsSubmitting(false)
      return
    }

    const sessionId = getSessionId()
    const formData = new FormData()
    formData.append("description", description)
    formData.append("summary", summary)
    formData.append("userName", userName)
    formData.append("sessionId", sessionId)

    const result = await addTopic(formData)
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      // Redirect to home page on success
      router.push("/")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Propose a Lightning Talk Topic</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your lightning talk topic in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary {isGeneratingSummary && "(Generating...)"}</Label>
            <Input
              id="summary"
              placeholder="A brief summary of your topic..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Between 5 and 100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              placeholder="Enter your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Topic"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
