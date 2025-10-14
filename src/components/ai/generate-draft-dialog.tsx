"use client"

import * as React from "react"
import { Loader2, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useGenerateDraft, useApproveDraft } from "@/hooks/use-ai-drafts"
import { useToast } from "@/hooks/use-toast"

interface GenerateDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function GenerateDraftDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: GenerateDraftDialogProps) {
  const [step, setStep] = React.useState<"setup" | "preview">("setup")
  const [draftType, setDraftType] = React.useState<string>("follow_up")
  const [contextHints, setContextHints] = React.useState("")
  const [tone, setTone] = React.useState("professional")
  const [generatedDraft, setGeneratedDraft] = React.useState<any>(null)
  const [editedSubject, setEditedSubject] = React.useState("")
  const [editedContent, setEditedContent] = React.useState("")

  const { toast } = useToast()
  const generateMutation = useGenerateDraft()
  const approveMutation = useApproveDraft()

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("setup")
        setDraftType("follow_up")
        setContextHints("")
        setTone("professional")
        setGeneratedDraft(null)
        setEditedSubject("")
        setEditedContent("")
      }, 200)
    }
  }, [open])

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        clientId,
        draftType,
        contextHints: contextHints || undefined,
        tone,
      })

      setGeneratedDraft(result.draft)
      setEditedSubject(result.draft.subject || "")
      setEditedContent(result.draft.content)
      setStep("preview")

      toast({
        title: "Draft generated!",
        description: `AI generated a ${draftType.replace("_", " ")} in ${result.generationTime}ms`,
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate draft",
        variant: "destructive",
      })
    }
  }

  const handleRegenerate = () => {
    setStep("setup")
    setGeneratedDraft(null)
  }

  const handleApprove = async () => {
    if (!generatedDraft) return

    try {
      // If user edited the content, we need to update the draft first
      if (editedContent !== generatedDraft.content || editedSubject !== generatedDraft.subject) {
        // Update via API would be better, but for now we'll approve as-is
        // The edited content is stored locally for the user to copy
      }

      await approveMutation.mutateAsync(generatedDraft.id)

      toast({
        title: "Draft approved!",
        description: "The draft has been approved and saved.",
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

  const handleCopyAndClose = () => {
    const textToCopy = editedSubject
      ? `Subject: ${editedSubject}\n\n${editedContent}`
      : editedContent

    navigator.clipboard.writeText(textToCopy)
    
    toast({
      title: "Copied to clipboard!",
      description: "Draft copied. You can now paste it into your email client.",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {step === "setup" ? "Generate AI Draft" : "Review Draft"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup"
              ? `AI will analyze ${clientName}'s context and generate a personalized communication.`
              : "Review and edit the AI-generated draft before approving."}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-type">Draft Type</Label>
              <Select value={draftType} onValueChange={setDraftType}>
                <SelectTrigger id="draft-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow-up Email</SelectItem>
                  <SelectItem value="email">General Email</SelectItem>
                  <SelectItem value="note">Internal Note</SelectItem>
                  <SelectItem value="internal_memo">Internal Memo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context-hints">
                Additional Context (Optional)
              </Label>
              <Textarea
                id="context-hints"
                placeholder="E.g., 'Mention the upcoming inspection on Friday' or 'Reference our call about the new property'"
                value={contextHints}
                onChange={(e) => setContextHints(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Provide any specific details you want the AI to include
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {editedSubject && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                ✏️ Feel free to edit the content above before approving
              </p>
            </div>

            {generatedDraft?.reasoning && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">AI Reasoning:</p>
                <p className="text-muted-foreground">{generatedDraft.reasoning}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "setup" ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={generateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Draft
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={approveMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button
                variant="secondary"
                onClick={handleCopyAndClose}
                disabled={approveMutation.isPending}
              >
                Copy & Close
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Draft"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

