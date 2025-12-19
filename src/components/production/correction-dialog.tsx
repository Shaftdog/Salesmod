"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ListTodo } from "lucide-react";
import { useCreateCorrection } from "@/hooks/use-corrections";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  SEVERITY_LEVELS,
  CORRECTION_CATEGORIES,
  SEVERITY_CONFIG,
  CATEGORY_CONFIG,
  type SeverityLevel,
  type CorrectionCategory,
} from "@/types/corrections";

const correctionSchema = z.object({
  description: z.string().min(10, "Please provide a detailed description (at least 10 characters)"),
  severity: z.enum(SEVERITY_LEVELS),
  category: z.enum(CORRECTION_CATEGORIES),
});

type CorrectionFormData = z.infer<typeof correctionSchema>;

interface ParsedTask {
  title: string;
  description: string;
}

interface CorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    description?: string;
    stage: string;
    assigned_to?: string;
  };
  productionCard: {
    id: string;
    order?: {
      order_number: string | null;
      property_address: string | null;
      client?: {
        company_name?: string | null;
      } | null;
    } | null;
  };
  assignedProfile?: {
    full_name: string;
  };
}

export function CorrectionDialog({
  open,
  onOpenChange,
  task,
  productionCard,
  assignedProfile,
}: CorrectionDialogProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastProcessedDescRef = useRef<string | null>(null);

  const createCorrection = useCreateCorrection();
  const queryClient = useQueryClient();

  const form = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionSchema),
    defaultValues: {
      description: "",
      severity: "minor",
      category: "data",
    },
  });

  const description = form.watch("description");

  const generateAIAnalysis = useCallback(async (descriptionText: string) => {
    if (!descriptionText || descriptionText.length < 20) return;

    // Skip if we already processed this exact description
    if (lastProcessedDescRef.current === descriptionText) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setAiError(null);

    try {
      // Call both APIs in parallel
      const [summaryRes, tasksRes] = await Promise.all([
        fetch("/api/ai/corrections/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userDescription: descriptionText,
            taskTitle: task.title,
            taskDescription: task.description,
            orderContext: {
              order_number: productionCard.order?.order_number,
              property_address: productionCard.order?.property_address,
              client_name: productionCard.order?.client?.company_name,
            },
          }),
          signal: abortControllerRef.current.signal,
        }),
        fetch("/api/ai/corrections/parse-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: descriptionText,
            requestType: "correction",
            orderContext: {
              order_number: productionCard.order?.order_number,
              property_address: productionCard.order?.property_address,
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

        // Update form with AI suggestions
        if (summaryData.suggested_severity) {
          form.setValue("severity", summaryData.suggested_severity);
        }
        if (summaryData.suggested_category) {
          form.setValue("category", summaryData.suggested_category);
        }
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
      setIsGenerating(false);
    }
  }, [task.title, task.description, productionCard.order, form]);

  // Generate AI analysis when user has typed enough (debounced)
  useEffect(() => {
    if (open && description.length >= 20 && !isGenerating) {
      const debounce = setTimeout(() => {
        generateAIAnalysis(description);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [description, open, isGenerating, generateAIAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (data: CorrectionFormData) => {
    setIsCreating(true);

    try {
      // Create the correction (this creates 1 task in the DB function)
      const correction = await createCorrection.mutateAsync({
        production_card_id: productionCard.id,
        source_task_id: task.id,
        description: data.description,
        severity: data.severity,
        category: data.category,
        ai_summary: aiSummary || undefined,
      });

      // If we have parsed tasks, create additional production tasks
      if (parsedTasks.length > 1 && correction) {
        const supabase = createClient();

        // Get the correction data for tenant_id and assigned_to
        const { data: correctionData } = await supabase
          .from('correction_requests')
          .select('production_card_id, tenant_id, assigned_to')
          .eq('id', correction.id)
          .single();

        if (correctionData?.production_card_id) {
          // Create additional tasks (skip first one since DB function already created one)
          const additionalTasks = parsedTasks.slice(1).map((parsedTask, index) => ({
            tenant_id: correctionData.tenant_id,
            production_card_id: correctionData.production_card_id,
            title: parsedTask.title,
            description: parsedTask.description,
            stage: 'CORRECTION',
            status: 'pending',
            assigned_to: correctionData.assigned_to,
            role: 'appraiser',
            is_required: true,
            sort_order: index + 1,
          }));

          if (additionalTasks.length > 0) {
            const { error: tasksError } = await supabase
              .from('production_tasks')
              .insert(additionalTasks);

            if (tasksError) {
              console.error('Error creating additional tasks:', tasksError);
            }
          }

          // Update the first task title to match the first parsed task
          if (parsedTasks.length > 0) {
            const { data: existingTasks } = await supabase
              .from('production_tasks')
              .select('id')
              .eq('production_card_id', correctionData.production_card_id)
              .eq('stage', 'CORRECTION')
              .order('created_at', { ascending: true })
              .limit(1);

            if (existingTasks?.[0]) {
              await supabase
                .from('production_tasks')
                .update({
                  title: parsedTasks[0].title,
                  description: parsedTasks[0].description,
                })
                .eq('id', existingTasks[0].id);
            }
          }
        }

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['production-cards'] });
      }

      form.reset();
      setAiSummary(null);
      setAiReasoning(null);
      setParsedTasks([]);
      lastProcessedDescRef.current = null;
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create correction:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setAiSummary(null);
    setAiReasoning(null);
    setParsedTasks([]);
    setAiError(null);
    lastProcessedDescRef.current = null;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Request Correction
          </DialogTitle>
          <DialogDescription>
            Report an issue with this task that needs to be corrected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {productionCard.order?.order_number} - {productionCard.order?.property_address}
            </p>
            {assignedProfile?.full_name && (
              <p className="text-xs text-muted-foreground">
                Assigned to: {assignedProfile.full_name}
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What needs to be corrected? *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the issue in detail. For example: 'The comparable at 123 Main St has the wrong square footage listed. It shows 2,000 sq ft but should be 2,450 sq ft based on county records.'"
                        rows={4}
                        aria-label="Correction description"
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about what's wrong and how it should be fixed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Summary */}
              {(isGenerating || aiSummary) && (
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      AI Summary
                    </span>
                    {isGenerating && (
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
                    {parsedTasks.map((parsedTask, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            {parsedTask.title}
                          </p>
                          {parsedTask.description && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {parsedTask.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{aiError}</AlertDescription>
                </Alert>
              )}

              {/* Severity & Category */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEVERITY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`${SEVERITY_CONFIG[level].bgColor} ${SEVERITY_CONFIG[level].color}`}
                                >
                                  {SEVERITY_CONFIG[level].label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CORRECTION_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {CATEGORY_CONFIG[category].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || createCorrection.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {(isCreating || createCorrection.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Correction{parsedTasks.length > 0 ? ` (${parsedTasks.length} tasks)` : ''}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
