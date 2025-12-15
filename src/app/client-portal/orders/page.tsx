"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Home, Search, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  property_address: string;
  status: string;
  ordered_date: string;
  due_date: string;
  order_type: string;
}

export default function OrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Get user's tenant_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", session.user.id)
        .single();

      // Load all orders for this tenant
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
        .order("ordered_date", { ascending: false });

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
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((order) =>
        order.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; color: string; label: string; variant: any }> = {
      pending: {
        icon: Clock,
        color: "text-yellow-600",
        label: "Pending",
        variant: "secondary"
      },
      in_progress: {
        icon: AlertCircle,
        color: "text-blue-600",
        label: "In Progress",
        variant: "default"
      },
      completed: {
        icon: CheckCircle2,
        color: "text-green-600",
        label: "Completed",
        variant: "default"
      },
      delivered: {
        icon: CheckCircle2,
        color: "text-green-700",
        label: "Delivered",
        variant: "default"
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your appraisal requests
          </p>
        </div>
        <Button asChild>
          <Link href="/client-portal/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {orders.length === 0 ? "No orders yet" : "No matching orders"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {orders.length === 0
                  ? "Get started by requesting your first appraisal"
                  : "Try adjusting your search or filters"}
              </p>
              {orders.length === 0 && (
                <Button asChild>
                  <Link href="/client-portal/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Request Appraisal
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{order.property_address}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {order.order_type || "Standard"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ordered: {new Date(order.ordered_date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {new Date(order.due_date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    {getStatusBadge(order.status)}
                    <Button asChild size="sm">
                      <Link href={`/client-portal/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
