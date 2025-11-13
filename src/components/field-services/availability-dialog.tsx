"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAvailability, useUpdateAvailability } from "@/hooks/use-availability";
import { useResources } from "@/hooks/use-resources";
import type { ResourceAvailability } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface AvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ResourceAvailability | null;
  resourceId?: string;
}

export function AvailabilityDialog({
  open,
  onOpenChange,
  entry,
  resourceId,
}: AvailabilityDialogProps) {
  const { mutateAsync: createAvailability, isPending: isCreating } = useCreateAvailability();
  const { mutateAsync: updateAvailability, isPending: isUpdating } = useUpdateAvailability();
  const { data: resources = [] } = useResources({ isBookable: true });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      availabilityType: "time_off",
      isRecurring: false,
      isApproved: false,
    },
  });

  useEffect(() => {
    if (entry) {
      reset({
        resourceId: entry.resourceId,
        availabilityType: entry.availabilityType,
        dateFrom: new Date(entry.dateFrom).toISOString().split("T")[0],
        dateTo: new Date(entry.dateTo).toISOString().split("T")[0],
        timeFrom: entry.timeFrom || "",
        timeTo: entry.timeTo || "",
        reason: entry.reason,
        notes: entry.notes,
        isRecurring: entry.isRecurring,
        isApproved: entry.isApproved,
      });
    } else {
      reset({
        resourceId: resourceId || "",
        availabilityType: "time_off",
        isRecurring: false,
        isApproved: false,
      });
    }
  }, [entry, resourceId, reset]);

  const onSubmit = async (data: any) => {
    try {
      const availabilityData = {
        resourceId: data.resourceId,
        availabilityType: data.availabilityType,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        timeFrom: data.timeFrom || undefined,
        timeTo: data.timeTo || undefined,
        reason: data.reason,
        notes: data.notes,
        isRecurring: data.isRecurring,
        isApproved: data.isApproved,
      };

      if (entry) {
        await updateAvailability({
          id: entry.id,
          ...availabilityData,
        });
      } else {
        await createAvailability(availabilityData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error saving availability:", error);
    }
  };

  const availabilityType = watch("availabilityType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit Availability" : "Add Availability"}
          </DialogTitle>
          <DialogDescription>
            {entry
              ? "Update availability details"
              : "Create a new availability entry"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Resource Selection */}
            <div className="space-y-2">
              <Label htmlFor="resourceId">Resource *</Label>
              <Select
                value={watch("resourceId")}
                onValueChange={(value) => setValue("resourceId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource..." />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.profile?.name || "Unknown"} - {resource.resourceType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="availabilityType">Type *</Label>
              <Select
                value={watch("availabilityType")}
                onValueChange={(value) => setValue("availabilityType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="time_off">Time Off</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date *</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  {...register("dateFrom", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date *</Label>
                <Input
                  id="dateTo"
                  type="date"
                  {...register("dateTo", { required: true })}
                />
              </div>
            </div>

            {/* Time Range (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeFrom">From Time (Optional)</Label>
                <Input
                  id="timeFrom"
                  type="time"
                  {...register("timeFrom")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeTo">To Time (Optional)</Label>
                <Input
                  id="timeTo"
                  type="time"
                  {...register("timeTo")}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason {availabilityType === "time_off" && "*"}
              </Label>
              <Input
                id="reason"
                placeholder={
                  availabilityType === "time_off"
                    ? "Vacation, Sick, Personal, etc."
                    : "Reason for this entry..."
                }
                {...register("reason", {
                  required: availabilityType === "time_off",
                })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information..."
                rows={3}
                {...register("notes")}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={watch("isRecurring")}
                  onCheckedChange={(checked) => setValue("isRecurring", checked)}
                />
                <Label htmlFor="isRecurring" className="font-normal">
                  Recurring entry
                </Label>
              </div>

              {availabilityType === "time_off" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isApproved"
                    checked={watch("isApproved")}
                    onCheckedChange={(checked) => setValue("isApproved", checked)}
                  />
                  <Label htmlFor="isApproved" className="font-normal">
                    Pre-approved (admin only)
                  </Label>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating || !watch("resourceId")}>
                {isCreating || isUpdating
                  ? "Saving..."
                  : entry
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
