"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle, CalendarClock, MapPinned, UserCog, Truck, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export default function LogisticsDashboard() {
  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: "Scheduled Today",
      value: "0",
      change: "Schedule inspections",
      note: "appointments",
      icon: CalendarClock,
      color: "text-blue-600"
    },
    {
      title: "Inspections Pending",
      value: "0",
      change: "Track progress",
      note: "to complete",
      icon: MapPinned,
      color: "text-orange-600"
    },
    {
      title: "Active Routes",
      value: "0",
      change: "Plan routes",
      note: "optimized trips",
      icon: Truck,
      color: "text-green-600"
    },
    {
      title: "Team Assigned",
      value: "0",
      change: "Assign tasks",
      note: "field staff",
      icon: UserCog,
      color: "text-purple-600"
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Logistics Dashboard</h2>
          <p className="text-muted-foreground">
            Scheduling, inspections, route planning, and field team coordination
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/logistics/inspections">
              <MapPinned className="mr-2 h-4 w-4" /> Inspections
            </Link>
          </Button>
          <Button asChild>
            <Link href="/logistics/scheduling">
              <CalendarClock className="mr-2 h-4 w-4" /> Schedule
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/scheduling">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduling</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage inspection schedules</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/inspections">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspections</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Track inspection progress</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/logistics/assignments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Assign tasks to field team</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
