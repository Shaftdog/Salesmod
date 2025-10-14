"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Phone,
  FileText,
  Target,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePrioritySuggestions, useAcceptSuggestion, useDismissSuggestion } from "@/hooks/use-agent-suggestions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function SuggestionsWidget() {
  const { data: suggestions, isLoading } = usePrioritySuggestions(5)
  const acceptMutation = useAcceptSuggestion()
  const dismissMutation = useDismissSuggestion()
  const { toast } = useToast()
  const router = useRouter()

  const handleAccept = async (suggestionId: string) => {
    try {
      await acceptMutation.mutateAsync(suggestionId)
      toast({
        title: "Suggestion accepted",
        description: "Action has been recorded",
      })
    } catch (error) {
      toast({
        title: "Failed to accept",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleDismiss = async (suggestionId: string) => {
    try {
      await dismissMutation.mutateAsync({ suggestionId })
      toast({
        title: "Suggestion dismissed",
      })
    } catch (error) {
      toast({
        title: "Failed to dismiss",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "follow_up":
        return <Phone className="h-4 w-4" />
      case "deal_action":
        return <Target className="h-4 w-4" />
      case "task_create":
        return <FileText className="h-4 w-4" />
      case "upsell":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-500/10"
      case "medium":
        return "text-yellow-500 bg-yellow-500/10"
      case "low":
        return "text-blue-500 bg-blue-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Suggestions
          </CardTitle>
          <CardDescription>Loading suggestions...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Suggestions
          </CardTitle>
          <CardDescription>
            You're all caught up! No urgent actions needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">
              Check back later for new suggestions
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Suggestions
        </CardTitle>
        <CardDescription>
          {suggestions.length} proactive recommendation{suggestions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {suggestions.map((suggestion: any) => (
              <div
                key={suggestion.id}
                className="rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${getPriorityColor(
                        suggestion.priority
                      )}`}
                    >
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm leading-tight">
                          {suggestion.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(
                            suggestion.priority
                          )}`}
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>
                      {suggestion.client && (
                        <button
                          onClick={() => handleViewClient(suggestion.clientId)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {suggestion.client.name}
                          {suggestion.client.company && ` • ${suggestion.client.company}`}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => handleDismiss(suggestion.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(suggestion.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAccept(suggestion.id)}
                    disabled={acceptMutation.isPending}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

