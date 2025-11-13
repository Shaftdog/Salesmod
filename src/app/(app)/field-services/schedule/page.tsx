"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDateRangeBookings, useTodayBookings, useCreateBooking } from "@/hooks/use-bookings";
import { useResources } from "@/hooks/use-resources";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { BookingDialog } from "@/components/field-services/booking-dialog";
import type { Booking } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SchedulingBoardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const { data: bookings = [], isLoading } = useDateRangeBookings(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const { data: resources = [] } = useResources({ resourceType: "appraiser", isBookable: true });

  // Filter bookings by selected resource
  const filteredBookings = selectedResource === "all"
    ? bookings
    : bookings.filter(b => b.resourceId === selectedResource);

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddBooking = () => {
    setSelectedBooking(null);
    setShowBookingDialog(true);
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
      case "confirmed":
        return "bg-blue-500";
      case "in_progress":
        return "bg-green-500";
      case "completed":
        return "bg-gray-400";
      case "cancelled":
        return "bg-red-500";
      case "requested":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  const getBookingsForDay = (date: Date) => {
    return filteredBookings.filter(booking =>
      isSameDay(parseISO(booking.scheduledStart), date)
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduling Board</CardTitle>
              <CardDescription>
                View and manage field service appointments
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddBooking}>
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-lg font-semibold">
                {viewMode === "week" ? (
                  <>
                    {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                  </>
                ) : (
                  format(currentDate, "MMMM d, yyyy")
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.profile?.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : viewMode === "week" ? (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const dayBookings = getBookingsForDay(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 min-h-64 ${
                      isToday ? "bg-blue-50 border-blue-300" : "bg-white"
                    }`}
                  >
                    {/* Day Header */}
                    <div className="text-center mb-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isToday ? "text-blue-600" : ""
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>

                    {/* Bookings */}
                    <div className="space-y-2">
                      {dayBookings.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          No bookings
                        </div>
                      ) : (
                        dayBookings.map((booking) => (
                          <button
                            key={booking.id}
                            onClick={() => handleBookingClick(booking)}
                            className={`w-full text-left p-2 rounded text-xs ${getStatusColor(
                              booking.status
                            )} text-white hover:opacity-80 transition-opacity`}
                          >
                            <div className="font-medium truncate">
                              {format(parseISO(booking.scheduledStart), "h:mm a")}
                            </div>
                            <div className="truncate">
                              {booking.resource?.profile?.name || "Unassigned"}
                            </div>
                            <div className="truncate opacity-90">
                              {booking.propertyAddress}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Day View */
            <div className="space-y-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const hourBookings = filteredBookings.filter((booking) => {
                  const bookingHour = parseISO(booking.scheduledStart).getHours();
                  return (
                    isSameDay(parseISO(booking.scheduledStart), currentDate) &&
                    bookingHour === hour
                  );
                });

                return (
                  <div key={hour} className="flex border-b">
                    <div className="w-20 text-right pr-4 py-2 text-sm text-muted-foreground">
                      {format(new Date().setHours(hour, 0), "h:mm a")}
                    </div>
                    <div className="flex-1 min-h-16 py-2">
                      {hourBookings.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => handleBookingClick(booking)}
                          className={`w-full text-left p-3 rounded mb-2 ${getStatusColor(
                            booking.status
                          )} text-white hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium">
                              {format(parseISO(booking.scheduledStart), "h:mm a")} -{" "}
                              {format(parseISO(booking.scheduledEnd), "h:mm a")}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            {booking.resource?.profile?.name || "Unassigned"}
                          </div>
                          <div className="text-sm opacity-90">{booking.propertyAddress}</div>
                          {booking.contactName && (
                            <div className="text-xs opacity-75 mt-1">{booking.contactName}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t">
            <div className="text-sm font-medium">Status:</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-xs">Requested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-xs">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span className="text-xs">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-xs">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        booking={selectedBooking}
        resources={resources}
      />
    </div>
  );
}
