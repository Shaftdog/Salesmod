"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, MapPin, CalendarClock, AlertCircle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { useBookings } from "@/hooks/use-bookings";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PropertyBookingsSectionProps {
  propertyId: string;
  propertyAddress?: string;
}

export function PropertyBookingsSection({
  propertyId,
  propertyAddress,
}: PropertyBookingsSectionProps) {
  // Load all bookings for this property
  const { data: bookingsResponse, isLoading } = useBookings({
    // Note: This will need the property filter to be added to the bookings API
    // For now, we'll filter client-side as a fallback
  });

  // Client-side filter by property_id (until API supports it)
  const bookings = (bookingsResponse || []).filter(
    (booking: any) => booking.propertyId === propertyId
  );

  // Categorize bookings
  const upcoming = bookings.filter((b: any) =>
    isFuture(parseISO(b.scheduledStart)) && ['scheduled', 'confirmed'].includes(b.status)
  );
  const past = bookings.filter((b: any) =>
    (isPast(parseISO(b.scheduledStart)) && b.status !== 'cancelled') || b.status === 'completed'
  );
  const cancelled = bookings.filter((b: any) => b.status === 'cancelled');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Inspection History
              {bookings.length > 0 && (
                <Badge variant="secondary">{bookings.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              All inspections and appointments for this property
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No Inspections Yet</p>
            <p className="text-sm mt-1">
              Inspections scheduled for this property will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Inspections */}
            {upcoming.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming ({upcoming.length})
                </h4>
                <div className="space-y-3">
                  {upcoming
                    .sort((a: any, b: any) =>
                      new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
                    )
                    .map((booking: any) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                </div>
              </div>
            )}

            {/* Past Inspections */}
            {past.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Past ({past.length})
                </h4>
                <div className="space-y-3">
                  {past
                    .sort((a: any, b: any) =>
                      new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
                    )
                    .slice(0, 5) // Show only 5 most recent
                    .map((booking: any) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  {past.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full">
                      View All {past.length} Past Inspections
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Cancelled Inspections */}
            {cancelled.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer font-semibold text-sm mb-3 flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Cancelled ({cancelled.length})
                  <span className="ml-auto text-xs group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="space-y-3 mt-2">
                  {cancelled
                    .sort((a: any, b: any) =>
                      new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
                    )
                    .map((booking: any) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'scheduled':
      case 'confirmed':
        return <CalendarClock className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className={cn(
        "mt-0.5 p-2 rounded-full border",
        getStatusColor(booking.status)
      )}>
        {getStatusIcon(booking.status)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-medium">{booking.bookingNumber}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {booking.bookingType} Inspection
            </p>
          </div>
          <Badge variant={
            booking.status === 'completed' ? 'default' :
            booking.status === 'cancelled' ? 'destructive' :
            'secondary'
          }>
            {booking.status}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {format(parseISO(booking.scheduledStart), "PPP")} at{" "}
              {format(parseISO(booking.scheduledStart), "p")}
            </span>
          </div>

          {booking.resource && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{booking.resource.profile?.name || 'Unassigned'}</span>
            </div>
          )}

          {booking.order && (
            <div className="flex items-center gap-2">
              <Link
                href={`/orders/${booking.order.id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Order #{booking.order.orderNumber}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {booking.completedAt && (
            <div className="flex items-center gap-2 text-green-600 text-xs mt-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                Completed {format(parseISO(booking.completedAt), "PPP 'at' p")}
              </span>
            </div>
          )}

          {booking.specialInstructions && (
            <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
              <strong>Instructions:</strong> {booking.specialInstructions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
