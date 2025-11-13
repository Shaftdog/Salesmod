"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEquipment, useMaintenanceDueEquipment } from "@/hooks/use-equipment";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wrench, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Equipment, EquipmentStatus } from "@/lib/types";
import { EquipmentDialog } from "@/components/field-services/equipment-dialog";

export default function EquipmentCatalogPage() {
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const { data: allEquipment = [], isLoading } = useEquipment();
  const maintenanceDue = useMaintenanceDueEquipment();

  // Filter equipment
  const filteredEquipment = allEquipment.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (typeFilter !== "all" && item.equipmentType !== typeFilter) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: allEquipment.length,
    available: allEquipment.filter((e) => e.status === "available").length,
    inUse: allEquipment.filter((e) => e.status === "in_use").length,
    maintenance: allEquipment.filter((e) => e.status === "maintenance").length,
    maintenanceDue: maintenanceDue.length,
  };

  // Get unique equipment types
  const equipmentTypes = Array.from(
    new Set(allEquipment.map((e) => e.equipmentType).filter(Boolean))
  );

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

  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setShowEquipmentDialog(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment Catalog</h1>
          <p className="text-muted-foreground">Manage equipment inventory and assignments</p>
        </div>
        <Button onClick={handleAddEquipment}>
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Equipment</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">{stats.available}</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Use</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">{stats.inUse}</CardTitle>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Maintenance</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">{stats.maintenance}</CardTitle>
              <Wrench className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maintenance Due</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">{stats.maintenanceDue}</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No equipment found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first equipment item to get started"}
            </p>
            {statusFilter === "all" && typeFilter === "all" && (
              <Button onClick={handleAddEquipment}>
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((equipment) => {
            const needsMaintenance =
              equipment.nextMaintenanceDate &&
              new Date(equipment.nextMaintenanceDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <Card key={equipment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {equipment.make} {equipment.model}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {equipment.equipmentType}
                      </CardDescription>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(equipment.status)}`} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Serial Number</span>
                      <span className="font-medium">{equipment.serialNumber || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="secondary">{equipment.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Condition</span>
                      <Badge className={getConditionBadge(equipment.condition)}>
                        {equipment.condition}
                      </Badge>
                    </div>

                    {equipment.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{equipment.location}</span>
                      </div>
                    )}

                    {needsMaintenance && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Maintenance due soon</span>
                      </div>
                    )}

                    {equipment.currentAssignment && equipment.currentAssignment.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Package className="h-4 w-4" />
                        <span>Currently assigned</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/field-services/equipment/${equipment.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEquipment(equipment)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EquipmentDialog
        open={showEquipmentDialog}
        onOpenChange={setShowEquipmentDialog}
        equipment={selectedEquipment}
      />
    </div>
  );
}
