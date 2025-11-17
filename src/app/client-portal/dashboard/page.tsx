"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Home, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  property_address: string;
  status: string;
  ordered_date: string;
  due_date: string;
  order_type: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      await loadDashboardData(session.user.id);
    };

    checkAuth();
  }, [router]);

  const loadDashboardData = async (userId: string) => {
    try {
      setIsLoading(true);

      // Load user's tenant
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, tenants(id, name, type)")
        .eq("id", userId)
        .single();

      if (profile?.tenants) {
        setTenant(profile.tenants);
      }

      // Load orders for this tenant
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          ordered_date,
          due_date,
          order_type,
          properties(address)
        `)
        .eq("tenant_id", profile?.tenant_id)
        .order("ordered_date", { ascending: false })
        .limit(10);

      if (ordersData) {
        const formattedOrders = ordersData.map((order: any) => ({
          id: order.id,
          property_address: order.properties?.address || "Address not available",
          status: order.status,
          ordered_date: order.ordered_date,
          due_date: order.due_date,
          order_type: order.order_type,
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
      pending: { icon: Clock, color: "text-yellow-600", label: "Pending" },
      in_progress: { icon: AlertCircle, color: "text-blue-600", label: "In Progress" },
      completed: { icon: CheckCircle2, color: "text-green-600", label: "Completed" },
      delivered: { icon: CheckCircle2, color: "text-green-700", label: "Delivered" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    inProgress: orders.filter(o => o.status === "in_progress" || o.status === "scheduled").length,
    completed: orders.filter(o => o.status === "completed" || o.status === "delivered").length,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}
            </h1>
            {tenant && (
              <p className="text-muted-foreground mt-1">
                {tenant.name} Portal
              </p>
            )}
          </div>
          <Button asChild>
            <Link href="/client-portal/orders/new">
              <FileText className="mr-2 h-4 w-4" />
              Request Appraisal
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Ready for review</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Your most recent appraisal requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by requesting your first appraisal
                </p>
                <Button asChild>
                  <Link href="/client-portal/orders/new">Request Appraisal</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{order.property_address}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Type: {order.order_type || "Standard"}</span>
                        <span>•</span>
                        <span>Ordered: {new Date(order.ordered_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Due: {new Date(order.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/client-portal/orders/${order.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {orders.length >= 10 && (
                  <div className="text-center pt-4">
                    <Button asChild variant="outline">
                      <Link href="/client-portal/orders">View All Orders</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild variant="outline" className="h-20">
                <Link href="/client-portal/orders/new" className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Request Appraisal</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20">
                <Link href="/client-portal/orders" className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>View All Orders</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20">
                <Link href="/client-portal/settings" className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6" />
                  <span>Account Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
