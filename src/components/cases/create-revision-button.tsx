"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Loader2, AlertCircle } from "lucide-react";
import { useCreateRevisionFromCase } from "@/hooks/use-corrections";
import {
  SEVERITY_LEVELS,
  CORRECTION_CATEGORIES,
  SEVERITY_CONFIG,
  CATEGORY_CONFIG,
  type SeverityLevel,
  type CorrectionCategory,
} from "@/types/corrections";
import type { Case } from "@/lib/types";

const revisionSchema = z.object({
  description: z.string().min(10, "Please provide a detailed description (at least 10 characters)"),
  severity: z.enum(SEVERITY_LEVELS),
  category: z.enum(CORRECTION_CATEGORIES),
});

type RevisionFormData = z.infer<typeof revisionSchema>;

interface CreateRevisionButtonProps {
  caseItem: Case;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function CreateRevisionButton({
  caseItem,
  variant = "secondary",
  size = "sm",
}: CreateRevisionButtonProps) {
  const [open, setOpen] = useState(false);
  const createRevision = useCreateRevisionFromCase();

  const form = useForm<RevisionFormData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: {
      description: caseItem.description || "",
      severity: "major",
      category: "data",
    },
  });

  // Only show if case has a linked order
  if (!caseItem.orderId) {
    return null;
  }

  const handleSubmit = async (data: RevisionFormData) => {
    try {
      await createRevision.mutateAsync({
        case_id: caseItem.id,
        description: data.description,
        severity: data.severity,
        category: data.category,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create revision:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
      >
        <FileEdit className="mr-2 h-4 w-4" />
        Create Revision
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-indigo-500" />
              Create Revision Request
            </DialogTitle>
            <DialogDescription>
              Create a revision request for the linked order. This will move the production card to the REVISION stage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Case Info */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{caseItem.caseNumber}</p>
                <Badge variant="outline">{caseItem.caseType}</Badge>
              </div>
              <p className="text-sm">{caseItem.subject}</p>
              {caseItem.order && (
                <p className="text-xs text-muted-foreground">
                  Order: {caseItem.order.orderNumber} - {caseItem.order.propertyAddress}
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
                      <FormLabel>Revision Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what needs to be revised based on the case feedback..."
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be assigned to a Level 3 Researcher for review.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    disabled={createRevision.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createRevision.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Revision
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
