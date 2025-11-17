"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
} from "lucide-react";
import { useResources } from "@/hooks/use-resources";
import { useTodayBookings, useDateRangeBookings } from "@/hooks/use-bookings";
import { useTodayTimeEntries, useClockStatus, useClockIn, useClockOut, useTotalHours } from "@/hooks/use-time-entries";
import { useAvailability } from "@/hooks/use-availability";
import { useEquipment } from "@/hooks/use-equipment";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, parseISO } from "date-fns";
import { ClockInDialog } from "@/components/field-services/clock-in-dialog";
import { ClockOutDialog } from "@/components/field-services/clock-out-dialog";
import Link from "next/link";

export default function DailySchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [showClockIn, setShowClockIn] = useState(false);
  const [showClockOut, setShowClockOut] = useState(false);

  const { data: resources = [] } = useResources({ isBookable: true });

  const dateStr = selectedDate.toISOString().split("T")[0];
  const nextDay = addDays(selectedDate, 1).toISOString().split("T")[0];

  const { data: bookings = [], isLoading: bookingsLoading } = useDateRangeBookings(
    dateStr,
    nextDay
  );

  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useTodayTimeEntries(
    selectedResourceId || ""
  );

  const { data: availability = [] } = useAvailability({
    resourceId: selectedResourceId,
    dateFrom: dateStr,
    dateTo: nextDay,
  });

  const { data: clockStatus } = useClockStatus(selectedResourceId || null);
  const { mutateAsync: clockIn } = useClockIn();
  const { mutateAsync: clockOut } = useClockOut();

  const { data: equipment = [] } = useEquipment();

  const hoursData = useTotalHours(
    selectedResourceId || "",
    dateStr,
    dateStr
  );

  // Filter bookings by selected resource
  const filteredBookings = selectedResourceId
    ? bookings.filter(b => b.resourceId === selectedResourceId)
    : bookings;

  const handlePreviousDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleQuickClockIn = async () => {
    if (selectedResourceId) {
      setShowClockIn(true);
    }
  };

  const handleQuickClockOut = async () => {
    if (selectedResourceId) {
      setShowClockOut(true);
    }
  };

  const isClockedIn = clockStatus?.isClockedIn || false;
  const activeEntry = clockStatus?.activeEntry;

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Get assigned equipment
  const assignedEquipment = selectedResourceId
    ? equipment.filter(e =>
        e.currentAssignment &&
        e.currentAssignment.length > 0 &&
        e.currentAssignment.some((a) => a.resourceId === selectedResourceId && !a.actualReturnDate)
      )
    : [];

  // Get time off / blocked time
  const timeOff = availability.filter(a => a.availabilityType === "time_off");
  const blockedTime = availability.filter(a => a.availabilityType === "blocked");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Schedule</h1>
          <p className="text-muted-foreground">View bookings, time entries, and availability</p>
        </div>
      </div>

      {/* Date & Resource Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-lg font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </div>

              {isToday && (
                <Badge variant="default">Today</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select resource..." />
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

      {/* Clock In/Out & Stats */}
      {selectedResourceId && isToday && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Clock Status</CardDescription>
              <div className="flex items-center gap-2">
                {isClockedIn ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-600">Clocked In</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm font-medium text-muted-foreground">Not Clocked In</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isClockedIn ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Since {activeEntry?.startTime}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleQuickClockOut}
                    className="w-full"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Clock Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleQuickClockIn}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Clock In
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Hours Today</CardDescription>
              <CardTitle className="text-3xl">
                {hoursData.totalHours}h {hoursData.remainingMinutes}m
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bookings Today</CardDescription>
              <CardTitle className="text-3xl">{filteredBookings.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Time Entries</CardDescription>
              <CardTitle className="text-3xl">{timeEntries.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {timeOff.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Time Off</p>
              <p className="text-sm text-yellow-700">
                {timeOff[0].reason} - {timeOff[0].status === 'approved' || timeOff[0].approvedBy ? "Approved" : "Pending Approval"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {assignedEquipment.length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="flex items-center gap-2 py-4">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Assigned Equipment</p>
              <p className="text-sm text-blue-700">
                {assignedEquipment.map(e => `${e.make} ${e.model}`).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bookings
            </CardTitle>
            <CardDescription>
              {filteredBookings.length} appointment{filteredBookings.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No bookings for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings
                  .sort((a, b) =>
                    new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
                  )
                  .map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/field-services/schedule`}
                      className="block"
                    >
                      <div className="border rounded-lg p-3 hover:bg-accent transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{booking.bookingNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(booking.scheduledStart), "h:mm a")} -{" "}
                              {format(parseISO(booking.scheduledEnd), "h:mm a")}
                            </p>
                          </div>
                          <Badge>{booking.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.propertyAddress}</span>
                        </div>
                        {booking.resource && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="h-4 w-4" />
                            <span>{booking.resource.profile?.name}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Entries
            </CardTitle>
            <CardDescription>
              {selectedResourceId
                ? `${timeEntries.length} entr${timeEntries.length !== 1 ? "ies" : "y"}`
                : "Select a resource to view time entries"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedResourceId ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a resource to view time entries</p>
              </div>
            ) : timeEntriesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No time entries for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries
                  .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
                  .map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium capitalize">{entry.entryType}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.startTime}
                            {entry.endTime ? ` - ${entry.endTime}` : " (In Progress)"}
                          </p>
                        </div>
                        <div className="text-right">
                          {entry.durationMinutes && (
                            <p className="font-medium">
                              {Math.floor(entry.durationMinutes / 60)}h{" "}
                              {entry.durationMinutes % 60}m
                            </p>
                          )}
                          {entry.isBillable && (
                            <Badge variant="secondary" className="text-xs">
                              Billable
                            </Badge>
                          )}
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClockInDialog
        open={showClockIn}
        onOpenChange={setShowClockIn}
        resourceId={selectedResourceId}
      />

      <ClockOutDialog
        open={showClockOut}
        onOpenChange={setShowClockOut}
        resourceId={selectedResourceId}
      />
    </div>
  );
}
