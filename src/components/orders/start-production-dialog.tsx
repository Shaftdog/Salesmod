"use client";

import { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useProductionTemplates,
  useCreateProductionCard,
  useProductionResources,
} from "@/hooks/use-production";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon, Play, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CardPriority,
  PRIORITY_LABELS,
  CARD_PRIORITIES,
  PRODUCTION_ROLES,
  PRODUCTION_ROLE_LABELS,
  ProductionRole,
} from "@/types/production";

interface StartProductionDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Type for role assignments state
type RoleAssignments = {
  [K in ProductionRole]: string; // user_id or empty string
};

const initialRoleAssignments: RoleAssignments = {
  appraiser: "",
  reviewer: "",
  admin: "",
  trainee: "",
  researcher_level_1: "",
  researcher_level_2: "",
  researcher_level_3: "",
  inspector: "",
};

export function StartProductionDialog({
  order,
  open,
  onOpenChange,
}: StartProductionDialogProps) {
  const [templateId, setTemplateId] = useState<string>("");
  const [priority, setPriority] = useState<CardPriority>("normal");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    order.dueDate ? new Date(order.dueDate) : undefined
  );
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>(initialRoleAssignments);

  const { toast } = useToast();
  const { data: templates, isLoading: templatesLoading } = useProductionTemplates({ active_only: true });
  const { data: resources, isLoading: resourcesLoading } = useProductionResources();
  const createProductionCard = useCreateProductionCard();

  // Map order priority to production card priority
  const getDefaultPriority = (): CardPriority => {
    switch (order.priority) {
      case "rush":
        return "urgent";
      case "high":
        return "high";
      case "low":
        return "low";
      default:
        return "normal";
    }
  };

  // Set defaults when dialog opens
  useEffect(() => {
    if (open) {
      setPriority(getDefaultPriority());
      // Pre-fill appraiser from order if assigned
      if (order.assignedTo) {
        setRoleAssignments((prev) => ({ ...prev, appraiser: order.assignedTo || "" }));
      }
    }
  }, [open, order.assignedTo]);

  // Get users who can perform a specific role
  const getUsersForRole = (role: ProductionRole) => {
    if (!resources) return [];
    return resources.filter(
      (r) => r.is_available && r.roles.includes(role)
    );
  };

  const handleRoleChange = (role: ProductionRole, userId: string) => {
    setRoleAssignments((prev) => ({
      ...prev,
      [role]: userId === "none" ? "" : userId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateId) {
      toast({
        title: "Template Required",
        description: "Please select a production template.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProductionCard.mutateAsync({
        order_id: order.id,
        template_id: templateId,
        priority,
        due_date: dueDate?.toISOString().split("T")[0],
        // Pass all role assignments (convert empty strings to undefined)
        assigned_appraiser_id: roleAssignments.appraiser || undefined,
        assigned_reviewer_id: roleAssignments.reviewer || undefined,
        assigned_admin_id: roleAssignments.admin || undefined,
        assigned_trainee_id: roleAssignments.trainee || undefined,
        assigned_researcher_level_1_id: roleAssignments.researcher_level_1 || undefined,
        assigned_researcher_level_2_id: roleAssignments.researcher_level_2 || undefined,
        assigned_researcher_level_3_id: roleAssignments.researcher_level_3 || undefined,
        assigned_inspector_id: roleAssignments.inspector || undefined,
      });

      toast({
        title: "Production Started",
        description: `Order ${order.orderNumber} has been added to the production board.`,
      });

      onOpenChange(false);
    } catch (error) {
      // Error toast is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Production
          </DialogTitle>
          <DialogDescription>
            Add order {order.orderNumber} to the production board with a workflow template.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Production Template *</Label>
              {templatesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : templates && templates.length > 0 ? (
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          {template.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ({template.tasks?.length || 0} tasks)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No production templates available. Create one in Production &gt; Templates.
                </p>
              )}
            </div>

            {/* Priority & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as CardPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Role Assignments Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="text-base">Role Assignments</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Tasks will be auto-assigned based on these role selections. Only users added to Resources with the corresponding role will appear.
              </p>

              {resourcesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading resources...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {PRODUCTION_ROLES.map((role) => {
                    const usersForRole = getUsersForRole(role);
                    return (
                      <div key={role} className="space-y-1.5">
                        <Label htmlFor={`role-${role}`} className="text-sm">
                          {PRODUCTION_ROLE_LABELS[role]}
                        </Label>
                        <Select
                          value={roleAssignments[role] || "none"}
                          onValueChange={(v) => handleRoleChange(role, v)}
                        >
                          <SelectTrigger id={`role-${role}`} className="h-9">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {usersForRole.map((resource) => (
                              <SelectItem key={resource.user_id} value={resource.user_id}>
                                {resource.user.name || resource.user.email}
                              </SelectItem>
                            ))}
                            {usersForRole.length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                No users with this role
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductionCard.isPending || !templateId}
            >
              {createProductionCard.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Start Production
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
