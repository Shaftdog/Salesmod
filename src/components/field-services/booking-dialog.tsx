"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBooking, useUpdateBooking, useAutoAssign, useCancelBooking } from "@/hooks/use-bookings";
import type { Booking, BookableResource } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  resources: BookableResource[];
}

export function BookingDialog({
  open,
  onOpenChange,
  booking,
  resources,
}: BookingDialogProps) {
  const { mutateAsync: createBooking, isPending: isCreating } = useCreateBooking();
  const { mutateAsync: updateBooking, isPending: isUpdating } = useUpdateBooking();
  const { mutateAsync: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutateAsync: autoAssign, isPending: isAutoAssigning } = useAutoAssign();

  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      bookingType: "inspection",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (booking) {
      reset({
        resourceId: booking.resourceId,
        bookingType: booking.bookingType,
        scheduledDate: booking.scheduledStart ? new Date(booking.scheduledStart).toISOString().split("T")[0] : "",
        scheduledStartTime: booking.scheduledStart ? format(new Date(booking.scheduledStart), "HH:mm") : "",
        scheduledEndTime: booking.scheduledEnd ? format(new Date(booking.scheduledEnd), "HH:mm") : "",
        propertyAddress: booking.propertyAddress,
        propertyCity: booking.propertyCity,
        propertyState: booking.propertyState,
        propertyZip: booking.propertyZip,
        contactName: booking.contactName,
        contactPhone: booking.contactPhone,
        contactEmail: booking.contactEmail,
        accessInstructions: booking.accessInstructions,
        specialInstructions: booking.specialInstructions,
        status: booking.status,
      });
    } else {
      reset({
        bookingType: "inspection",
        status: "scheduled",
      });
    }
    setAutoAssignResult(null);
  }, [booking, reset]);

  const handleAutoAssign = async () => {
    const propertyZip = watch("propertyZip");
    const scheduledDate = watch("scheduledDate");
    const scheduledStartTime = watch("scheduledStartTime");
    const scheduledEndTime = watch("scheduledEndTime");

    if (!propertyZip || !scheduledDate || !scheduledStartTime || !scheduledEndTime) {
      return;
    }

    const scheduledStart = new Date(`${scheduledDate}T${scheduledStartTime}`).toISOString();
    const scheduledEnd = new Date(`${scheduledDate}T${scheduledEndTime}`).toISOString();

    const result = await autoAssign({
      propertyZip,
      scheduledStart,
      scheduledEnd,
    });

    setAutoAssignResult(result);
    if (result.resourceId) {
      setValue("resourceId", result.resourceId);
    }
  };

  const handleCancel = async () => {
    if (booking && confirm("Are you sure you want to cancel this booking?")) {
      await cancelBooking({ id: booking.id });
      onOpenChange(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const scheduledStart = new Date(`${data.scheduledDate}T${data.scheduledStartTime}`).toISOString();
      const scheduledEnd = new Date(`${data.scheduledDate}T${data.scheduledEndTime}`).toISOString();

      const bookingData = {
        resourceId: data.resourceId,
        bookingType: data.bookingType,
        scheduledStart,
        scheduledEnd,
        propertyAddress: data.propertyAddress,
        propertyCity: data.propertyCity,
        propertyState: data.propertyState,
        propertyZip: data.propertyZip,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        accessInstructions: data.accessInstructions,
        specialInstructions: data.specialInstructions,
        status: data.status,
      };

      if (booking) {
        await updateBooking({
          id: booking.id,
          ...bookingData,
        });
      } else {
        await createBooking(bookingData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error saving booking:", error);
    }
  };

  const canCancel = booking && booking.status !== "cancelled" && booking.status !== "completed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {booking ? `Edit Booking - ${booking.bookingNumber}` : "New Booking"}
          </DialogTitle>
          <DialogDescription>
            {booking ? "Update booking details" : "Schedule a new field service appointment"}
          </DialogDescription>
          {booking && (
            <Badge variant={booking.status === "completed" ? "default" : "secondary"}>
              {booking.status}
            </Badge>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Resource & Type */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Assignment</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resourceId">Assigned Resource *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={watch("resourceId")}
                      onValueChange={(value) => setValue("resourceId", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select resource..." />
                      </SelectTrigger>
                      <SelectContent>
                        {resources.map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>
                            {resource.profile?.name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoAssign}
                      disabled={isAutoAssigning}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  {autoAssignResult && (
                    <Alert>
                      <AlertDescription>
                        {autoAssignResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookingType">Booking Type</Label>
                  <Select
                    value={watch("bookingType")}
                    onValueChange={(value) => setValue("bookingType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="reinspection">Re-inspection</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Schedule</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    {...register("scheduledDate", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledStartTime">Start Time *</Label>
                  <Input
                    id="scheduledStartTime"
                    type="time"
                    {...register("scheduledStartTime", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledEndTime">End Time *</Label>
                  <Input
                    id="scheduledEndTime"
                    type="time"
                    {...register("scheduledEndTime", { required: true })}
                  />
                </div>
              </div>
            </div>

            {/* Property */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Property Location</h3>

              <div className="space-y-2">
                <Label htmlFor="propertyAddress">Address *</Label>
                <Input
                  id="propertyAddress"
                  placeholder="123 Main St"
                  {...register("propertyAddress", { required: true })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyCity">City</Label>
                  <Input
                    id="propertyCity"
                    placeholder="Orlando"
                    {...register("propertyCity")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyState">State</Label>
                  <Input
                    id="propertyState"
                    placeholder="FL"
                    maxLength={2}
                    {...register("propertyState")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyZip">ZIP Code</Label>
                  <Input
                    id="propertyZip"
                    placeholder="32801"
                    {...register("propertyZip")}
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contact Information</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    placeholder="John Doe"
                    {...register("contactName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("contactPhone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="john@example.com"
                    {...register("contactEmail")}
                  />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Instructions</h3>

              <div className="space-y-2">
                <Label htmlFor="accessInstructions">Access Instructions</Label>
                <Textarea
                  id="accessInstructions"
                  placeholder="Lockbox code, gate code, etc."
                  rows={2}
                  {...register("accessInstructions")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  placeholder="Any special notes or requirements..."
                  rows={2}
                  {...register("specialInstructions")}
                />
              </div>
            </div>

            {/* Status (for editing) */}
            {booking && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {canCancel && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isCreating || isUpdating}
                >
                  Close
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? "Saving..." : booking ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
