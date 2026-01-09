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
import { EditWorkflowDialog } from "@/components/orders/edit-workflow-dialog";
import { StartProductionDialog } from "@/components/orders/start-production-dialog";
import { CreateCaseButton } from "@/components/orders/create-case-button";
import { useOrderProductionCard } from "@/hooks/use-production";
import { PRODUCTION_STAGE_LABELS } from "@/types/production";
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
  Play,
  Kanban,
} from "lucide-react";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Progress } from "@/components/ui/progress";
import { orderStatuses } from "@/lib/types";
import { PropertyMap } from "@/components/properties/property-map";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PropertyChip } from "@/components/orders/property-chip";
import { useRouter } from "next/navigation";
import { OrderInvoicesSection } from "@/components/orders/order-invoices-section";
import { OrderDocumentsSection } from "@/components/orders/order-documents-section";
import { OrderNotesSection } from "@/components/orders/order-notes-section";
import { OrderContactsSection } from "@/components/orders/order-contacts-section";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [orderId, setOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const { data: order, isLoading, error } = useOrder(orderId || "");
  const { clients } = useClients();
  const { appraisers } = useAppraisers();
  const { data: productionCard, isLoading: productionCardLoading } = useOrderProductionCard(orderId || "");

  // Dialog states
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [assignAppraiserOpen, setAssignAppraiserOpen] = useState(false);
  const [scheduleInspectionOpen, setScheduleInspectionOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [editWorkflowOpen, setEditWorkflowOpen] = useState(false);
  const [startProductionOpen, setStartProductionOpen] = useState(false);

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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="invoice">Invoice</TabsTrigger>
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
                                {order.property ? (
                                    <PropertyChip order={order} variant="card" />
                                ) : order.propertyAddress ? (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{order.propertyAddress}</p>
                                        <p className="text-sm text-muted-foreground">{order.propertyCity}, {order.propertyState} {order.propertyZip}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No property linked</p>
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
                            <div>
                                <PropertyMap
                                    latitude={order.property?.latitude || 0}
                                    longitude={order.property?.longitude || 0}
                                    address={fullAddress}
                                />
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
              <TabsContent value="invoice">
                <div className="pt-6">
                  <OrderInvoicesSection orderId={order.id} clientId={order.clientId} />
                </div>
              </TabsContent>
              <TabsContent value="documents">
                <div className="pt-6 space-y-4">
                  <OrderDocumentsSection orderId={order.id} onUpload={() => setUploadDocumentOpen(true)} />
                </div>
              </TabsContent>
               <TabsContent value="communication">
                <div className="pt-6">
                  <OrderNotesSection
                    orderId={order.id}
                    onAddNote={() => setAddNoteOpen(true)}
                    variant="inline"
                  />
                </div>
              </TabsContent>
              <TabsContent value="history">
                 <OrderTimeline orderId={orderId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Appraisal Workflow Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Appraisal Workflow Details</CardTitle>
                <CardDescription>Scope, forms, and assignment configuration</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditWorkflowOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Core Appraisal Fields */}
              <div className="space-y-4">
                {order.scopeOfWork && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Scope of Work</h4>
                    <p className="text-sm font-semibold capitalize mt-1">
                      {order.scopeOfWork.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {order.intendedUse && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Intended Use</h4>
                    <p className="text-sm font-semibold mt-1">{order.intendedUse}</p>
                  </div>
                )}
                {order.reportFormType && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Report Form Type</h4>
                    <p className="text-sm font-semibold mt-1">{order.reportFormType}</p>
                  </div>
                )}
                {order.additionalForms && order.additionalForms.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Additional Forms</h4>
                    <p className="text-sm font-semibold mt-1">{order.additionalForms.join(', ')}</p>
                  </div>
                )}
                {order.billingMethod && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Billing Method</h4>
                    <p className="text-sm font-semibold capitalize mt-1">{order.billingMethod}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Region & Property Details */}
              <div className="space-y-4">
                {order.serviceRegion && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Service Region</h4>
                    <p className="text-sm font-semibold mt-1">{order.serviceRegion}</p>
                  </div>
                )}
                {order.salesCampaign && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Sales Campaign</h4>
                    <p className="text-sm font-semibold capitalize mt-1">
                      {order.salesCampaign.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {order.siteInfluence && order.siteInfluence !== 'none' && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Site Influence</h4>
                    <p className="text-sm font-semibold capitalize mt-1">
                      {order.siteInfluence.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {order.zoningType && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Zoning Type</h4>
                    <p className="text-sm font-semibold capitalize mt-1">
                      {order.zoningType.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {order.isMultiunit && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Property Type</h4>
                    <p className="text-sm font-semibold mt-1">
                      Multiunit {order.multiunitType && `(${order.multiunitType.replace(/_/g, ' ')})`}
                    </p>
                  </div>
                )}
                {order.isNewConstruction && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Construction</h4>
                    <p className="text-sm font-semibold mt-1">
                      New Construction {order.newConstructionType && `(${order.newConstructionType.replace(/_/g, ' ')})`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Contacts */}
        <OrderContactsSection orderId={order.id} />
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
                {!productionCardLoading && !productionCard && (
                  <Button
                    onClick={() => setStartProductionOpen(true)}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 h-4 w-4" /> Start Production
                  </Button>
                )}
                {!productionCardLoading && productionCard && (
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/production')}
                  >
                    <Kanban className="mr-2 h-4 w-4" />
                    View in Production
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {PRODUCTION_STAGE_LABELS[productionCard.current_stage as keyof typeof PRODUCTION_STAGE_LABELS] || productionCard.current_stage}
                    </span>
                  </Button>
                )}
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
                <CreateCaseButton order={order} variant="outline" />
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
        <EditWorkflowDialog
          order={order}
          open={editWorkflowOpen}
          onOpenChange={setEditWorkflowOpen}
        />
        <StartProductionDialog
          order={order}
          open={startProductionOpen}
          onOpenChange={setStartProductionOpen}
        />
      </>
    )}
    </>
  );
}
