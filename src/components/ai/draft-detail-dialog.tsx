"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  Copy,
  Edit3,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  useAiDraft,
  useEditDraft,
  useApproveDraft,
  useRejectDraft,
  useMarkDraftAsSent,
} from "@/hooks/use-ai-drafts"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { FeedbackWidget } from "./feedback-widget"

interface DraftDetailDialogProps {
  draftId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DraftDetailDialog({
  draftId,
  open,
  onOpenChange,
}: DraftDetailDialogProps) {
  const { data: draft, isLoading } = useAiDraft(draftId)
  const editMutation = useEditDraft()
  const approveMutation = useApproveDraft()
  const rejectMutation = useRejectDraft()
  const markSentMutation = useMarkDraftAsSent()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = React.useState(false)
  const [editedSubject, setEditedSubject] = React.useState("")
  const [editedContent, setEditedContent] = React.useState("")

  React.useEffect(() => {
    if (draft && open) {
      setEditedSubject(draft.subject || "")
      setEditedContent(draft.content)
      setIsEditing(draft.status === "pending")
    }
  }, [draft, open])

  const handleCopy = () => {
    const textToCopy = editedSubject
      ? `Subject: ${editedSubject}\n\n${editedContent}`
      : editedContent

    navigator.clipboard.writeText(textToCopy)
    toast({
      title: "Copied!",
      description: "Draft copied to clipboard",
    })
  }

  const handleSave = async () => {
    try {
      await editMutation.mutateAsync({
        draftId,
        content: editedContent,
        subject: editedSubject || undefined,
      })

      toast({
        title: "Draft updated",
        description: "Your changes have been saved",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update draft",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(draftId)
      toast({
        title: "Draft approved",
        description: "The draft has been approved",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Approval failed",
        description: error instanceof Error ? error.message : "Failed to approve draft",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(draftId)
      toast({
        title: "Draft rejected",
        description: "The draft has been rejected",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Rejection failed",
        description: error instanceof Error ? error.message : "Failed to reject draft",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsSent = async () => {
    try {
      await markSentMutation.mutateAsync(draftId)
      toast({
        title: "Marked as sent",
        description: "The draft has been marked as sent",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update draft",
        variant: "destructive",
      })
    }
  }

  if (isLoading || !draft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const getStatusBadge = () => {
    switch (draft.status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      case "sent":
        return (
          <Badge className="bg-blue-500/10 text-blue-500">
            <Mail className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        )
      default:
        return <Badge variant="secondary">{draft.status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-4 right-14">
          {getStatusBadge()}
        </div>
        <DialogHeader>
          <DialogTitle>Draft Details</DialogTitle>
          <DialogDescription>
            Created {formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {draft.subject && (
            <div className="space-y-2">
              <Label htmlFor="draft-subject">Subject</Label>
              {isEditing ? (
                <Input
                  id="draft-subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                />
              ) : (
                <div className="rounded-md border p-3 bg-muted">
                  {editedSubject}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="draft-content">Content</Label>
            {isEditing ? (
              <Textarea
                id="draft-content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            ) : (
              <div className="rounded-md border p-4 bg-muted whitespace-pre-wrap text-sm">
                {editedContent}
              </div>
            )}
          </div>

          {draft.contextSnapshot && (
            <div className="rounded-lg bg-muted p-3 text-xs">
              <p className="font-medium mb-1">Context Used:</p>
              <p className="text-muted-foreground">
                • Last contact: {draft.contextSnapshot.engagement?.daysSinceLastContact || "Unknown"} days ago
              </p>
              <p className="text-muted-foreground">
                • Active deals: {draft.contextSnapshot.deals?.total || 0}
              </p>
              <p className="text-muted-foreground">
                • Pending tasks: {draft.contextSnapshot.tasks?.total || 0}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Type: {draft.draftType.replace("_", " ")}</span>
            <span>•</span>
            <span>Tokens: {draft.tokensUsed}</span>
            {draft.approvedAt && (
              <>
                <span>•</span>
                <span>
                  Approved {formatDistanceToNow(new Date(draft.approvedAt), { addSuffix: true })}
                </span>
              </>
            )}
          </div>

          {(draft.status === "approved" || draft.status === "sent") && (
            <div className="pt-4 border-t">
              <FeedbackWidget draftId={draft.id} compact />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>

          {draft.status === "pending" || draft.status === "edited" ? (
            <>
              {isEditing ? (
                <Button onClick={handleSave} disabled={editMutation.isPending}>
                  {editMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
              >
                Reject
              </Button>

              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </>
          ) : draft.status === "approved" ? (
            <Button onClick={handleMarkAsSent} disabled={markSentMutation.isPending}>
              {markSentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Mark as Sent
                </>
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

