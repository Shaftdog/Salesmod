"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useResourceWorkHistory } from "@/hooks/use-corrections";
import type { ResourceWorkHistoryWithRelations, WorkHistoryEventType } from "@/types/corrections";
import { formatDistanceToNow, format } from "date-fns";

interface ResourceWorkHistoryProps {
  userId: string;
  userName?: string;
}

const EVENT_CONFIG: Record<
  WorkHistoryEventType,
  { label: string; icon: typeof AlertCircle; color: string }
> = {
  correction_received: {
    label: "Received Correction",
    icon: AlertCircle,
    color: "text-amber-500",
  },
  correction_completed: {
    label: "Completed Correction",
    icon: CheckCircle2,
    color: "text-blue-500",
  },
  correction_approved: {
    label: "Correction Approved",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  correction_rejected: {
    label: "Correction Rejected",
    icon: XCircle,
    color: "text-red-500",
  },
  revision_received: {
    label: "Received Revision",
    icon: FileText,
    color: "text-indigo-500",
  },
  revision_completed: {
    label: "Completed Revision",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

export function ResourceWorkHistory({ userId, userName }: ResourceWorkHistoryProps) {
  const [open, setOpen] = useState(false);
  const { data: history, isLoading } = useResourceWorkHistory({ user_id: userId });

  const correctionCount = history?.filter(
    (h) => h.event_type.startsWith("correction_")
  ).length || 0;
  const revisionCount = history?.filter(
    (h) => h.event_type.startsWith("revision_")
  ).length || 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Work History
          {(correctionCount + revisionCount) > 0 && (
            <Badge variant="secondary" className="ml-1">
              {correctionCount + revisionCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:max-w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Work History
          </SheetTitle>
          <SheetDescription>
            Correction and revision history for {userName || "this resource"}
          </SheetDescription>
        </SheetHeader>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/30">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {correctionCount}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Corrections</p>
          </div>
          <div className="rounded-lg border bg-indigo-50 p-3 dark:bg-indigo-950/30">
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {revisionCount}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Revisions</p>
          </div>
        </div>

        {/* History List */}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">
            Recent Activity
          </h4>
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-3 pr-4">
                {history.map((item) => (
                  <WorkHistoryItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No work history yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Corrections and revisions will appear here
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WorkHistoryItem({ item }: { item: ResourceWorkHistoryWithRelations }) {
  const config = EVENT_CONFIG[item.event_type as WorkHistoryEventType] || {
    label: item.event_type,
    icon: Clock,
    color: "text-gray-500",
  };
  const Icon = config.icon;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{config.label}</p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.summary}
          </p>
          {item.production_card?.order && (
            <p className="text-xs text-muted-foreground mt-1">
              Order: {item.production_card.order.order_number}
            </p>
          )}
          {item.impact_score && (
            <Badge variant="outline" className="mt-1 text-xs">
              Impact: {item.impact_score}/10
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for inline display
export function ResourceWorkHistoryBadge({ userId }: { userId: string }) {
  const { data: history } = useResourceWorkHistory({ user_id: userId });

  const correctionCount = history?.filter(
    (h) => h.event_type.startsWith("correction_")
  ).length || 0;

  if (correctionCount === 0) return null;

  return (
    <Badge variant="outline" className="text-amber-600 bg-amber-50">
      <AlertCircle className="h-3 w-3 mr-1" />
      {correctionCount} correction{correctionCount !== 1 ? "s" : ""}
    </Badge>
  );
}
