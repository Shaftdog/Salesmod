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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppraisers } from "@/hooks/use-appraisers";
import { useUpdateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AssignAppraiserDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignAppraiserDialog({
  order,
  open,
  onOpenChange,
}: AssignAppraiserDialogProps) {
  const [selectedAppraiserId, setSelectedAppraiserId] = useState<string>(
    order.assigneeId || ""
  );
  const { data: appraisers, isLoading } = useAppraisers();
  const { toast } = useToast();
  const updateOrderMutation = useUpdateOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppraiserId) {
      toast({
        title: "Error",
        description: "Please select an appraiser",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateOrderMutation.mutateAsync({
        id: order.id,
        assigneeId: selectedAppraiserId,
      });

      const selectedAppraiser = appraisers?.find(
        (a) => a.id === selectedAppraiserId
      );

      toast({
        title: "Appraiser Assigned",
        description: `Order assigned to ${selectedAppraiser?.name}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign appraiser",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Appraiser</DialogTitle>
          <DialogDescription>
            Assign an appraiser to order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="appraiser">Select Appraiser</Label>
                <Select
                  value={selectedAppraiserId}
                  onValueChange={setSelectedAppraiserId}
                >
                  <SelectTrigger id="appraiser">
                    <SelectValue placeholder="Choose an appraiser" />
                  </SelectTrigger>
                  <SelectContent>
                    {appraisers?.map((appraiser) => (
                      <SelectItem key={appraiser.id} value={appraiser.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {appraiser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{appraiser.name}</span>
                          {appraiser.location && (
                            <span className="text-xs text-muted-foreground">
                              • {appraiser.location}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAppraiserId && appraisers && (
                  <div className="mt-4 rounded-lg border p-4">
                    {(() => {
                      const selected = appraisers.find(
                        (a) => a.id === selectedAppraiserId
                      );
                      if (!selected) return null;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarFallback>
                                {selected.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{selected.name}</p>
                              {selected.location && (
                                <p className="text-sm text-muted-foreground">
                                  {selected.location}
                                </p>
                              )}
                            </div>
                          </div>
                          {selected.email && (
                            <p className="text-sm text-muted-foreground">
                              Email: {selected.email}
                            </p>
                          )}
                          {selected.phone && (
                            <p className="text-sm text-muted-foreground">
                              Phone: {selected.phone}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateOrderMutation.isPending || !selectedAppraiserId}
            >
              {updateOrderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Appraiser
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

