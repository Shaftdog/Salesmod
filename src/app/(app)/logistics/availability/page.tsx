"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Plus,
  Clock,
  Ban,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useResources } from "@/hooks/use-resources";
import { useAvailability, useDeleteAvailability, useApproveTimeOff } from "@/hooks/use-availability";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { AvailabilityDialog } from "@/components/field-services/availability-dialog";
import type { ResourceAvailability } from "@/lib/types";

export default function AvailabilityPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ResourceAvailability | null>(null);

  const { data: resources = [] } = useResources({ isBookable: true });

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data: availability = [], isLoading } = useAvailability({
    resourceId: selectedResourceId || undefined,
    dateFrom: monthStart.toISOString(),
    dateTo: monthEnd.toISOString(),
  });

  const { mutateAsync: deleteAvailability } = useDeleteAvailability();
  const { mutateAsync: approveTimeOff } = useApproveTimeOff();

  const handlePreviousMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const handleThisMonth = () => {
    setSelectedMonth(new Date());
  };

  const handleAdd = () => {
    setSelectedEntry(null);
    setShowDialog(true);
  };

  const handleEdit = (entry: ResourceAvailability) => {
    setSelectedEntry(entry);
    setShowDialog(true);
  };

  const handleDelete = async (entry: ResourceAvailability) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteAvailability(entry.id);
    }
  };

  const handleApprove = async (entry: ResourceAvailability) => {
    // In a real app, get the current user's ID
    await approveTimeOff({
      id: entry.id,
      approvedBy: "current-user-id", // TODO: Get from auth context
    });
  };

  // Group entries by type
  const timeOff = availability.filter(a => a.availabilityType === "time_off");
  const blockedTime = availability.filter(a => a.availabilityType === "blocked");
  const workingHours = availability.filter(a => a.availabilityType === "working_hours");

  const pendingApprovals = timeOff.filter(a => !a.approvedBy);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "time_off":
        return <Clock className="h-4 w-4" />;
      case "blocked":
        return <Ban className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "time_off":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Availability Calendar</h1>
          <p className="text-muted-foreground">Manage working hours, time off, and availability</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Entries</CardDescription>
            <CardTitle className="text-3xl">{availability.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Time Off Requests</CardDescription>
            <CardTitle className="text-3xl">{timeOff.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocked Time</CardDescription>
            <CardTitle className="text-3xl">{blockedTime.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Approvals</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">{pendingApprovals.length}</CardTitle>
              {pendingApprovals.length > 0 && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Month & Resource Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleThisMonth}>
                  This Month
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-lg font-semibold">
                {format(selectedMonth, "MMMM yyyy")}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All resources..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Resources</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.profile?.name || "Unknown"} - {resource.resourceType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-yellow-600" />
              Pending Time Off Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {entry.resource?.profile?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.startDatetime), "MMM d")} -{" "}
                      {format(new Date(entry.endDatetime), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(entry)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(entry)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Entries */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : availability.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No entries found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedResourceId
                ? "No availability entries for this resource"
                : "Add your first availability entry"}
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availability
            .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
            .map((entry) => {
              const startDate = new Date(entry.startDatetime);
              const endDate = new Date(entry.endDatetime);
              const showTime = !entry.isAllDay;

              return (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.availabilityType)}
                      <CardTitle className="text-base capitalize">
                        {entry.availabilityType.replace("_", " ")}
                      </CardTitle>
                    </div>
                    <Badge className={getTypeColor(entry.availabilityType)}>
                      {entry.availabilityType}
                    </Badge>
                  </div>
                  {entry.resource && (
                    <CardDescription>{entry.resource.profile?.name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Dates</p>
                    <p className="font-medium">
                      {format(startDate, "MMM d")} -{" "}
                      {format(endDate, "MMM d, yyyy")}
                    </p>
                  </div>

                  {showTime && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                      </p>
                    </div>
                  )}

                  {entry.reason && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Reason</p>
                      <p className="font-medium">{entry.reason}</p>
                    </div>
                  )}

                  {entry.availabilityType === "time_off" && (
                    <div className="flex items-center gap-2">
                      {entry.status === 'approved' || entry.approvedBy ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  )}

                  {entry.isRecurring && (
                    <Badge variant="secondary">Recurring</Badge>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(entry)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(entry)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
        </div>
      )}

      <AvailabilityDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        entry={selectedEntry}
        resourceId={selectedResourceId}
      />
    </div>
  );
}
