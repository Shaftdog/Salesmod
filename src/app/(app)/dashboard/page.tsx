"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, PlusCircle } from "lucide-react";
import { OrdersList } from "@/components/orders/orders-list";
import { useOrders } from "@/hooks/use-orders";
import Link from "next/link";
import { OrderStatusChart } from "./_components/order-status-chart";
import { GoalsWidget } from "./_components/goals-widget";
import { MyTasksWidget } from "@/components/tasks/my-tasks-widget";
import { SuggestionsWidget } from "@/components/ai/suggestions-widget";
import { useMemo } from "react";
import { isToday, isPast, parseISO, startOfDay } from "date-fns";

export default function Dashboard() {
  const { orders, isLoading } = useOrders();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    
    const newOrdersToday = orders.filter(o => 
      isToday(parseISO(o.orderedDate))
    ).length;

    const inProgressOrders = orders.filter(o => 
      o.status === 'in_progress' || o.status === 'scheduled' || o.status === 'assigned'
    ).length;

    const dueToday = orders.filter(o => 
      isToday(parseISO(o.dueDate))
    ).length;

    const overdue = orders.filter(o => 
      isPast(parseISO(o.dueDate)) && 
      o.status !== 'completed' && 
      o.status !== 'delivered' && 
      o.status !== 'cancelled'
    ).length;

    return [
      { title: "New Orders Today", value: newOrdersToday.toString(), change: "", note: "created today" },
      { title: "In Progress", value: inProgressOrders.toString(), change: "", note: "active orders" },
      { title: "Due Today", value: dueToday.toString(), change: "", note: "need completion" },
      { title: "Overdue", value: overdue.toString(), change: overdue > 0 ? "⚠️" : "✓", note: overdue > 0 ? "requires attention" : "all on track" },
    ];
  }, [orders]);
  
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/orders/new">
              <PlusCircle className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change} {stat.note}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              A list of the 5 most recent orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersList orders={recentOrders} isMinimal={true} />
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>
                A breakdown of all orders by their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusChart />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GoalsWidget />
        <MyTasksWidget />
        <SuggestionsWidget />
      </div>
    </div>
  );
}
