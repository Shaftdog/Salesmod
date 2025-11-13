"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Wrench, History, AlertTriangle } from "lucide-react";
import { useEquipmentItem, useEquipmentAssignments, useRetireEquipment } from "@/hooks/use-equipment";
import { CheckOutDialog } from "@/components/field-services/check-out-dialog";
import { CheckInDialog } from "@/components/field-services/check-in-dialog";
import { EquipmentDialog } from "@/components/field-services/equipment-dialog";
import { format } from "date-fns";
import type { EquipmentStatus } from "@/lib/types";

export default function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { data: equipment, isLoading } = useEquipmentItem(id);
  const { data: allAssignments = [] } = useEquipmentAssignments(id);
  const { mutateAsync: retireEquipment } = useRetireEquipment();

  const activeAssignment = allAssignments.find(a => !a.returnedDate);

  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "in_use":
        return "bg-blue-500";
      case "maintenance":
        return "bg-yellow-500";
      case "retired":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  };

  const getConditionBadge = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800",
      fair: "bg-yellow-100 text-yellow-800",
      poor: "bg-red-100 text-red-800",
    };
    return colors[condition] || "bg-gray-100 text-gray-800";
  };

  const handleRetire = async () => {
    if (confirm("Are you sure you want to retire this equipment? This action cannot be undone.")) {
      await retireEquipment(id);
      router.push("/field-services/equipment");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Equipment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsMaintenance =
    equipment.nextMaintenanceDate &&
    new Date(equipment.nextMaintenanceDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {equipment.make} {equipment.model}
            </h1>
            <p className="text-muted-foreground">{equipment.equipmentType}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(equipment.status)}`} />
            <Badge variant="secondary">{equipment.status}</Badge>
            <Badge className={getConditionBadge(equipment.condition)}>
              {equipment.condition}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
          {equipment.status === "available" && (
            <Button onClick={() => setShowCheckOut(true)}>
              <Package className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          )}
          {equipment.status === "in_use" && activeAssignment && (
            <Button variant="secondary" onClick={() => setShowCheckIn(true)}>
              Check In
            </Button>
          )}
          {equipment.status !== "retired" && (
            <Button variant="destructive" onClick={handleRetire}>
              Retire
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {needsMaintenance && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Maintenance Due Soon</p>
              <p className="text-sm text-yellow-700">
                Next maintenance scheduled for{" "}
                {format(new Date(equipment.nextMaintenanceDate!), "MMM d, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeAssignment && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="flex items-center gap-2 py-4">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Currently Assigned</p>
              <p className="text-sm text-blue-700">
                Checked out to {activeAssignment.resource?.profile?.name} on{" "}
                {format(new Date(activeAssignment.assignedDate), "MMM d, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">
            Assignment History ({allAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-medium">{equipment.serialNumber || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{equipment.location || "N/A"}</p>
                </div>

                {equipment.purchaseDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">
                      {format(new Date(equipment.purchaseDate), "MMM d, yyyy")}
                    </p>
                  </div>
                )}

                {equipment.purchaseCost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Cost</p>
                    <p className="font-medium">${equipment.purchaseCost.toLocaleString()}</p>
                  </div>
                )}

                {equipment.currentValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="font-medium">${equipment.currentValue.toLocaleString()}</p>
                  </div>
                )}

                {equipment.warrantyExpiry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                    <p className="font-medium">
                      {format(new Date(equipment.warrantyExpiry), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {equipment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{equipment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>
                View all past and current equipment assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assignment history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {assignment.resource?.profile?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.resource?.profile?.email}
                          </p>
                        </div>
                        {!assignment.returnedDate && (
                          <Badge>Currently Assigned</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Checked Out</p>
                          <p>{format(new Date(assignment.assignedDate), "MMM d, yyyy h:mm a")}</p>
                        </div>

                        {assignment.returnedDate && (
                          <div>
                            <p className="text-muted-foreground">Checked In</p>
                            <p>
                              {format(new Date(assignment.returnedDate), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        )}

                        {assignment.conditionAtCheckout && (
                          <div>
                            <p className="text-muted-foreground">Condition at Checkout</p>
                            <Badge className={getConditionBadge(assignment.conditionAtCheckout)}>
                              {assignment.conditionAtCheckout}
                            </Badge>
                          </div>
                        )}

                        {assignment.conditionAtReturn && (
                          <div>
                            <p className="text-muted-foreground">Condition at Return</p>
                            <Badge className={getConditionBadge(assignment.conditionAtReturn)}>
                              {assignment.conditionAtReturn}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {assignment.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{assignment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {equipment.maintenanceSchedule && (
                  <div>
                    <p className="text-sm text-muted-foreground">Schedule</p>
                    <p className="font-medium">{equipment.maintenanceSchedule}</p>
                  </div>
                )}

                {equipment.lastMaintenanceDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Maintenance</p>
                    <p className="font-medium">
                      {format(new Date(equipment.lastMaintenanceDate), "MMM d, yyyy")}
                    </p>
                  </div>
                )}

                {equipment.nextMaintenanceDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Next Maintenance</p>
                    <p
                      className={`font-medium ${
                        needsMaintenance ? "text-red-600" : ""
                      }`}
                    >
                      {format(new Date(equipment.nextMaintenanceDate), "MMM d, yyyy")}
                      {needsMaintenance && " (Due Soon)"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CheckOutDialog
        open={showCheckOut}
        onOpenChange={setShowCheckOut}
        equipmentId={id}
      />

      {activeAssignment && (
        <CheckInDialog
          open={showCheckIn}
          onOpenChange={setShowCheckIn}
          equipmentId={id}
          assignmentId={activeAssignment.id}
        />
      )}

      <EquipmentDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        equipment={equipment}
      />
    </div>
  );
}
