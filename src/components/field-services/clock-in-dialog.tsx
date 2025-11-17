"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClockIn } from "@/hooks/use-time-entries";
import { useTodayBookings } from "@/hooks/use-bookings";

interface ClockInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
}

export function ClockInDialog({
  open,
  onOpenChange,
  resourceId,
}: ClockInDialogProps) {
  const { mutateAsync: clockIn, isPending } = useClockIn();
  const { data: todayBookings = [] } = useTodayBookings();

  const resourceBookings = todayBookings.filter(b => b.resourceId === resourceId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      entryType: "booking",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await clockIn({
        resourceId,
        bookingId: data.bookingId || undefined,
        entryType: data.entryType,
        location: data.location,
        notes: data.notes,
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error clocking in:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clock In</DialogTitle>
          <DialogDescription>
            Start tracking time for your work
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entryType">Entry Type *</Label>
            <Select
              value={watch("entryType")}
              onValueChange={(value) => setValue("entryType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booking">Booking/Appointment</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watch("entryType") === "booking" && resourceBookings.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bookingId">Booking (Optional)</Label>
              <Select
                value={watch("bookingId")}
                onValueChange={(value) => setValue("bookingId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select booking..." />
                </SelectTrigger>
                <SelectContent>
                  {resourceBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.bookingNumber} - {booking.propertyAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Office, Property Address"
              {...register("location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              rows={2}
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Clocking In..." : "Clock In"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
