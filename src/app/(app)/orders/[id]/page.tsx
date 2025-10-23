"use client";

import React, { useState } from "react";
import { useOrder } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAppraisers } from "@/hooks/use-appraisers";
import { ChangeStatusDialog } from "@/components/orders/change-status-dialog";
import { AssignAppraiserDialog } from "@/components/orders/assign-appraiser-dialog";
import { ScheduleInspectionDialog } from "@/components/orders/schedule-inspection-dialog";
import { AddNoteDialog } from "@/components/orders/add-note-dialog";
import { UploadDocumentDialog } from "@/components/orders/upload-document-dialog";
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
  Edit,
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
import { PropertyChip } from "@/components/orders/property-chip";
import { useRouter } from "next/navigation";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [orderId, setOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const { data: order, isLoading, error } = useOrder(orderId || "");
  const { clients } = useClients();
  const { appraisers } = useAppraisers();

  // Dialog states
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [assignAppraiserOpen, setAssignAppraiserOpen] = useState(false);
  const [scheduleInspectionOpen, setScheduleInspectionOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Edit handler
  const handleEdit = () => {
    router.push(`/orders/${orderId}/edit`);
  };

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
  const appraiser = appraisers?.find(a => a.id === order.assignedTo);

  const statusIndex = orderStatuses.findIndex(s => s === order.status);
  const progressValue = (statusIndex + 1) / orderStatuses.length * 100;
  const fullAddress = `${order.propertyAddress}, ${order.propertyCity}, ${order.propertyState} ${order.propertyZip}`;


  return (
    <>
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
                                {order.propertyId ? (
                                    <PropertyChip order={order} variant="card" />
                                ) : (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{order.propertyAddress}</p>
                                        <p className="text-sm text-muted-foreground">{order.propertyCity}, {order.propertyState} {order.propertyZip}</p>
                                    </div>
                                )}
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
                        <div className="space-y-4">
                            <div className="min-h-[300px]">
                                <OrderMap address={fullAddress} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold">Important Dates</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <p className="text-sm font-medium">Ordered</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(order.orderedDate), "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                    {order.assignedDate && (
                                        <div>
                                            <p className="text-sm font-medium">Assigned</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(order.assignedDate), "MMM dd, yyyy")}
                                            </p>
                                        </div>
                                    )}
                                    {order.completedDate && (
                                        <div>
                                            <p className="text-sm font-medium">Completed</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(order.completedDate), "MMM dd, yyyy")}
                                            </p>
                                        </div>
                                    )}
                                    {order.deliveredDate && (
                                        <div>
                                            <p className="text-sm font-medium">Delivered</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(order.deliveredDate), "MMM dd, yyyy")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                    <Button onClick={() => setUploadDocumentOpen(true)}>
                      Upload Document
                    </Button>
                </div>
              </TabsContent>
               <TabsContent value="communication">
                <div className="pt-6 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Communication Yet</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Notes and messages will appear here.
                    </p>
                    <Button onClick={() => setAddNoteOpen(true)}>Add Note</Button>
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
                <Button onClick={handleEdit} variant="default">
                  <Edit className="mr-2 h-4 w-4" /> Edit Order
                </Button>
                <Button onClick={() => setChangeStatusOpen(true)} variant="secondary">
                  Change Status
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAssignAppraiserOpen(true)}
                >
                  Assign Appraiser
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setScheduleInspectionOpen(true)}
                >
                  Schedule Inspection
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handlePrint}
                            >
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

    {/* Dialogs */}
    {order && (
      <>
        <ChangeStatusDialog
          order={order}
          open={changeStatusOpen}
          onOpenChange={setChangeStatusOpen}
        />
        <AssignAppraiserDialog
          order={order}
          open={assignAppraiserOpen}
          onOpenChange={setAssignAppraiserOpen}
        />
        <ScheduleInspectionDialog
          order={order}
          open={scheduleInspectionOpen}
          onOpenChange={setScheduleInspectionOpen}
        />
        <AddNoteDialog
          order={order}
          open={addNoteOpen}
          onOpenChange={setAddNoteOpen}
        />
        <UploadDocumentDialog
          order={order}
          open={uploadDocumentOpen}
          onOpenChange={setUploadDocumentOpen}
        />
      </>
    )}
    </>
  );
}
