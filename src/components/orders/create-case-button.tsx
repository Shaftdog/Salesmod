"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { CaseForm } from "@/components/cases/case-form";
import { useCreateCase } from "@/hooks/use-cases";
import { useClients } from "@/hooks/use-clients";
import { useOrders } from "@/hooks/use-orders";
import type { Order } from "@/lib/types";

interface CreateCaseButtonProps {
  order: Order;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export function CreateCaseButton({ order, variant = "secondary" }: CreateCaseButtonProps) {
  const [open, setOpen] = useState(false);
  const createCase = useCreateCase();
  const { clients } = useClients();
  const { orders } = useOrders();

  const handleSubmit = async (data: any) => {
    await createCase.mutateAsync({
      ...data,
      order_id: order.id,
      client_id: order.clientId || data.client_id,
    });
  };

  // Pre-populate the case with order info
  const defaultCase = {
    subject: `Issue with Order ${order.orderNumber}`,
    description: `Case related to order ${order.orderNumber} - ${order.propertyAddress}`,
    caseType: "support" as const,
    status: "new" as const,
    priority: "normal" as const,
    clientId: order.clientId || "",
    contactId: "",
    orderId: order.id,
    assignedTo: "",
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        className="w-full"
      >
        <FileQuestion className="mr-2 h-4 w-4" />
        Create Case
      </Button>

      <CaseForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        clients={clients || []}
        orders={orders || []}
        case={defaultCase}
        isLoading={createCase.isPending}
      />
    </>
  );
}
