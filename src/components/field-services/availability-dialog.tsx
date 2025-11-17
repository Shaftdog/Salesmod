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
      isAllDay: true,
      status: "pending",
    },
  });

  useEffect(() => {
    if (entry) {
      const startDate = new Date(entry.startDatetime);
      const endDate = new Date(entry.endDatetime);

      reset({
        resourceId: entry.resourceId,
        availabilityType: entry.availabilityType,
        dateFrom: startDate.toISOString().split("T")[0],
        dateTo: endDate.toISOString().split("T")[0],
        timeFrom: entry.isAllDay ? "" : startDate.toTimeString().slice(0, 5),
        timeTo: entry.isAllDay ? "" : endDate.toTimeString().slice(0, 5),
        reason: entry.reason,
        notes: entry.notes,
        isRecurring: entry.isRecurring,
        isAllDay: entry.isAllDay,
        status: entry.status,
      });
    } else {
      reset({
        resourceId: resourceId || "",
        availabilityType: "time_off",
        isRecurring: false,
        isAllDay: true,
        status: "pending",
      });
    }
  }, [entry, resourceId, reset]);

  const onSubmit = async (data: any) => {
    try {
      // Combine date and time into datetime strings
      const isAllDay = data.isAllDay || !data.timeFrom || !data.timeTo;

      let startDatetime: string;
      let endDatetime: string;

      if (isAllDay) {
        // For all-day events, use start of day to end of day
        startDatetime = new Date(`${data.dateFrom}T00:00:00`).toISOString();
        endDatetime = new Date(`${data.dateTo}T23:59:59`).toISOString();
      } else {
        // Combine date with time
        startDatetime = new Date(`${data.dateFrom}T${data.timeFrom}:00`).toISOString();
        endDatetime = new Date(`${data.dateTo}T${data.timeTo}:00`).toISOString();
      }

      const availabilityData = {
        resourceId: data.resourceId,
        availabilityType: data.availabilityType,
        startDatetime,
        endDatetime,
        isAllDay,
        isAvailable: data.availabilityType === 'working_hours',
        reason: data.reason,
        notes: data.notes,
        isRecurring: data.isRecurring,
        status: data.status || (data.availabilityType === 'time_off' ? 'pending' : 'approved'),
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
                  <SelectItem value="working_hours">Working Hours</SelectItem>
                  <SelectItem value="time_off">Time Off</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="override">Schedule Override</SelectItem>
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

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAllDay"
                checked={watch("isAllDay")}
                onCheckedChange={(checked) => setValue("isAllDay", checked)}
              />
              <Label htmlFor="isAllDay" className="font-normal">
                All day event
              </Label>
            </div>

            {/* Time Range (only if not all day) */}
            {!watch("isAllDay") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeFrom">From Time *</Label>
                  <Input
                    id="timeFrom"
                    type="time"
                    {...register("timeFrom", { required: !watch("isAllDay") })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeTo">To Time *</Label>
                  <Input
                    id="timeTo"
                    type="time"
                    {...register("timeTo", { required: !watch("isAllDay") })}
                  />
                </div>
              </div>
            )}

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
                <div className="space-y-2">
                  <Label htmlFor="status">Approval Status</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) => setValue("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
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
