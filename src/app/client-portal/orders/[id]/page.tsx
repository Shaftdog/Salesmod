"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Home,
  Calendar,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  User
} from "lucide-react";
import Link from "next/link";

interface OrderDetail {
  id: string;
  status: string;
  ordered_date: string;
  due_date: string;
  order_type: string;
  fee: number;
  notes: string;
  property: {
    address: string;
    city: string;
    state: string;
    zip: string;
    property_type: string;
  };
  borrower_name?: string;
  loan_number?: string;
}

export default function ClientOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadOrderDetail();
  }, [params.id]);

  const loadOrderDetail = async () => {
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

      // Load order with property details
      const { data: orderData, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          ordered_date,
          due_date,
          order_type,
          fee,
          notes,
          borrower_name,
          loan_number,
          properties(
            address,
            city,
            state,
            zip,
            property_type
          )
        `)
        .eq("id", params.id)
        .eq("tenant_id", profile?.tenant_id)
        .single();

      if (error) {
        console.error("Error loading order:", error);
        return;
      }

      if (orderData) {
        setOrder({
          id: orderData.id,
          status: orderData.status,
          ordered_date: orderData.ordered_date,
          due_date: orderData.due_date,
          order_type: orderData.order_type,
          fee: orderData.fee,
          notes: orderData.notes,
          borrower_name: orderData.borrower_name,
          loan_number: orderData.loan_number,
          property: orderData.properties,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; color: string; label: string; variant: any }> = {
      pending: {
        icon: Clock,
        color: "text-yellow-600",
        label: "Pending Review",
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

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order not found</h3>
              <p className="text-muted-foreground mb-4">
                The order you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button asChild>
                <Link href="/client-portal/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/client-portal/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
            </div>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <CardTitle>Property Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Address</Label>
                  <p className="text-lg font-medium">{order.property.address}</p>
                  <p className="text-muted-foreground">
                    {order.property.city}, {order.property.state} {order.property.zip}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Property Type</Label>
                    <p className="font-medium">{order.property.property_type || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.ordered_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Expected Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.due_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Order Type</Label>
                  <p className="font-medium">{order.order_type || "Standard Appraisal"}</p>
                </div>
                <Separator />
                <div>
                  <Label>Fee</Label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-bold">{order.fee?.toFixed(2) || "TBD"}</p>
                  </div>
                </div>
                {order.borrower_name && (
                  <>
                    <Separator />
                    <div>
                      <Label>Borrower</Label>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{order.borrower_name}</p>
                      </div>
                    </div>
                  </>
                )}
                {order.loan_number && (
                  <>
                    <Separator />
                    <div>
                      <Label>Loan Number</Label>
                      <p className="font-mono text-sm">{order.loan_number}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.status === "delivered" || order.status === "completed" ? (
                  <Button className="w-full" variant="default">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    <FileText className="mr-2 h-4 w-4" />
                    Report Not Ready
                  </Button>
                )}
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/client-portal/orders/${order.id}/messages`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Contact Appraiser
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-muted-foreground mb-1">{children}</p>;
}
