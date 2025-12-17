"use client";

import { useState, useEffect } from "react";
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
import { useProductionResources } from "@/hooks/use-production";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import {
  PRODUCTION_ROLES,
  PRODUCTION_ROLE_LABELS,
  ProductionRole,
} from "@/types/production";
import { useQueryClient } from "@tanstack/react-query";

interface EditTeamDialogProps {
  cardId: string;
  currentAssignments: {
    assigned_appraiser_id: string | null;
    assigned_reviewer_id: string | null;
    assigned_admin_id: string | null;
    assigned_trainee_id: string | null;
    assigned_researcher_level_1_id: string | null;
    assigned_researcher_level_2_id: string | null;
    assigned_researcher_level_3_id: string | null;
    assigned_inspector_id: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Type for role assignments state
type RoleAssignments = {
  [K in ProductionRole]: string; // user_id or empty string
};

export function EditTeamDialog({
  cardId,
  currentAssignments,
  open,
  onOpenChange,
}: EditTeamDialogProps) {
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({
    appraiser: "",
    reviewer: "",
    admin: "",
    trainee: "",
    researcher_level_1: "",
    researcher_level_2: "",
    researcher_level_3: "",
    inspector: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: resources, isLoading: resourcesLoading } = useProductionResources();

  // Initialize from current assignments when dialog opens
  useEffect(() => {
    if (open && currentAssignments) {
      setRoleAssignments({
        appraiser: currentAssignments.assigned_appraiser_id || "",
        reviewer: currentAssignments.assigned_reviewer_id || "",
        admin: currentAssignments.assigned_admin_id || "",
        trainee: currentAssignments.assigned_trainee_id || "",
        researcher_level_1: currentAssignments.assigned_researcher_level_1_id || "",
        researcher_level_2: currentAssignments.assigned_researcher_level_2_id || "",
        researcher_level_3: currentAssignments.assigned_researcher_level_3_id || "",
        inspector: currentAssignments.assigned_inspector_id || "",
      });
    }
  }, [open, currentAssignments]);

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
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/production/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_appraiser_id: roleAssignments.appraiser || null,
          assigned_reviewer_id: roleAssignments.reviewer || null,
          assigned_admin_id: roleAssignments.admin || null,
          assigned_trainee_id: roleAssignments.trainee || null,
          assigned_researcher_level_1_id: roleAssignments.researcher_level_1 || null,
          assigned_researcher_level_2_id: roleAssignments.researcher_level_2 || null,
          assigned_researcher_level_3_id: roleAssignments.researcher_level_3 || null,
          assigned_inspector_id: roleAssignments.inspector || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update team");
      }

      toast({
        title: "Team Updated",
        description: "Role assignments have been saved.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["production-card", cardId] });
      queryClient.invalidateQueries({ queryKey: ["production-cards"] });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Edit Team
          </DialogTitle>
          <DialogDescription>
            Update role assignments for this production card. Tasks will be reassigned based on these selections.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
