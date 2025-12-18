"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useCreateBooking } from "@/hooks/use-bookings";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, addHours } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleInspectionDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleInspectionDialog({
  order,
  open,
  onOpenChange,
}: ScheduleInspectionDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast({
        title: "Error",
        description: "Please select an inspection date",
        variant: "destructive",
      });
      return;
    }

    if (!time) {
      toast({
        title: "Error",
        description: "Please select an inspection time",
        variant: "destructive",
      });
      return;
    }

    try {
      // Combine date and time into ISO string
      const [hours, minutes] = time.split(':');
      const scheduledStart = new Date(date);
      scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Default 2-hour inspection window
      const scheduledEnd = addHours(scheduledStart, 2);

      // Create booking linked to this order
      // Note: resourceId is not passed here - the appraiser can be assigned later
      // through the field services interface if they have a bookable_resources record
      await createBooking({
        orderId: order.id,
        bookingType: 'inspection',
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        // Note: status is calculated by API based on conflicts (not sent from frontend)
        // Pre-populate property data from order
        propertyAddress: order.propertyAddress,
        propertyCity: order.propertyCity || undefined,
        propertyState: order.propertyState || undefined,
        propertyZip: order.propertyZip || undefined,
        // Contact information
        contactName: order.borrowerName || order.propertyContactName || undefined,
        contactPhone: order.borrowerPhone || order.propertyContactPhone || undefined,
        contactEmail: order.borrowerEmail || order.propertyContactEmail || undefined,
        // Access and special instructions
        accessInstructions: order.accessInstructions || undefined,
        specialInstructions: notes || order.specialInstructions || undefined,
      });

      toast({
        title: "Inspection Scheduled",
        description: `Inspection scheduled for ${format(date, "PPP")} at ${time}`,
      });

      // Reset form and close dialog
      setDate(undefined);
      setTime("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create booking:', error);
      toast({
        title: "Error",
        description: "Failed to schedule inspection. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Inspection</DialogTitle>
          <DialogDescription>
            Schedule an inspection for order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Inspection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Inspection Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Select time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Schedule Inspection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

