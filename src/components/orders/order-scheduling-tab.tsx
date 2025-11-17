"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  User,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  PhoneCall,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useBookings } from "@/hooks/use-bookings";
import { useOrderContactAttempts } from "@/hooks/use-contact-attempts";
import type { Order } from "@/lib/types";
import { ScheduleInspectionDialog } from "./schedule-inspection-dialog";
import { cn } from "@/lib/utils";

interface OrderSchedulingTabProps {
  order: Order;
}

export function OrderSchedulingTab({ order }: OrderSchedulingTabProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Load bookings for this order
  const { data: bookingsResponse, isLoading: bookingsLoading } = useBookings({
    orderId: order.id,
  });
  const bookings = bookingsResponse || [];

  // Load contact attempts for this order
  const { data: attemptsResponse, isLoading: attemptsLoading } = useOrderContactAttempts(order.id);
  const attempts = attemptsResponse?.data || [];

  // Get the most recent booking
  const latestBooking = bookings.length > 0
    ? bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Count contact attempts by outcome
  const attemptStats = attempts.reduce((acc, attempt) => {
    acc[attempt.outcome] = (acc[attempt.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalAttempts = attempts.length;
  const successfulAttempts = (attemptStats.connected || 0) + (attemptStats.scheduled || 0);

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inspection Scheduling</h3>
          <p className="text-sm text-muted-foreground">
            Manage inspections and track communication
          </p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Schedule Inspection
        </Button>
      </div>

      {/* Contact Attempts Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Contact Attempts
            {totalAttempts > 0 && (
              <Badge variant="secondary">{totalAttempts}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Communication history for scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attemptsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : totalAttempts === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No contact attempts yet</p>
              <p className="text-xs mt-1">
                Make a call or send an email to get started
              </p>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalAttempts}</div>
                  <div className="text-xs text-muted-foreground">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{successfulAttempts}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {totalAttempts - successfulAttempts}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Recent Attempts Timeline */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Recent Attempts</h4>
                {attempts
                  .slice(0, 5)
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className={cn(
                        "mt-0.5 p-1.5 rounded-full",
                        attempt.outcome === 'connected' || attempt.outcome === 'scheduled'
                          ? "bg-green-100 text-green-700"
                          : attempt.outcome === 'no_answer' || attempt.outcome === 'voicemail'
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {attempt.attemptType === 'phone_call' ? (
                          <Phone className="h-3.5 w-3.5" />
                        ) : attempt.attemptType === 'email' ? (
                          <Mail className="h-3.5 w-3.5" />
                        ) : attempt.attemptType === 'sms' ? (
                          <MessageSquare className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">
                            {attempt.attemptType.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {attempt.outcome.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(parseISO(attempt.attemptedAt), { addSuffix: true })}
                          </span>
                          {attempt.attemptedByProfile && (
                            <>
                              <span>•</span>
                              <span>{attempt.attemptedByProfile.name}</span>
                            </>
                          )}
                        </div>
                        {attempt.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {attempt.notes}
                          </p>
                        )}
                        {attempt.callbackRequestedAt && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Clock className="h-3 w-3" />
                            <span>
                              Callback requested for {format(parseISO(attempt.callbackRequestedAt), "PPp")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                {attempts.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full">
                    View All {attempts.length} Attempts
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bookings Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Inspections
            {bookings.length > 0 && (
              <Badge variant="secondary">{bookings.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Scheduled and completed inspections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No inspections scheduled</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowScheduleDialog(true)}
              >
                Schedule First Inspection
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={cn(
                      "mt-0.5 p-2 rounded-full",
                      booking.status === 'completed'
                        ? "bg-green-100 text-green-700"
                        : booking.status === 'scheduled' || booking.status === 'confirmed'
                        ? "bg-blue-100 text-blue-700"
                        : booking.status === 'cancelled'
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {booking.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <CalendarClock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
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

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">{booking.propertyAddress}</span>
                        </div>

                        {booking.specialInstructions && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                            <strong>Instructions:</strong> {booking.specialInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps / Recommendations */}
      {latestBooking && latestBooking.status === 'scheduled' && totalAttempts === 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="flex items-start gap-2 py-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Recommendation</p>
              <p className="text-sm text-blue-700 mt-1">
                Inspection is scheduled but no contact attempts logged. Consider calling to confirm.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ScheduleInspectionDialog
        order={order}
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
      />
    </div>
  );
}
