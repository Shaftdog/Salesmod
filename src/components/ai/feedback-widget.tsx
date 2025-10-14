"use client"

import * as React from "react"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface FeedbackWidgetProps {
  draftId?: string
  suggestionId?: string
  compact?: boolean
}

export function FeedbackWidget({
  draftId,
  suggestionId,
  compact = false,
}: FeedbackWidgetProps) {
  const [feedbackGiven, setFeedbackGiven] = React.useState(false)
  const [feedbackText, setFeedbackText] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const submitFeedback = async (helpful: boolean, text?: string) => {
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("Not authenticated")
      }

      const { error } = await supabase.from('ai_feedback').insert({
        draft_id: draftId || null,
        suggestion_id: suggestionId || null,
        helpful,
        feedback_text: text || null,
        user_id: user.id,
      })

      if (error) throw error

      setFeedbackGiven(true)
      toast({
        title: "Thank you!",
        description: "Your feedback helps improve the AI",
      })

      setPopoverOpen(false)
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleThumbsUp = () => {
    submitFeedback(true)
  }

  const handleThumbsDown = () => {
    setPopoverOpen(true)
  }

  const handleDetailedFeedback = () => {
    submitFeedback(false, feedbackText)
  }

  if (feedbackGiven) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Thanks for your feedback!</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleThumbsUp}
          disabled={isSubmitting}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={isSubmitting}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">
                  What could be better?
                </p>
                <Textarea
                  placeholder="Optional: Tell us how we can improve..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDetailedFeedback}
                  disabled={isSubmitting}
                >
                  Submit
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleThumbsUp}
        disabled={isSubmitting}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        Yes
      </Button>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            No
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">
                What could be better?
              </p>
              <Textarea
                placeholder="Optional: Tell us how we can improve..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPopoverOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDetailedFeedback}
                disabled={isSubmitting}
              >
                Submit
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

