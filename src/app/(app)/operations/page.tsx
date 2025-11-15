"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle, CheckSquare, Cog, Target, UserCog, Clock, TrendingUp } from "lucide-react";
import { MyTasksWidget } from "@/components/tasks/my-tasks-widget";
import Link from "next/link";

export default function OperationsDashboard() {
  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: "Active Tasks",
      value: "0",
      change: "Create tasks",
      note: "in progress",
      icon: CheckSquare,
      color: "text-blue-600"
    },
    {
      title: "Workflows Running",
      value: "0",
      change: "Set up workflows",
      note: "automated processes",
      icon: Target,
      color: "text-purple-600"
    },
    {
      title: "Team Efficiency",
      value: "0%",
      change: "Track performance",
      note: "completion rate",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Resources Active",
      value: "0",
      change: "Manage team",
      note: "team members",
      icon: UserCog,
      color: "text-orange-600"
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operations Dashboard</h2>
          <p className="text-muted-foreground">
            Task management, workflow automation, and resource coordination
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/operations/workflows">
              <Target className="mr-2 h-4 w-4" /> Workflows
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tasks">
              <PlusCircle className="mr-2 h-4 w-4" /> New Task
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

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <MyTasksWidget />
        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
            <CardDescription>
              Active automation workflows and their status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <Cog className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Workflow monitoring coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Tasks</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">View and manage all tasks</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/operations/workflows">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflows</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Automate business processes</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/operations/resources">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage team and resources</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
