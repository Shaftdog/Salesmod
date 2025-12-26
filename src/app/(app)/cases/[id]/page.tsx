"use client";

import React, { useState } from "react";
import { useCase, useUpdateCase, useCaseComments, useCreateCaseComment } from "@/hooks/use-cases";
import { useCorrections } from "@/hooks/use-corrections";
import { useClients } from "@/hooks/use-clients";
import { useCurrentUser } from "@/hooks/use-appraisers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CaseStatusBadge, CasePriorityBadge } from "@/components/cases/case-status-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Building2, FileText, User, Calendar, MessageSquare, CheckCircle, AlertCircle, ArrowLeft, LayoutGrid } from "lucide-react";
import { caseStatuses, casePriorities } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [caseId, setCaseId] = React.useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [resolution, setResolution] = useState("");

  const router = useRouter();

  React.useEffect(() => {
    params.then((p) => setCaseId(p.id));
  }, [params]);

  const { data: caseData, isLoading, error } = useCase(caseId || "");
  const { data: comments = [] } = useCaseComments(caseId || "");
  const { data: corrections = [] } = useCorrections(caseId ? { case_id: caseId } : undefined);
  const { clients } = useClients();
  const { data: currentUser } = useCurrentUser();
  const updateCase = useUpdateCase();
  const createComment = useCreateCaseComment();

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData) return;
    await updateCase.mutateAsync({
      id: caseData.id,
      status: newStatus,
    });
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!caseData) return;
    await updateCase.mutateAsync({
      id: caseData.id,
      priority: newPriority,
    });
  };

  const handleResolveCase = async () => {
    if (!caseData || !resolution.trim()) return;
    await updateCase.mutateAsync({
      id: caseData.id,
      status: 'resolved',
      resolution: resolution.trim(),
    });
    setResolution("");
  };

  const handleAddComment = async () => {
    if (!caseId || !newComment.trim() || !currentUser) return;
    await createComment.mutateAsync({
      case_id: caseId,
      comment: newComment.trim(),
      is_internal: isInternalComment,
      created_by: currentUser.id,
    });
    setNewComment("");
  };

  // Helper function to format case type for display
  const formatCaseType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!caseId || isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold">Case Not Found</h2>
        <p className="text-muted-foreground mt-2">The case you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push('/cases')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Link href="/cases">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{caseData.subject}</CardTitle>
                    <Badge variant="outline">{caseData.caseNumber}</Badge>
                  </div>
                  <CardDescription>{caseData.description || "No description provided"}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <CaseStatusBadge status={caseData.status} />
                <CasePriorityBadge priority={caseData.priority} />
                <Badge variant="outline">{formatCaseType(caseData.caseType)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">
                    Comments ({comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="resolution">Resolution</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">Created By</h4>
                      <p className="text-sm">{caseData.creator?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">Created At</h4>
                      <p className="text-sm">{format(new Date(caseData.createdAt), "PPP")}</p>
                    </div>
                    {caseData.assignee && (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground">Assigned To</h4>
                          <p className="text-sm">{caseData.assignee.name}</p>
                        </div>
                      </>
                    )}
                    {caseData.client && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Client</h4>
                        <Link href={`/clients/${caseData.client.id}`} className="text-sm text-blue-600 hover:underline">
                          {caseData.client.companyName}
                        </Link>
                      </div>
                    )}
                    {caseData.order && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Related Order</h4>
                        <Link href={`/orders/${caseData.order.id}`} className="text-sm text-blue-600 hover:underline">
                          {caseData.order.orderNumber}
                        </Link>
                      </div>
                    )}
                    {caseData.resolvedAt && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Resolved At</h4>
                        <p className="text-sm">{format(new Date(caseData.resolvedAt), "PPP")}</p>
                      </div>
                    )}
                    {caseData.closedAt && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Closed At</h4>
                        <p className="text-sm">{format(new Date(caseData.closedAt), "PPP")}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="space-y-4 pt-4">
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternalComment}
                          onChange={(e) => setIsInternalComment(e.target.checked)}
                          className="rounded"
                        />
                        Internal comment (not visible to client)
                      </label>
                      <Button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || createComment.isPending}
                      >
                        {createComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Comment
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.creator?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {comment.creator?.name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "PPP 'at' p")}
                              </span>
                              {comment.isInternal && (
                                <Badge variant="secondary" className="text-xs">Internal</Badge>
                              )}
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="resolution" className="space-y-4 pt-4">
                  {caseData.resolution ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <h4 className="font-semibold">Case Resolved</h4>
                      </div>
                      <p className="text-sm">{caseData.resolution}</p>
                      {caseData.resolvedAt && (
                        <p className="text-xs text-muted-foreground">
                          Resolved on {format(new Date(caseData.resolvedAt), "PPP")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        <h4 className="font-semibold">Resolution Pending</h4>
                      </div>
                      <Textarea
                        placeholder="Describe how this case was resolved..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={4}
                      />
                      <Button 
                        onClick={handleResolveCase}
                        disabled={!resolution.trim() || updateCase.isPending}
                      >
                        {updateCase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Mark as Resolved
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Status</label>
                <Select 
                  value={caseData.status} 
                  onValueChange={handleStatusChange}
                  disabled={updateCase.isPending}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {caseStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Priority</label>
                <Select 
                  value={caseData.priority} 
                  onValueChange={handlePriorityChange}
                  disabled={updateCase.isPending}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {casePriorities.map((priority) => (
                      <SelectItem key={priority} value={priority} className="capitalize">
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          {(caseData.client || caseData.order || corrections.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {caseData.client && (
                  <Link href={`/clients/${caseData.client.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{caseData.client.companyName}</span>
                    </div>
                  </Link>
                )}
                {caseData.order && (
                  <Link href={`/orders/${caseData.order.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Order {caseData.order.orderNumber}</span>
                    </div>
                  </Link>
                )}
                {/* Production Cards from Revisions */}
                {corrections.filter(c => c.production_card).map((correction) => (
                  <Link key={correction.id} href="/production/board">
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <LayoutGrid className="h-4 w-4 text-indigo-500" />
                      <div className="flex-1">
                        <span className="text-sm text-indigo-600">
                          Production: {correction.production_card?.order?.order_number || 'View Board'}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {correction.request_type === 'revision' ? 'Revision' : 'Correction'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

