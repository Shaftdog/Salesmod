"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle, TrendingUp, Package, Briefcase, Users, Target, LifeBuoy, MapPin } from "lucide-react";
import Link from "next/link";

export default function SalesDashboard() {
  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: "Active Orders",
      value: "0",
      change: "No orders yet",
      note: "in progress",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Active Deals",
      value: "0",
      change: "Start tracking",
      note: "in pipeline",
      icon: Target,
      color: "text-purple-600"
    },
    {
      title: "Total Clients",
      value: "0",
      change: "Build relationships",
      note: "client accounts",
      icon: Briefcase,
      color: "text-green-600"
    },
    {
      title: "Properties",
      value: "0",
      change: "Manage properties",
      note: "in database",
      icon: MapPin,
      color: "text-orange-600"
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of sales performance, pipeline, and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/orders/new">
              <PlusCircle className="mr-2 h-4 w-4" /> New Order
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
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>
              Track deals through stages from lead to close
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Pipeline visualization coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest orders, deals, and customer interactions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Activity timeline coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage appraisal orders</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/clients">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Client accounts and contacts</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/contacts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacts</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Contact directory</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/deals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Sales pipeline and opportunities</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/cases">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cases</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Support and service cases</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/properties">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Property database</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
