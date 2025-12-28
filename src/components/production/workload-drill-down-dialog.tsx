"use client";

import * as React from "react";
import { useEffect, useState } from "react";
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
import { Download, X, LayoutList, BarChart3, Loader2, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useWorkloadDrillDown } from "./workload-drill-down-context";
import { format } from "date-fns";

interface TaskDetail {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  estimated_minutes: number | null;
  order_number: string | null;
  property_address: string | null;
  stage_name: string | null;
  card_id: string | null;
}

interface DrillDownData {
  tasks: TaskDetail[];
  summary: {
    totalTasks: number;
    totalHours: number;
    byStatus: Record<string, number>;
    byStage: Record<string, number>;
  };
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "-";
  }
}

function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function WorkloadDrillDownDialog() {
  const { state, closeDrillDown } = useWorkloadDrillDown();
  const { isOpen, config } = state;

  const [data, setData] = useState<DrillDownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen && config) {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: config.userId,
        startDate: config.startDate,
        endDate: config.endDate,
      });

      fetch(`/api/production/workload/drill-down?${params}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch task details`);
          }
          return res.json();
        })
        .then((result) => {
          setData(result);
        })
        .catch((err) => {
          console.error("Workload drill-down fetch error:", err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, config]);

  // Export to CSV
  const handleExport = () => {
    if (!data || !config) return;

    if (data.tasks.length === 0) return;

    let csv = "Task Name,Status,Due Date,Est. Time,Order #,Property,Stage\n";
    csv += data.tasks
      .map(
        (t) =>
          `"${t.title}","${t.status}","${formatDate(t.due_date)}","${formatMinutes(t.estimated_minutes)}","${t.order_number || ""}","${t.property_address || ""}","${t.stage_name || ""}"`
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workload_${config.userName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDrillDown()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-zinc-900 border-zinc-800 text-white p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-white">
                {config.userName}&apos;s Tasks
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {config.period === "day"
                  ? format(new Date(config.startDate), "EEEE, MMMM d, yyyy")
                  : config.period === "week"
                  ? `Week of ${format(new Date(config.startDate), "MMM d")} - ${format(new Date(config.endDate), "MMM d, yyyy")}`
                  : format(new Date(config.startDate), "MMMM yyyy")}
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
            <div className="flex gap-4 mt-4 flex-wrap">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-sm py-1 px-3">
                {config.taskCount} Tasks
              </Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-sm py-1 px-3">
                <Clock className="h-3 w-3 mr-1" />
                {config.estimatedHours.toFixed(1)} Hours
              </Badge>
              <Badge
                variant="secondary"
                className={`text-sm py-1 px-3 ${
                  config.isOverloaded
                    ? "bg-red-900/50 text-red-300"
                    : config.capacityUsedPercent > 80
                    ? "bg-yellow-900/50 text-yellow-300"
                    : "bg-green-900/50 text-green-300"
                }`}
              >
                {config.isOverloaded && <AlertTriangle className="h-3 w-3 mr-1" />}
                {Math.round(config.capacityUsedPercent)}% Capacity
              </Badge>
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
                    Task List
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="data-[state=active]:bg-zinc-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <ScrollArea className="h-[400px] mt-4">
                  <TasksTable tasks={data?.tasks || []} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="summary" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <div className="mt-4 space-y-4">
                  <SummaryStats data={data} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tasks table component
function TasksTable({ tasks }: { tasks: TaskDetail[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No tasks found for this period
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Task</TableHead>
          <TableHead className="text-zinc-400">Order #</TableHead>
          <TableHead className="text-zinc-400">Property</TableHead>
          <TableHead className="text-zinc-400">Stage</TableHead>
          <TableHead className="text-zinc-400">Status</TableHead>
          <TableHead className="text-zinc-400">Due Date</TableHead>
          <TableHead className="text-zinc-400 text-right">Est. Time</TableHead>
          <TableHead className="text-zinc-400 w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} className="border-zinc-800 hover:bg-zinc-800/50">
            <TableCell className="font-medium text-white max-w-[200px] truncate">
              {task.title}
            </TableCell>
            <TableCell className="text-zinc-300">
              {task.order_number || "-"}
            </TableCell>
            <TableCell className="text-zinc-300 max-w-[150px] truncate">
              {task.property_address || "-"}
            </TableCell>
            <TableCell className="text-zinc-300">
              {task.stage_name || "-"}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={getStatusColor(task.status)}
              >
                {task.status}
              </Badge>
            </TableCell>
            <TableCell className="text-zinc-300">
              {formatDate(task.due_date)}
            </TableCell>
            <TableCell className="text-right text-zinc-300">
              {formatMinutes(task.estimated_minutes)}
            </TableCell>
            <TableCell>
              {task.card_id && (
                <Link href={`/production?card=${task.card_id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Summary stats component
function SummaryStats({ data }: { data: DrillDownData | null }) {
  if (!data) return null;

  const { summary } = data;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-zinc-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">By Status</h4>
        <div className="space-y-2">
          {Object.entries(summary.byStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <Badge variant="outline" className={getStatusColor(status)}>
                {status}
              </Badge>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
          {Object.keys(summary.byStatus).length === 0 && (
            <div className="text-zinc-500 text-sm">No tasks</div>
          )}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">By Stage</h4>
        <div className="space-y-2">
          {Object.entries(summary.byStage).map(([stage, count]) => (
            <div key={stage} className="flex justify-between items-center">
              <span className="text-zinc-300">{stage}</span>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
          {Object.keys(summary.byStage).length === 0 && (
            <div className="text-zinc-500 text-sm">No tasks</div>
          )}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4 col-span-2">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Totals</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-white">{summary.totalTasks}</div>
            <div className="text-sm text-zinc-400">Total Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{summary.totalHours}h</div>
            <div className="text-sm text-zinc-400">Estimated Hours</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for status colors
function getStatusColor(status: string): string {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === "completed" || lowerStatus === "done") {
    return "border-green-500/50 text-green-400";
  }
  if (lowerStatus === "in_progress" || lowerStatus === "in progress") {
    return "border-blue-500/50 text-blue-400";
  }
  if (lowerStatus === "pending") {
    return "border-yellow-500/50 text-yellow-400";
  }
  if (lowerStatus === "blocked" || lowerStatus === "cancelled") {
    return "border-red-500/50 text-red-400";
  }
  return "border-zinc-500/50 text-zinc-400";
}
