"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSaveResource, useUpdateResource } from "@/hooks/use-resources";
import type { BookableResource, ServiceTerritory, SkillType } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: BookableResource | null;
  territories: ServiceTerritory[];
  skillTypes: SkillType[];
}

export function ResourceForm({
  open,
  onOpenChange,
  resource,
  territories,
  skillTypes,
}: ResourceFormProps) {
  const { mutateAsync: saveResource, isPending: isSaving } = useSaveResource();
  const { mutateAsync: updateResource, isPending: isUpdating } = useUpdateResource();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      resourceType: "appraiser",
      employmentType: "staff",
      isBookable: true,
      bookingBufferMinutes: 30,
      maxDailyAppointments: 4,
      maxWeeklyHours: 40,
      perInspectionRate: 0,
      splitPercentage: 70,
      preferredContactMethod: "email",
      timezone: "America/New_York",
    },
  });

  useEffect(() => {
    if (resource) {
      reset({
        id: resource.id,
        resourceType: resource.resourceType,
        employmentType: resource.employmentType,
        isBookable: resource.isBookable,
        bookingBufferMinutes: resource.bookingBufferMinutes,
        maxDailyAppointments: resource.maxDailyAppointments,
        maxWeeklyHours: resource.maxWeeklyHours,
        primaryTerritoryId: resource.primaryTerritoryId,
        hourlyRate: resource.hourlyRate,
        overtimeRate: resource.overtimeRate,
        perInspectionRate: resource.perInspectionRate,
        splitPercentage: resource.splitPercentage,
        licenseNumber: resource.licenseNumber,
        licenseState: resource.licenseState,
        licenseExpiry: resource.licenseExpiry,
        errorsAndOmissionsCarrier: resource.errorsAndOmissionsCarrier,
        errorsAndOmissionsExpiry: resource.errorsAndOmissionsExpiry,
        errorsAndOmissionsAmount: resource.errorsAndOmissionsAmount,
        emergencyContactName: resource.emergencyContactName,
        emergencyContactPhone: resource.emergencyContactPhone,
        preferredContactMethod: resource.preferredContactMethod,
        timezone: resource.timezone,
      });
    } else {
      reset({
        resourceType: "appraiser",
        employmentType: "staff",
        isBookable: true,
        bookingBufferMinutes: 30,
        maxDailyAppointments: 4,
        maxWeeklyHours: 40,
        perInspectionRate: 0,
        splitPercentage: 70,
        preferredContactMethod: "email",
        timezone: "America/New_York",
      });
    }
  }, [resource, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (resource) {
        await updateResource({
          id: resource.id,
          ...data,
        });
      } else {
        // For new resources, we need a profile ID
        // This would typically come from a user selector
        // For now, show an error
        console.error("Cannot create resource without profile ID");
        return;
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error saving resource:", error);
    }
  };

  const resourceType = watch("resourceType");
  const employmentType = watch("employmentType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit Resource" : "New Resource"}
          </DialogTitle>
          <DialogDescription>
            {resource
              ? "Update resource information and availability settings"
              : "Add a new field service resource"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Resource Type Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resourceType">Resource Type</Label>
                  <Select
                    value={watch("resourceType")}
                    onValueChange={(value) => setValue("resourceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appraiser">Appraiser</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="facility">Facility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {resourceType === "appraiser" && (
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={watch("employmentType")}
                      onValueChange={(value) => setValue("employmentType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isBookable"
                  checked={watch("isBookable")}
                  onCheckedChange={(checked) => setValue("isBookable", checked)}
                />
                <Label htmlFor="isBookable">Available for Booking</Label>
              </div>
            </div>

            {/* Capacity Section */}
            {resourceType === "appraiser" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Capacity & Scheduling</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDailyAppointments">Max Daily Appointments</Label>
                    <Input
                      id="maxDailyAppointments"
                      type="number"
                      {...register("maxDailyAppointments", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxWeeklyHours">Max Weekly Hours</Label>
                    <Input
                      id="maxWeeklyHours"
                      type="number"
                      step="0.5"
                      {...register("maxWeeklyHours", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingBufferMinutes">Buffer (minutes)</Label>
                    <Input
                      id="bookingBufferMinutes"
                      type="number"
                      {...register("bookingBufferMinutes", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Territory Section */}
            {resourceType === "appraiser" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Territory Assignment</h3>

                <div className="space-y-2">
                  <Label htmlFor="primaryTerritoryId">Primary Territory</Label>
                  <Select
                    value={watch("primaryTerritoryId")}
                    onValueChange={(value) => setValue("primaryTerritoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      {territories.map((territory) => (
                        <SelectItem key={territory.id} value={territory.id}>
                          {territory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Compensation Section */}
            {resourceType === "appraiser" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Compensation</h3>

                <div className="grid grid-cols-2 gap-4">
                  {employmentType === "staff" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="0.01"
                          {...register("hourlyRate", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overtimeRate">Overtime Rate ($)</Label>
                        <Input
                          id="overtimeRate"
                          type="number"
                          step="0.01"
                          {...register("overtimeRate", { valueAsNumber: true })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="perInspectionRate">Per Inspection ($)</Label>
                        <Input
                          id="perInspectionRate"
                          type="number"
                          step="0.01"
                          {...register("perInspectionRate", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="splitPercentage">Split (%)</Label>
                        <Input
                          id="splitPercentage"
                          type="number"
                          step="0.01"
                          {...register("splitPercentage", { valueAsNumber: true })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* License & Insurance */}
            {resourceType === "appraiser" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">License & Insurance</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input id="licenseNumber" {...register("licenseNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseState">State</Label>
                    <Input
                      id="licenseState"
                      maxLength={2}
                      placeholder="FL"
                      {...register("licenseState")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry">Expiry Date</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      {...register("licenseExpiry")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="errorsAndOmissionsCarrier">E&O Carrier</Label>
                    <Input id="errorsAndOmissionsCarrier" {...register("errorsAndOmissionsCarrier")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="errorsAndOmissionsAmount">Coverage Amount ($)</Label>
                    <Input
                      id="errorsAndOmissionsAmount"
                      type="number"
                      {...register("errorsAndOmissionsAmount", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="errorsAndOmissionsExpiry">E&O Expiry</Label>
                    <Input
                      id="errorsAndOmissionsExpiry"
                      type="date"
                      {...register("errorsAndOmissionsExpiry")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {resourceType === "appraiser" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Emergency Contact</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input id="emergencyContactName" {...register("emergencyContactName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      {...register("emergencyContactPhone")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isUpdating}>
                {isSaving || isUpdating ? "Saving..." : resource ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
