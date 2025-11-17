"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle, CalendarClock, MapPinned, UserCog, Truck, Clock, MapPin, Package, Users } from "lucide-react";
import Link from "next/link";
import { useTodayBookings } from "@/hooks/use-bookings";
import { useResources } from "@/hooks/use-resources";
import { useEquipment } from "@/hooks/use-equipment";
import { useTerritories } from "@/hooks/use-territories";

export default function LogisticsDashboard() {
  // Load real data
  const { data: todayBookings = [] } = useTodayBookings();
  const { data: resources = [] } = useResources();
  const { data: equipment = [] } = useEquipment();
  const { data: territories = [] } = useTerritories();

  const bookableResources = resources.filter(r => r.isBookable);
  const activeEquipment = equipment.filter(e => e.status === "active");

  const stats = [
    {
      title: "Scheduled Today",
      value: todayBookings.length.toString(),
      change: todayBookings.filter(b => b.status === 'scheduled').length + " pending",
      note: "appointments",
      icon: CalendarClock,
      color: "text-blue-600"
    },
    {
      title: "Active Resources",
      value: bookableResources.length.toString(),
      change: resources.length + " total",
      note: "field staff",
      icon: UserCog,
      color: "text-purple-600"
    },
    {
      title: "Equipment",
      value: equipment.length.toString(),
      change: activeEquipment.length + " in service",
      note: "total items",
      icon: Package,
      color: "text-green-600"
    },
    {
      title: "Territories",
      value: territories.length.toString(),
      change: "Coverage zones",
      note: "service areas",
      icon: MapPinned,
      color: "text-orange-600"
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Logistics Dashboard</h2>
          <p className="text-muted-foreground">
            Resource scheduling, equipment management, and field operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/logistics/daily-schedule">
              <Clock className="mr-2 h-4 w-4" /> Daily View
            </Link>
          </Button>
          <Button asChild>
            <Link href="/logistics/bookings">
              <CalendarClock className="mr-2 h-4 w-4" /> Bookings
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{stat.change}</span> {stat.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Schedule</CardTitle>
            <CardDescription>
              Today's inspection schedule and assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Daily schedule view coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>
              Optimized routes and inspection locations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Route mapping coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/resources">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage field staff and assets</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/equipment">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Track vehicles and tools</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/territories">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Territories</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Define service coverage areas</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/availability">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Working hours and time off</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/bookings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Schedule appointments</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/daily-schedule">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily View</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Today's schedule and clock in/out</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
