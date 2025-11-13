"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEquipment, useUpdateEquipment } from "@/hooks/use-equipment";
import type { Equipment } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
}

export function EquipmentDialog({
  open,
  onOpenChange,
  equipment,
}: EquipmentDialogProps) {
  const { mutateAsync: createEquipment, isPending: isCreating } = useCreateEquipment();
  const { mutateAsync: updateEquipment, isPending: isUpdating } = useUpdateEquipment();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      equipmentType: "measurement_tools",
      status: "available",
      condition: "good",
    },
  });

  useEffect(() => {
    if (equipment) {
      reset({
        equipmentType: equipment.equipmentType,
        make: equipment.make,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        purchaseDate: equipment.purchaseDate
          ? new Date(equipment.purchaseDate).toISOString().split("T")[0]
          : "",
        purchaseCost: equipment.purchaseCost,
        currentValue: equipment.currentValue,
        status: equipment.status,
        condition: equipment.condition,
        maintenanceSchedule: equipment.maintenanceSchedule,
        lastMaintenanceDate: equipment.lastMaintenanceDate
          ? new Date(equipment.lastMaintenanceDate).toISOString().split("T")[0]
          : "",
        nextMaintenanceDate: equipment.nextMaintenanceDate
          ? new Date(equipment.nextMaintenanceDate).toISOString().split("T")[0]
          : "",
        location: equipment.location,
        notes: equipment.notes,
        warrantyExpiry: equipment.warrantyExpiry
          ? new Date(equipment.warrantyExpiry).toISOString().split("T")[0]
          : "",
      });
    } else {
      reset({
        equipmentType: "measurement_tools",
        status: "available",
        condition: "good",
      });
    }
  }, [equipment, reset]);

  const onSubmit = async (data: any) => {
    try {
      const equipmentData = {
        equipmentType: data.equipmentType,
        make: data.make,
        model: data.model,
        serialNumber: data.serialNumber,
        purchaseDate: data.purchaseDate || undefined,
        purchaseCost: data.purchaseCost ? parseFloat(data.purchaseCost) : undefined,
        currentValue: data.currentValue ? parseFloat(data.currentValue) : undefined,
        status: data.status,
        condition: data.condition,
        maintenanceSchedule: data.maintenanceSchedule,
        lastMaintenanceDate: data.lastMaintenanceDate || undefined,
        nextMaintenanceDate: data.nextMaintenanceDate || undefined,
        location: data.location,
        notes: data.notes,
        warrantyExpiry: data.warrantyExpiry || undefined,
      };

      if (equipment) {
        await updateEquipment({
          id: equipment.id,
          ...equipmentData,
        });
      } else {
        await createEquipment(equipmentData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error saving equipment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {equipment ? "Edit Equipment" : "Add New Equipment"}
          </DialogTitle>
          <DialogDescription>
            {equipment
              ? "Update equipment details"
              : "Add a new equipment item to the catalog"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Equipment Type *</Label>
                  <Select
                    value={watch("equipmentType")}
                    onValueChange={(value) => setValue("equipmentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="measurement_tools">Measurement Tools</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="drone">Drone</SelectItem>
                      <SelectItem value="safety_equipment">Safety Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="Manufacturer"
                    {...register("make", { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="Model name/number"
                    {...register("model", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="SN123456"
                    {...register("serialNumber")}
                  />
                </div>
              </div>
            </div>

            {/* Status & Condition */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Status & Condition</h3>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={watch("condition")}
                    onValueChange={(value) => setValue("condition", value)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Storage location or office"
                  {...register("location")}
                />
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Purchase Information</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    {...register("purchaseDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseCost">Purchase Cost</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("purchaseCost")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentValue">Current Value</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("currentValue")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  {...register("warrantyExpiry")}
                />
              </div>
            </div>

            {/* Maintenance */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Maintenance</h3>

              <div className="space-y-2">
                <Label htmlFor="maintenanceSchedule">Maintenance Schedule</Label>
                <Input
                  id="maintenanceSchedule"
                  placeholder="e.g., Every 6 months, Annually"
                  {...register("maintenanceSchedule")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastMaintenanceDate">Last Maintenance</Label>
                  <Input
                    id="lastMaintenanceDate"
                    type="date"
                    {...register("lastMaintenanceDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextMaintenanceDate">Next Maintenance</Label>
                  <Input
                    id="nextMaintenanceDate"
                    type="date"
                    {...register("nextMaintenanceDate")}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or specifications..."
                rows={3}
                {...register("notes")}
              />
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
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? "Saving..."
                  : equipment
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
