"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle, ClipboardList, CheckCircle, Clock, AlertTriangle, Factory, FileCheck } from "lucide-react";
import Link from "next/link";

export default function ProductionDashboard() {
  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: "Active Appraisals",
      value: "0",
      change: "Start production",
      note: "in progress",
      icon: ClipboardList,
      color: "text-blue-600"
    },
    {
      title: "Completed Today",
      value: "0",
      change: "Track daily output",
      note: "appraisals finished",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Average Time",
      value: "0h",
      change: "Measure efficiency",
      note: "per appraisal",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Quality Score",
      value: "0%",
      change: "Ensure standards",
      note: "QC pass rate",
      icon: FileCheck,
      color: "text-purple-600"
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Dashboard</h2>
          <p className="text-muted-foreground">
            Appraisal production tracking, quality control, and efficiency metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/production/templates">
              <FileCheck className="mr-2 h-4 w-4" /> Templates
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/production/my-tasks">
              <Clock className="mr-2 h-4 w-4" /> My Tasks
            </Link>
          </Button>
          <Button asChild>
            <Link href="/production/board">
              <Factory className="mr-2 h-4 w-4" /> Production Board
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
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/board">
            <CardHeader>
              <CardTitle>Production Board</CardTitle>
              <CardDescription>
                Track appraisals through 10 production stages with Kanban board
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-48">
              <div className="text-center">
                <Factory className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">View production Kanban board</p>
                <Button variant="link" className="mt-2">
                  Open Board <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quality Control Queue</CardTitle>
            <CardDescription>
              Appraisals pending quality review
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>QC queue coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/active-appraisals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Appraisals</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">View all appraisals in production</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/quality-control">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Control</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Review and approve appraisals</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/templates">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage appraisal templates</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
