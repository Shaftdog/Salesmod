"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCheckInEquipment } from "@/hooks/use-equipment";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  assignmentId: string;
}

export function CheckInDialog({
  open,
  onOpenChange,
  equipmentId,
  assignmentId,
}: CheckInDialogProps) {
  const { mutateAsync: checkIn, isPending } = useCheckInEquipment();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      conditionAtReturn: "good",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await checkIn({
        equipmentId,
        assignmentId,
        conditionAtReturn: data.conditionAtReturn,
        notes: data.notes,
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error checking in equipment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check In Equipment</DialogTitle>
          <DialogDescription>
            Return equipment and update its condition
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conditionAtReturn">Condition at Return *</Label>
            <Select
              value={watch("conditionAtReturn")}
              onValueChange={(value) => setValue("conditionAtReturn", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Return Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any damage, issues, or observations..."
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
              {isPending ? "Checking In..." : "Check In"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
