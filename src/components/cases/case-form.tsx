"use client";

import { useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { caseStatuses, casePriorities, caseTypes, CASE_STATUS_LABELS } from "@/lib/types";
import type { Case, CaseStatus, Client, Contact, Order } from "@/lib/types";

const caseSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  case_type: z.enum(caseTypes),
  status: z.enum(caseStatuses),
  priority: z.enum(casePriorities),
  client_id: z.string().optional(),
  contact_id: z.string().optional(),
  order_id: z.string().optional(),
  assigned_to: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

type CaseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CaseFormData) => void | Promise<void>;
  clients?: Client[];
  contacts?: Contact[];
  orders?: Order[];
  case?: Partial<Case>;
  defaultValues?: Partial<Case>; // For pre-populating new cases without triggering edit mode
  isLoading?: boolean;
  defaultStatus?: CaseStatus;
};

export function CaseForm({
  open,
  onOpenChange,
  onSubmit,
  clients = [],
  contacts = [],
  orders = [],
  case: caseData,
  defaultValues: initialValues,
  isLoading,
  defaultStatus,
}: CaseFormProps) {
  // Use caseData (edit mode) or initialValues (new case with pre-filled values) or empty defaults
  const sourceData = caseData || initialValues;
  const isEditMode = !!caseData?.id; // Only edit mode if we have an actual case ID

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: sourceData ? {
      subject: sourceData.subject || "",
      description: sourceData.description || "",
      case_type: sourceData.caseType || "support",
      status: sourceData.status || "new",
      priority: sourceData.priority || "normal",
      client_id: sourceData.clientId || "",
      contact_id: sourceData.contactId || "",
      order_id: sourceData.orderId || "",
      assigned_to: sourceData.assignedTo || "",
    } : {
      subject: "",
      description: "",
      case_type: "support",
      status: defaultStatus || "new",
      priority: "normal",
      client_id: "",
      contact_id: "",
      order_id: "",
      assigned_to: "",
    },
  });

  // Reset form when dialog opens with different defaultStatus
  useEffect(() => {
    if (open && !caseData) {
      form.reset({
        subject: "",
        description: "",
        case_type: "support",
        status: defaultStatus || "new",
        priority: "normal",
        client_id: "",
        contact_id: "",
        order_id: "",
        assigned_to: "",
      });
    }
  }, [open, defaultStatus, caseData, form]);

  const handleSubmit = async (data: CaseFormData) => {
    // Convert empty strings to undefined
    const cleanedData = {
      ...data,
      client_id: data.client_id || undefined,
      contact_id: data.contact_id || undefined,
      order_id: data.order_id || undefined,
      assigned_to: data.assigned_to || undefined,
    };

    await onSubmit(cleanedData);
    if (!isEditMode) {
      form.reset();
    }
    onOpenChange(false);
  };

  // Helper function to format case type for display
  const formatCaseType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Case" : "New Case"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update case information" : "Create a new support case"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief description of the issue" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Detailed description of the case..." rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="case_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {caseTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatCaseType(type)}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {casePriorities.map((priority) => (
                          <SelectItem key={priority} value={priority} className="capitalize">
                            {priority}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {caseStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {CASE_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.companyName}
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
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.orderNumber} - {order.propertyAddress}
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Case" : "Create Case"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
