"use client";

import React from "react";
import { useOrder } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAppraisers } from "@/hooks/use-appraisers";
import { OrderEditForm } from "@/components/orders/order-edit-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [orderId, setOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const { data: order, isLoading, error } = useOrder(orderId || "");
  const { clients, isLoading: clientsLoading } = useClients();
  const { appraisers, isLoading: appraisersLoading } = useAppraisers();

  if (!orderId || isLoading || clientsLoading || appraisersLoading) {
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
        <p className="text-muted-foreground mt-2">The order you're trying to edit doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push('/orders')}>
          Go to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/orders/${orderId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Order Details
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Order {order.orderNumber}</CardTitle>
          <CardDescription>
            Update the order details below. All changes will be saved to the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderEditForm 
            order={order} 
            appraisers={appraisers || []} 
            clients={clients || []} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

