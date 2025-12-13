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
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCreateCorrection } from "@/hooks/use-corrections";
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
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createCorrection = useCreateCorrection();

  const form = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionSchema),
    defaultValues: {
      description: "",
      severity: "minor",
      category: "data",
    },
  });

  const description = form.watch("description");

  const generateAISummary = useCallback(async (descriptionText: string) => {
    if (!descriptionText || descriptionText.length < 20) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGeneratingSummary(true);
    setAiError(null);

    try {
      const response = await fetch("/api/ai/corrections/summarize", {
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
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setAiSummary(data.summary);

      // Update form with AI suggestions
      if (data.suggested_severity) {
        form.setValue("severity", data.suggested_severity);
      }
      if (data.suggested_category) {
        form.setValue("category", data.suggested_category);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error("AI summary error:", error);
      setAiError("Could not generate AI summary. You can still submit manually.");
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [task.title, task.description, productionCard.order, form]);

  // Generate AI summary when user has typed enough
  useEffect(() => {
    if (description.length >= 20 && !isGeneratingSummary) {
      const debounce = setTimeout(() => {
        generateAISummary(description);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [description, isGeneratingSummary, generateAISummary]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (data: CorrectionFormData) => {
    try {
      await createCorrection.mutateAsync({
        production_card_id: productionCard.id,
        source_task_id: task.id,
        description: data.description,
        severity: data.severity,
        category: data.category,
        ai_summary: aiSummary || undefined,
      });

      form.reset();
      setAiSummary(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create correction:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    setAiSummary(null);
    setAiError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
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
              {(isGeneratingSummary || aiSummary) && (
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      AI Summary
                    </span>
                    {isGeneratingSummary && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                  </div>
                  {aiSummary && (
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {aiSummary}
                    </p>
                  )}
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
                  disabled={createCorrection.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {createCorrection.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Correction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
