"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCheckOutEquipment } from "@/hooks/use-equipment";
import { useResources } from "@/hooks/use-resources";

interface CheckOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
}

export function CheckOutDialog({
  open,
  onOpenChange,
  equipmentId,
}: CheckOutDialogProps) {
  const { mutateAsync: checkOut, isPending } = useCheckOutEquipment();
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
      conditionAtCheckout: "good",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await checkOut({
        equipmentId,
        resourceId: data.resourceId,
        conditionAtCheckout: data.conditionAtCheckout,
        notes: data.notes,
      });

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error checking out equipment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Out Equipment</DialogTitle>
          <DialogDescription>
            Assign this equipment to a resource
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resourceId">Assign To *</Label>
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
            {errors.resourceId && (
              <p className="text-sm text-red-500">Please select a resource</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditionAtCheckout">Condition at Checkout</Label>
            <Select
              value={watch("conditionAtCheckout")}
              onValueChange={(value) => setValue("conditionAtCheckout", value)}
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
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
            <Button type="submit" disabled={isPending || !watch("resourceId")}>
              {isPending ? "Checking Out..." : "Check Out"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
