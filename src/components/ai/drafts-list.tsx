"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  Clock,
  Edit3,
  XCircle,
  Mail,
  FileText,
  Trash2,
  Eye,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAiDrafts, useDeleteDraft } from "@/hooks/use-ai-drafts"
import { useToast } from "@/hooks/use-toast"
import { DraftDetailDialog } from "./draft-detail-dialog"

interface DraftsListProps {
  clientId: string
}

export function DraftsList({ clientId }: DraftsListProps) {
  const { data: drafts, isLoading } = useAiDrafts(clientId)
  const deleteMutation = useDeleteDraft()
  const { toast } = useToast()

  const [selectedDraftId, setSelectedDraftId] = React.useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)

  const handleViewDraft = (draftId: string) => {
    setSelectedDraftId(draftId)
    setDetailDialogOpen(true)
  }

  const handleDelete = async (draftId: string) => {
    try {
      await deleteMutation.mutateAsync(draftId)
      toast({
        title: "Draft deleted",
        description: "The draft has been removed.",
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete draft",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "edited":
        return (
          <Badge variant="outline">
            <Edit3 className="mr-1 h-3 w-3" />
            Edited
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
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Mail className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDraftTypeIcon = (type: string) => {
    switch (type) {
      case "email":
      case "follow_up":
        return <Mail className="h-4 w-4" />
      case "note":
      case "internal_memo":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filterDrafts = (status?: string) => {
    if (!drafts) return []
    if (!status) return drafts
    return drafts.filter((draft) => draft.status === status)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Drafts</CardTitle>
          <CardDescription>Loading drafts...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const pendingDrafts = filterDrafts("pending")
  const approvedDrafts = filterDrafts("approved")
  const allDrafts = drafts || []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Drafts</CardTitle>
          <CardDescription>
            View and manage AI-generated communication drafts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({allDrafts.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingDrafts.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedDrafts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <DraftsTable
                drafts={allDrafts}
                onView={handleViewDraft}
                onDelete={handleDelete}
                getStatusBadge={getStatusBadge}
                getDraftTypeIcon={getDraftTypeIcon}
                isDeleting={deleteMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <DraftsTable
                drafts={pendingDrafts}
                onView={handleViewDraft}
                onDelete={handleDelete}
                getStatusBadge={getStatusBadge}
                getDraftTypeIcon={getDraftTypeIcon}
                isDeleting={deleteMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <DraftsTable
                drafts={approvedDrafts}
                onView={handleViewDraft}
                onDelete={handleDelete}
                getStatusBadge={getStatusBadge}
                getDraftTypeIcon={getDraftTypeIcon}
                isDeleting={deleteMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedDraftId && (
        <DraftDetailDialog
          draftId={selectedDraftId}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      )}
    </>
  )
}

interface DraftsTableProps {
  drafts: any[]
  onView: (id: string) => void
  onDelete: (id: string) => void
  getStatusBadge: (status: string) => React.ReactNode
  getDraftTypeIcon: (type: string) => React.ReactNode
  isDeleting: boolean
}

function DraftsTable({
  drafts,
  onView,
  onDelete,
  getStatusBadge,
  getDraftTypeIcon,
  isDeleting,
}: DraftsTableProps) {
  if (drafts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No drafts found
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.map((draft) => (
            <TableRow key={draft.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDraftTypeIcon(draft.draftType)}
                  <span className="capitalize">
                    {draft.draftType.replace("_", " ")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate">
                  {draft.subject || (
                    <span className="text-muted-foreground italic">
                      {draft.content.substring(0, 50)}...
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(draft.status)}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(draft.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(draft.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(draft.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

