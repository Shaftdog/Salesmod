"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Home,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderDetail {
  id: string;
  status: string;
  ordered_date: string;
  due_date: string;
  order_type: string;
  property: {
    address: string;
    city: string;
    state: string;
    zip: string;
    property_type: string;
  };
}

export default function BorrowerOrderViewPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAccessAndLoadOrder();
  }, [params.id]);

  const checkAccessAndLoadOrder = async () => {
    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if borrower has access to this order
      const { data: access } = await supabase
        .from("borrower_order_access")
        .select("id, expires_at")
        .eq("borrower_id", session.user.id)
        .eq("order_id", params.id)
        .single();

      if (!access) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // Check if access has expired
      if (access.expires_at && new Date(access.expires_at) < new Date()) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      setHasAccess(true);

      // Load order details
      const { data: orderData, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          ordered_date,
          due_date,
          order_type,
          properties(
            address,
            city,
            state,
            zip,
            property_type
          )
        `)
        .eq("id", params.id)
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
        label: "Order Received",
        variant: "secondary"
      },
      in_progress: {
        icon: AlertCircle,
        color: "text-blue-600",
        label: "In Progress",
        variant: "default"
      },
      inspection_complete: {
        icon: CheckCircle2,
        color: "text-blue-700",
        label: "Inspection Complete",
        variant: "default"
      },
      writing: {
        icon: FileText,
        color: "text-blue-800",
        label: "Report Being Written",
        variant: "default"
      },
      review: {
        icon: AlertCircle,
        color: "text-orange-600",
        label: "Under Review",
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
        label: "Report Delivered",
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
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view this appraisal order, or your access has expired.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact your lender if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground">
                The appraisal order you're looking for doesn't exist.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Appraisal Order Status</h1>
          <p className="text-muted-foreground">Track the progress of your property appraisal</p>
        </div>

        {/* Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                {getStatusBadge(order.status)}
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="font-medium capitalize">
                  {order.property.property_type?.replace("_", " ") || "Not specified"}
                </p>
              </div>
              <div>
                <Label>Appraisal Type</Label>
                <p className="font-medium capitalize">
                  {order.order_type?.replace("_", " ") || "Standard"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
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

        {/* Download Report */}
        {(order.status === "delivered" || order.status === "completed") && (
          <Card>
            <CardHeader>
              <CardTitle>Appraisal Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Your appraisal report is ready for download
                </p>
                <Button size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Questions about your appraisal?</p>
                <p>
                  Please contact your lender or loan officer for any questions or concerns
                  about this appraisal order.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-muted-foreground mb-1">{children}</p>;
}
