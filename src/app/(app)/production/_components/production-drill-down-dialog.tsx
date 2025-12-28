"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, X, LayoutList, BarChart3, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useProductionDrillDown, type ProductionDrillDownType } from "./production-drill-down-context";
import { format } from "date-fns";

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  client_name: string;
  property_address: string;
  due_date: string | null;
  delivered_date: string | null;
  fee_amount: number | null;
  current_stage: string | null;
  created_at: string;
}

interface CaseDetail {
  id: string;
  case_number: string;
  status: string;
  client_name: string;
  order_number: string | null;
  created_at: string;
}

interface DrillDownData {
  orders: OrderDetail[];
  cases: CaseDetail[];
  totalValue?: number;
}

// Helper to format currency
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

// Helper to format date
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "-";
  }
}

// Determine if this metric shows orders or cases
function showsCases(type: ProductionDrillDownType): boolean {
  return type.startsWith("cases");
}

export function ProductionDrillDownDialog() {
  const { state, closeDrillDown } = useProductionDrillDown();
  const { isOpen, config } = state;

  const [data, setData] = useState<DrillDownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen && config) {
      setIsLoading(true);
      setError(null);

      fetch(`/api/production/dashboard-metrics/drill-down?type=${config.type}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch drill-down data");
          return res.json();
        })
        .then((result) => {
          setData(result);
        })
        .catch((err) => {
          console.error("Drill-down fetch error:", err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, config]);

  // Calculate totals
  const totalValue = useMemo(() => {
    if (!data?.orders) return 0;
    return data.orders.reduce((sum, o) => sum + (o.fee_amount || 0), 0);
  }, [data]);

  const itemCount = useMemo(() => {
    if (!data) return 0;
    return showsCases(config?.type || "allDue") ? data.cases.length : data.orders.length;
  }, [data, config]);

  // Export to CSV
  const handleExport = () => {
    if (!data || !config) return;

    const items = showsCases(config.type) ? data.cases : data.orders;
    if (items.length === 0) return;

    let csv: string;
    if (showsCases(config.type)) {
      csv = "Case Number,Status,Client,Order Number,Created\n";
      csv += (data.cases as CaseDetail[])
        .map(
          (c) =>
            `"${c.case_number}","${c.status}","${c.client_name}","${c.order_number || ""}","${formatDate(c.created_at)}"`
        )
        .join("\n");
    } else {
      csv = "Order Number,Status,Client,Property,Due Date,Fee,Stage\n";
      csv += (data.orders as OrderDetail[])
        .map(
          (o) =>
            `"${o.order_number}","${o.status}","${o.client_name}","${o.property_address}","${formatDate(o.due_date)}","${o.fee_amount || 0}","${o.current_stage || ""}"`
        )
        .join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.type}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!config) return null;

  const isCaseView = showsCases(config.type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDrillDown()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-zinc-900 border-zinc-800 text-white p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-white">
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {config.description}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading || !data}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrillDown}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          {!isLoading && data && (
            <div className="flex gap-4 mt-4">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-sm py-1 px-3">
                {itemCount} {isCaseView ? "Cases" : "Orders"}
              </Badge>
              {!isCaseView && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-sm py-1 px-3">
                  Total Value: {formatCurrency(totalValue)}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-400">
              {error}
            </div>
          ) : (
            <Tabs defaultValue="list" className="h-full flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="bg-zinc-800">
                  <TabsTrigger value="list" className="data-[state=active]:bg-zinc-700">
                    <LayoutList className="h-4 w-4 mr-2" />
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="data-[state=active]:bg-zinc-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <ScrollArea className="h-[400px] mt-4">
                  {isCaseView ? (
                    <CasesTable cases={data?.cases || []} />
                  ) : (
                    <OrdersTable orders={data?.orders || []} />
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="summary" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <div className="mt-4 space-y-4">
                  <SummaryStats
                    data={data}
                    type={config.type}
                    isCaseView={isCaseView}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Orders table component
function OrdersTable({ orders }: { orders: OrderDetail[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No orders found for this metric
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Order #</TableHead>
          <TableHead className="text-zinc-400">Client</TableHead>
          <TableHead className="text-zinc-400">Property</TableHead>
          <TableHead className="text-zinc-400">Status</TableHead>
          <TableHead className="text-zinc-400">Due Date</TableHead>
          <TableHead className="text-zinc-400 text-right">Fee</TableHead>
          <TableHead className="text-zinc-400 w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/50">
            <TableCell className="font-medium text-white">
              {order.order_number}
            </TableCell>
            <TableCell className="text-zinc-300">{order.client_name}</TableCell>
            <TableCell className="text-zinc-300 max-w-[200px] truncate">
              {order.property_address}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={getStatusColor(order.status)}
              >
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-zinc-300">
              {formatDate(order.due_date)}
            </TableCell>
            <TableCell className="text-right text-zinc-300">
              {formatCurrency(order.fee_amount)}
            </TableCell>
            <TableCell>
              <Link href={`/orders/${order.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Cases table component
function CasesTable({ cases }: { cases: CaseDetail[] }) {
  if (cases.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No cases found for this metric
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Case #</TableHead>
          <TableHead className="text-zinc-400">Client</TableHead>
          <TableHead className="text-zinc-400">Order #</TableHead>
          <TableHead className="text-zinc-400">Status</TableHead>
          <TableHead className="text-zinc-400">Created</TableHead>
          <TableHead className="text-zinc-400 w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((c) => (
          <TableRow key={c.id} className="border-zinc-800 hover:bg-zinc-800/50">
            <TableCell className="font-medium text-white">
              {c.case_number}
            </TableCell>
            <TableCell className="text-zinc-300">{c.client_name}</TableCell>
            <TableCell className="text-zinc-300">{c.order_number || "-"}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={getStatusColor(c.status)}
              >
                {c.status}
              </Badge>
            </TableCell>
            <TableCell className="text-zinc-300">
              {formatDate(c.created_at)}
            </TableCell>
            <TableCell>
              <Link href={`/cases/${c.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Summary stats component
function SummaryStats({
  data,
  type,
  isCaseView,
}: {
  data: DrillDownData | null;
  type: ProductionDrillDownType;
  isCaseView: boolean;
}) {
  if (!data) return null;

  const items = isCaseView ? data.cases : data.orders;

  // Group by status
  const statusGroups = items.reduce((acc, item) => {
    const status = item.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // For orders, calculate value by status
  const valueByStatus = !isCaseView
    ? (data.orders as OrderDetail[]).reduce((acc, o) => {
        const status = o.status || "Unknown";
        acc[status] = (acc[status] || 0) + (o.fee_amount || 0);
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-zinc-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">By Status</h4>
        <div className="space-y-2">
          {Object.entries(statusGroups).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <Badge variant="outline" className={getStatusColor(status)}>
                {status}
              </Badge>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {!isCaseView && Object.keys(valueByStatus).length > 0 && (
        <div className="bg-zinc-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Value by Status</h4>
          <div className="space-y-2">
            {Object.entries(valueByStatus).map(([status, value]) => (
              <div key={status} className="flex justify-between items-center">
                <Badge variant="outline" className={getStatusColor(status)}>
                  {status}
                </Badge>
                <span className="text-white font-medium">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for status colors
function getStatusColor(status: string): string {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("deliver") || lowerStatus.includes("complete")) {
    return "border-green-500/50 text-green-400";
  }
  if (lowerStatus.includes("overdue") || lowerStatus.includes("issue") || lowerStatus.includes("impeded")) {
    return "border-red-500/50 text-red-400";
  }
  if (lowerStatus.includes("review") || lowerStatus.includes("pending")) {
    return "border-yellow-500/50 text-yellow-400";
  }
  if (lowerStatus.includes("progress") || lowerStatus.includes("active")) {
    return "border-blue-500/50 text-blue-400";
  }
  return "border-zinc-500/50 text-zinc-400";
}
