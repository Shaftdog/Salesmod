"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle, TrendingUp, TrendingDown, Users, Target, MapPin, Briefcase } from "lucide-react";
import { OrdersList } from "@/components/orders/orders-list";
import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useDeals } from "@/hooks/use-deals";
import { useProperties } from "@/hooks/use-properties";
import Link from "next/link";
import { useMemo } from "react";
import { isToday, isPast, parseISO, startOfDay, subDays, isAfter } from "date-fns";

export default function SalesDashboard() {
  const { orders, isLoading: ordersLoading } = useOrders();
  const { clients, isLoading: clientsLoading } = useClients();
  const { deals, isLoading: dealsLoading } = useDeals();
  const { properties, isLoading: propertiesLoading } = useProperties();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = subDays(today, 7);

    // Orders metrics
    const newOrdersToday = orders.filter(o =>
      isToday(parseISO(o.orderedDate))
    ).length;

    const inProgressOrders = orders.filter(o =>
      o.status === 'in_progress' || o.status === 'scheduled' || o.status === 'assigned'
    ).length;

    // Clients metrics
    const activeClients = clients.filter(c => c.isActive).length;
    const newClientsThisWeek = clients.filter(c =>
      c.createdAt && isAfter(parseISO(c.createdAt), last7Days)
    ).length;

    // Deals metrics
    const activeDeals = deals.filter(d => d.stage === 'negotiation' || d.stage === 'proposal').length;
    const wonDeals = deals.filter(d => d.stage === 'won').length;

    // Properties metrics
    const totalProperties = properties.length;
    const recentProperties = properties.filter((p: any) =>
      p.createdAt && isAfter(parseISO(p.createdAt), last7Days)
    ).length;

    return [
      {
        title: "Active Orders",
        value: inProgressOrders.toString(),
        change: `+${newOrdersToday} today`,
        note: "in pipeline",
        icon: TrendingUp,
        color: "text-green-600"
      },
      {
        title: "Active Clients",
        value: activeClients.toString(),
        change: `+${newClientsThisWeek} this week`,
        note: "client accounts",
        icon: Briefcase,
        color: "text-blue-600"
      },
      {
        title: "Active Deals",
        value: activeDeals.toString(),
        change: `${wonDeals} won`,
        note: "in negotiation",
        icon: Target,
        color: "text-purple-600"
      },
      {
        title: "Total Properties",
        value: totalProperties.toString(),
        change: `+${recentProperties} this week`,
        note: "properties tracked",
        icon: MapPin,
        color: "text-orange-600"
      },
    ];
  }, [orders, clients, deals, properties]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  // Sales pipeline data
  const pipelineData = useMemo(() => {
    const pipeline = [
      { stage: "Lead", count: deals.filter(d => d.stage === 'lead').length },
      { stage: "Qualified", count: deals.filter(d => d.stage === 'qualified').length },
      { stage: "Proposal", count: deals.filter(d => d.stage === 'proposal').length },
      { stage: "Negotiation", count: deals.filter(d => d.stage === 'negotiation').length },
      { stage: "Won", count: deals.filter(d => d.stage === 'won').length },
    ];
    return pipeline;
  }, [deals]);

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
          <Button asChild variant="outline">
            <Link href="/deals/new">
              <PlusCircle className="mr-2 h-4 w-4" /> New Deal
            </Link>
          </Button>
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

      {/* Sales Pipeline & Recent Orders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders in the sales pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersList orders={recentOrders} isMinimal={true} />
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>
              Deal stages and conversion funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-blue-100 text-blue-700' :
                      index === 1 ? 'bg-purple-100 text-purple-700' :
                      index === 2 ? 'bg-yellow-100 text-yellow-700' :
                      index === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {stage.count}
                    </div>
                    <span className="text-sm font-medium">{stage.stage}</span>
                  </div>
                  <div className="h-2 flex-1 mx-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-purple-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((stage.count / Math.max(...pipelineData.map(s => s.count))) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View All Orders</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage all orders</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/clients">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View All Clients</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage client accounts</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/deals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View All Deals</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Track deal progress</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/properties">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View All Properties</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Browse properties</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
