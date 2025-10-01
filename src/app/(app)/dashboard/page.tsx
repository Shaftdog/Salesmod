import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, ArrowUpRight, PlusCircle } from "lucide-react";
import { OrdersTable } from "@/components/orders/orders-table";
import { orders } from "@/lib/data";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OrderStatusChart } from "./_components/order-status-chart";

const stats = [
    { title: "New Orders Today", value: "12", change: "+25%", note: "since yesterday" },
    { title: "In Progress", value: "48", change: "+10%", note: "this week" },
    { title: "Due Today", value: "8", change: "-5%", note: "vs yesterday" },
    { title: "Overdue", value: "3", change: "+1", note: "this week" },
];

export default function Dashboard() {
  const recentOrders = orders.slice(0, 10);
  
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
              A list of the 10 most recent orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersTable orders={recentOrders} isMinimal={true} />
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
    </div>
  );
}
