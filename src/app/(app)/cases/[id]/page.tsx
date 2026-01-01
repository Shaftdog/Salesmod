"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCase, useUpdateCase, useCaseComments, useCreateCaseComment, useDeleteCase } from "@/hooks/use-cases";
import { useCorrections, useCreateRevisionFromCase } from "@/hooks/use-corrections";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Loader2, Building2, FileText, User, Calendar, MessageSquare, CheckCircle, AlertCircle, ArrowLeft, LayoutGrid, Plus, Sparkles, CheckCircle2, ListTodo, Trash2 } from "lucide-react";
import { caseStatuses, casePriorities } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ParsedTask {
  title: string;
  description: string;
}

export default function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [caseId, setCaseId] = React.useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [resolution, setResolution] = useState("");
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionDescription, setRevisionDescription] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // AI state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastProcessedDescRef = useRef<string | null>(null);

  const router = useRouter();

  React.useEffect(() => {
    params.then((p) => setCaseId(p.id));
  }, [params]);

  const { data: caseData, isLoading, error } = useCase(caseId || "");
  const { data: comments = [] } = useCaseComments(caseId || "");
  const { data: corrections = [], isLoading: correctionsLoading, error: correctionsError } = useCorrections(caseId ? { case_id: caseId } : undefined);

  const { clients } = useClients();
  const { data: currentUser } = useCurrentUser();
  const updateCase = useUpdateCase();
  const createComment = useCreateCaseComment();
  const createRevision = useCreateRevisionFromCase();
  const deleteCase = useDeleteCase();
  const queryClient = useQueryClient();

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

  const handleDeleteCase = async () => {
    if (!caseId) return;
    await deleteCase.mutateAsync(caseId);
    setShowDeleteDialog(false);
    router.push('/cases');
  };

  const handleCreateRevision = async () => {
    if (!caseId || !revisionDescription.trim()) return;
    try {
      const supabase = createClient();

      // Create the revision - the DB function creates the parent task
      // Pass AI summary as description for the parent task
      const correction = await createRevision.mutateAsync({
        case_id: caseId,
        description: aiSummary || revisionDescription.trim(), // Use AI summary for parent
        ai_summary: aiSummary || undefined,
      });

      // If we have parsed tasks, create them as subtasks under the parent
      if (parsedTasks.length > 0 && correction) {
        // Find the parent task that was just created (most recent REVISION task for this production card)
        const { data: parentTask } = await supabase
          .from('production_tasks')
          .select('id, tenant_id, production_card_id, assigned_to')
          .eq('production_card_id', correction.production_card_id)
          .eq('stage', 'REVISION')
          .is('parent_task_id', null) // Parent tasks have no parent
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (parentTask) {
          // Update parent task title to be a summary
          await supabase
            .from('production_tasks')
            .update({
              title: `REVISION: ${caseData?.subject || 'Case Revision'}`,
              description: aiSummary || revisionDescription.trim(),
            })
            .eq('id', parentTask.id);

          // Create subtasks for each parsed task
          const subtasks = parsedTasks.map((task, index) => ({
            tenant_id: parentTask.tenant_id,
            production_card_id: parentTask.production_card_id,
            parent_task_id: parentTask.id,
            title: task.title,
            description: task.description,
            stage: 'REVISION',
            status: 'pending',
            assigned_to: parentTask.assigned_to,
            role: 'appraiser',
            is_required: true,
            sort_order: index,
          }));

          const { error: subtasksError } = await supabase
            .from('production_tasks')
            .insert(subtasks);

          if (subtasksError) {
            console.error('Error creating subtasks:', subtasksError);
          }

          // Invalidate queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['production-cards'] });
        }
      }

      // Reset all revision dialog state
      setRevisionDescription("");
      setAiSummary(null);
      setAiReasoning(null);
      setParsedTasks([]);
      setAiError(null);
      lastProcessedDescRef.current = null;
      setRevisionDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook's onError
    }
  };

  // AI generation for revision dialog
  const generateAIAnalysis = useCallback(async (descriptionText: string) => {
    if (!descriptionText || descriptionText.length < 20 || !caseData) return;

    // Skip if we already processed this exact description
    if (lastProcessedDescRef.current === descriptionText) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      // Call both APIs in parallel
      const [summaryRes, tasksRes] = await Promise.all([
        fetch("/api/ai/corrections/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userDescription: descriptionText,
            taskTitle: caseData.subject,
            taskDescription: caseData.description,
            orderContext: {
              order_number: caseData.order?.orderNumber,
              property_address: caseData.order?.propertyAddress,
              client_name: caseData.client?.companyName,
            },
          }),
          signal: abortControllerRef.current.signal,
        }),
        fetch("/api/ai/corrections/parse-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: descriptionText,
            requestType: "revision",
            orderContext: {
              order_number: caseData.order?.orderNumber,
              property_address: caseData.order?.propertyAddress,
            },
          }),
          signal: abortControllerRef.current.signal,
        }),
      ]);

      // Process summary response
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setAiSummary(summaryData.summary);
        setAiReasoning(summaryData.reasoning);
      }

      // Process tasks response
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.tasks && Array.isArray(tasksData.tasks)) {
          setParsedTasks(tasksData.tasks);
        }
      }

      lastProcessedDescRef.current = descriptionText;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error("AI analysis error:", error);
      setAiError("Could not generate AI analysis. You can still submit manually.");
    } finally {
      setIsGeneratingAI(false);
    }
  }, [caseData]);

  // Generate AI analysis when user has typed enough (debounced)
  useEffect(() => {
    if (revisionDialogOpen && revisionDescription.length >= 20 && !isGeneratingAI) {
      const debounce = setTimeout(() => {
        generateAIAnalysis(revisionDescription);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [revisionDescription, revisionDialogOpen, isGeneratingAI, generateAIAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

              {/* Create Revision Button - only show if case has an order */}
              {caseData.order && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => setRevisionDialogOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Revision
                  </Button>
                </div>
              )}

              {/* Delete Case Button */}
              <div className="pt-2 border-t">
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Case
                </Button>
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

      {/* Create Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={(open) => {
        setRevisionDialogOpen(open);
        if (!open) {
          // Reset state when dialog closes
          setRevisionDescription("");
          setAiSummary(null);
          setAiReasoning(null);
          setParsedTasks([]);
          setAiError(null);
          lastProcessedDescRef.current = null;
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              Create Revision Request
            </DialogTitle>
            <DialogDescription>
              Create a revision request for order {caseData.order?.orderNumber}. This will add a correction task to the production board.
            </DialogDescription>
          </DialogHeader>

          {/* Case Info */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="text-sm font-medium">{caseData.subject}</p>
            <p className="text-xs text-muted-foreground">
              {caseData.order?.orderNumber} - {caseData.order?.propertyAddress}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What needs to be revised? *</label>
              <Textarea
                placeholder="Describe what needs to be corrected or revised. Be specific about what's wrong and how it should be fixed..."
                value={revisionDescription}
                onChange={(e) => setRevisionDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Type at least 20 characters for AI analysis
              </p>
            </div>

            {/* AI Summary */}
            {(isGeneratingAI || aiSummary) && (
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    AI Summary
                  </span>
                  {isGeneratingAI && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                </div>
                {aiSummary && (
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {aiSummary}
                  </p>
                )}
                {aiReasoning && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    {aiReasoning}
                  </p>
                )}
              </div>
            )}

            {/* Parsed Tasks */}
            {parsedTasks.length > 0 && (
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Tasks to Create ({parsedTasks.length})
                  </span>
                </div>
                <ul className="space-y-2">
                  {parsedTasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    {aiError}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevisionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRevision}
              disabled={!revisionDescription.trim() || createRevision.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createRevision.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Revision{parsedTasks.length > 0 ? ` (${parsedTasks.length} tasks)` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete case {caseData.caseNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCase}
              disabled={deleteCase.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

