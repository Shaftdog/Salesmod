"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useClockOut } from "@/hooks/use-time-entries";

interface ClockOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
}

export function ClockOutDialog({
  open,
  onOpenChange,
  resourceId,
}: ClockOutDialogProps) {
  const { mutateAsync: clockOut, isPending } = useClockOut();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      breakMinutes: 0,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await clockOut({
        resourceId,
        breakMinutes: data.breakMinutes ? parseInt(data.breakMinutes) : undefined,
        location: data.location,
        notes: data.notes,
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error clocking out:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clock Out</DialogTitle>
          <DialogDescription>
            Stop tracking time and finalize your work entry
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="breakMinutes">Break Time (minutes)</Label>
            <Input
              id="breakMinutes"
              type="number"
              min="0"
              placeholder="0"
              {...register("breakMinutes")}
            />
            <p className="text-xs text-muted-foreground">
              Time taken for breaks will be deducted from total hours
            </p>
          </div>

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
              placeholder="Summary of work completed..."
              rows={3}
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
              {isPending ? "Clocking Out..." : "Clock Out"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
