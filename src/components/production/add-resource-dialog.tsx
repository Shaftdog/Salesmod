"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PRODUCTION_ROLES, PRODUCTION_ROLE_LABELS, type ProductionRole } from "@/types/production";
import type { ProductionResourceWithUser, ProductionResourceInput } from "@/types/production";
import { useAppraisers } from "@/hooks/use-appraisers";
import { Loader2, AlertCircle } from "lucide-react";

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductionResourceInput) => Promise<void>;
  editingResource?: ProductionResourceWithUser | null;
  existingUserIds: string[];
}

export function AddResourceDialog({
  open,
  onOpenChange,
  onSubmit,
  editingResource,
  existingUserIds,
}: AddResourceDialogProps) {
  const { appraisers, isLoading: usersLoading } = useAppraisers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userId, setUserId] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<ProductionRole[]>([]);
  const [maxDailyTasks, setMaxDailyTasks] = useState(10);
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(40);
  const [isAvailable, setIsAvailable] = useState(true);

  // Reset form when dialog opens/closes or editing resource changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingResource) {
        setUserId(editingResource.user_id);
        setSelectedRoles(editingResource.roles as ProductionRole[]);
        setMaxDailyTasks(editingResource.max_daily_tasks);
        setMaxWeeklyHours(editingResource.max_weekly_hours);
        setIsAvailable(editingResource.is_available);
      } else {
        setUserId("");
        setSelectedRoles([]);
        setMaxDailyTasks(10);
        setMaxWeeklyHours(40);
        setIsAvailable(true);
      }
    }
  }, [open, editingResource]);

  // Filter out users who are already resources (unless editing)
  const availableUsers = appraisers.filter(
    (user) =>
      !existingUserIds.includes(user.id) || (editingResource && editingResource.user_id === user.id)
  );

  const toggleRole = (role: ProductionRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Validate input values
  const validateInputs = (): string | null => {
    if (!userId) {
      return "Please select a user";
    }
    if (selectedRoles.length === 0) {
      return "Please select at least one role";
    }
    if (maxDailyTasks < 1 || maxDailyTasks > 50) {
      return "Max daily tasks must be between 1 and 50";
    }
    if (maxWeeklyHours < 1 || maxWeeklyHours > 80) {
      return "Max weekly hours must be between 1 and 80";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        user_id: userId,
        roles: selectedRoles,
        max_daily_tasks: Math.min(50, Math.max(1, maxDailyTasks)),
        max_weekly_hours: Math.min(80, Math.max(1, maxWeeklyHours)),
        is_available: isAvailable,
      });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save resource. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!editingResource;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Production Resource" : "Add Production Resource"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">User *</Label>
            {usersLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            ) : (
              <Select
                value={userId}
                onValueChange={setUserId}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                User cannot be changed when editing
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Roles * (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {PRODUCTION_ROLES.map((role) => (
                <div
                  key={role}
                  className="flex items-center space-x-2 rounded-md border p-3"
                >
                  <Checkbox
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label
                    htmlFor={`role-${role}`}
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    {PRODUCTION_ROLE_LABELS[role]}
                  </label>
                </div>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-destructive">At least one role is required</p>
            )}
          </div>

          {/* Capacity Settings */}
          <div className="space-y-3">
            <Label>Capacity</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDailyTasks" className="text-sm font-normal">
                  Max Daily Tasks
                </Label>
                <Input
                  id="maxDailyTasks"
                  type="number"
                  min={1}
                  max={50}
                  value={maxDailyTasks}
                  onChange={(e) => setMaxDailyTasks(parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWeeklyHours" className="text-sm font-normal">
                  Max Weekly Hours
                </Label>
                <Input
                  id="maxWeeklyHours"
                  type="number"
                  min={1}
                  max={80}
                  value={maxWeeklyHours}
                  onChange={(e) => setMaxWeeklyHours(parseInt(e.target.value) || 40)}
                />
              </div>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="availability">Available for assignment</Label>
              <p className="text-xs text-muted-foreground">
                Toggle off to temporarily exclude from task assignments
              </p>
            </div>
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !userId || selectedRoles.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
