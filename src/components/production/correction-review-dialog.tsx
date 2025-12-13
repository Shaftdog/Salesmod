"use client";

import { useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";
import {
  useApproveCorrection,
  useRejectCorrection,
} from "@/hooks/use-corrections";
import {
  SEVERITY_CONFIG,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  type CorrectionRequestWithRelations,
} from "@/types/corrections";
import { formatDistanceToNow } from "date-fns";

const reviewSchema = z.object({
  notes: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface CorrectionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  correction: CorrectionRequestWithRelations;
}

export function CorrectionReviewDialog({
  open,
  onOpenChange,
  correction,
}: CorrectionReviewDialogProps) {
  const [action, setAction] = useState<"approve" | "reject" | "another" | null>(null);

  const approveCorrection = useApproveCorrection();
  const rejectCorrection = useRejectCorrection();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      notes: "",
    },
  });

  const handleApprove = async (data: ReviewFormData) => {
    try {
      await approveCorrection.mutateAsync({
        correction_id: correction.id,
        notes: data.notes,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to approve correction:", error);
    }
  };

  const handleReject = async (data: ReviewFormData, createNew: boolean) => {
    if (!data.notes && !createNew) {
      form.setError("notes", { message: "Please provide rejection notes" });
      return;
    }

    try {
      await rejectCorrection.mutateAsync({
        correction_id: correction.id,
        notes: data.notes || "Needs additional work",
        create_new_correction: createNew,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to reject correction:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    setAction(null);
    onOpenChange(false);
  };

  const isPending = approveCorrection.isPending || rejectCorrection.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-500" />
            Review Correction
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this correction request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Correction Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {correction.production_card?.order?.order_number || "Order"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {correction.production_card?.order?.property_address}
                </p>
              </div>
              <div className="flex gap-2">
                {correction.severity && (
                  <Badge
                    variant="outline"
                    className={`${SEVERITY_CONFIG[correction.severity].bgColor} ${SEVERITY_CONFIG[correction.severity].color}`}
                  >
                    {SEVERITY_CONFIG[correction.severity].label}
                  </Badge>
                )}
                {correction.category && (
                  <Badge variant="outline">
                    {CATEGORY_CONFIG[correction.category].label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Task that triggered correction */}
            {correction.source_task && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Original Task:</p>
                <p className="text-sm">{correction.source_task.title}</p>
              </div>
            )}

            {/* Original Issue */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Issue Description:</p>
              <p className="text-sm">{correction.description}</p>
              {correction.ai_summary && (
                <p className="text-xs text-blue-600 mt-1 italic">
                  AI Summary: {correction.ai_summary}
                </p>
              )}
            </div>

            {/* Resolution Notes */}
            {correction.resolution_notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Resolution Notes:</p>
                <p className="text-sm">{correction.resolution_notes}</p>
              </div>
            )}

            {/* Assignee & Timeline */}
            <div className="pt-2 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
              {correction.assigned_profile && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Corrected by: {correction.assigned_profile.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Created {formatDistanceToNow(new Date(correction.created_at))} ago
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Review Form */}
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Notes (optional for approval)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any notes about your decision..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleApprove)}
                    disabled={isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {approveCorrection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit((data) => handleReject(data, true))}
                    disabled={isPending}
                    variant="secondary"
                    className="flex-1"
                  >
                    {rejectCorrection.isPending && action === "another" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Request Another
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setAction("reject");
                    form.handleSubmit((data) => handleReject(data, false))();
                  }}
                  disabled={isPending}
                  variant="destructive"
                  className="w-full"
                >
                  {rejectCorrection.isPending && action === "reject" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
