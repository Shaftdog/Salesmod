"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAddResourceSkill } from "@/hooks/use-skills";
import type { SkillType } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  availableSkills: SkillType[];
}

export function AddSkillDialog({
  open,
  onOpenChange,
  resourceId,
  availableSkills,
}: AddSkillDialogProps) {
  const { mutateAsync: addSkill, isPending } = useAddResourceSkill();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      proficiencyLevel: "intermediate",
      isVerified: false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await addSkill({
        resourceId,
        skillTypeId: data.skillTypeId,
        proficiencyLevel: data.proficiencyLevel,
        certificationNumber: data.certificationNumber || undefined,
        certifiedDate: data.certifiedDate || undefined,
        expiryDate: data.expiryDate || undefined,
        issuingAuthority: data.issuingAuthority || undefined,
        isVerified: data.isVerified,
        notes: data.notes || undefined,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error adding skill:", error);
    }
  };

  const selectedSkillId = watch("skillTypeId");
  const selectedSkill = availableSkills.find((s) => s.id === selectedSkillId);
  const hasCertification = watch("certificationNumber");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Skill or Certification</DialogTitle>
          <DialogDescription>
            Assign a skill to this resource and track certification details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Skill Selection */}
          <div className="space-y-2">
            <Label htmlFor="skillTypeId">Skill / Certification *</Label>
            <Select
              value={watch("skillTypeId")}
              onValueChange={(value) => setValue("skillTypeId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a skill..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-64">
                  {availableSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      <div className="flex items-center gap-2">
                        <span>{skill.name}</span>
                        {skill.category && (
                          <span className="text-xs text-muted-foreground">
                            ({skill.category})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </ScrollContent>
              </SelectContent>
            </Select>
            {selectedSkill?.description && (
              <p className="text-sm text-muted-foreground">{selectedSkill.description}</p>
            )}
            {errors.skillTypeId && (
              <p className="text-sm text-red-500">Please select a skill</p>
            )}
          </div>

          {/* Proficiency Level */}
          <div className="space-y-2">
            <Label htmlFor="proficiencyLevel">Proficiency Level</Label>
            <Select
              value={watch("proficiencyLevel")}
              onValueChange={(value) => setValue("proficiencyLevel", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certification Details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-sm font-semibold">Certification Details (Optional)</h3>

            <div className="space-y-2">
              <Label htmlFor="certificationNumber">Certification Number</Label>
              <Input
                id="certificationNumber"
                placeholder="e.g., FHA-12345"
                {...register("certificationNumber")}
              />
            </div>

            {hasCertification && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                  <Input
                    id="issuingAuthority"
                    placeholder="e.g., Florida DBPR"
                    {...register("issuingAuthority")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certifiedDate">Certified Date</Label>
                    <Input
                      id="certifiedDate"
                      type="date"
                      {...register("certifiedDate")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      {...register("expiryDate")}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isVerified"
                checked={watch("isVerified")}
                onCheckedChange={(checked) => setValue("isVerified", checked)}
              />
              <Label htmlFor="isVerified">Mark as verified</Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this skill or certification..."
              rows={3}
              {...register("notes")}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !watch("skillTypeId")}>
              {isPending ? "Adding..." : "Add Skill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
