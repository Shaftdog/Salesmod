"use client";

import React from "react";
import { useOrder } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAppraisers } from "@/hooks/use-appraisers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { format } from "date-fns";
import {
  File,
  Loader2,
  MessageSquare,
  Printer,
} from "lucide-react";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Progress } from "@/components/ui/progress";
import { orderStatuses } from "@/lib/types";
import { OrderMap } from "@/components/orders/order-map";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [orderId, setOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const { data: order, isLoading, error } = useOrder(orderId || "");
  const { data: clients } = useClients();
  const { data: appraisers } = useAppraisers();

  if (!orderId || isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground mt-2">The order you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Find the client and appraiser details
  const client = clients?.find(c => c.id === order.clientId);
  const appraiser = appraisers?.find(a => a.id === order.assigneeId);

  const statusIndex = orderStatuses.findIndex(s => s === order.status);
  const progressValue = (statusIndex + 1) / orderStatuses.length * 100;
  const fullAddress = `${order.propertyAddress}, ${order.propertyCity}, ${order.propertyState} ${order.propertyZip}`;


  return (
    <div className="grid gap-4 md:grid-cols-4 md:gap-8 lg:grid-cols-5">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Order {order.orderNumber}</CardTitle>
                <CardDescription>
                  Due on {format(new Date(order.dueDate), "MMMM dd, yyyy")}
                </CardDescription>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="pt-2">
                <Progress value={progressValue} aria-label={`${order.status} status`} />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold">Property</h3>
                                <p className="text-sm text-muted-foreground">{order.propertyAddress}</p>
                                <p className="text-sm text-muted-foreground">{order.propertyCity}, {order.propertyState} {order.propertyZip}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Client</h3>
                                <p className="text-sm text-muted-foreground">{client?.companyName || "Unknown"}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Borrower</h3>
                                <p className="text-sm text-muted-foreground">{order.borrowerName}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Assigned Appraiser</h3>
                                <p className="text-sm text-muted-foreground">{appraiser?.name || "Unassigned"}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold">Fees</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(order.totalAmount)}
                                </p>
                            </div>
                        </div>
                        <div className="min-h-[300px]">
                            <OrderMap address={fullAddress} />
                        </div>
                    </div>
                </div>
              </TabsContent>
              <TabsContent value="documents">
                <div className="pt-6 text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Documents Uploaded</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Drag and drop files here to upload.
                    </p>
                    <Button>Upload Document</Button>
                </div>
              </TabsContent>
               <TabsContent value="communication">
                <div className="pt-6 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Communication Yet</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Notes and messages will appear here.
                    </p>
                    <Button>Add Note</Button>
                </div>
              </TabsContent>
              <TabsContent value="history">
                 <OrderTimeline />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <Button>Change Status</Button>
                <Button variant="secondary">Assign Appraiser</Button>
                <Button variant="secondary">Schedule Inspection</Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Printer className="mr-2 h-4 w-4" /> Print Order
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Print Order Details</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
