import { Badge } from "@/components/ui/badge";
import type { CaseStatus, CasePriority } from "@/lib/types";
import { AlertCircle, CheckCircle, Circle, Clock, Pause, XCircle, RefreshCw } from "lucide-react";

type CaseStatusBadgeProps = {
  status: CaseStatus;
  className?: string;
};

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const statusConfig = {
    new: {
      label: "New",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      icon: Circle,
    },
    open: {
      label: "Open",
      className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
      icon: AlertCircle,
    },
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      icon: Pause,
    },
    in_progress: {
      label: "In Progress",
      className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
      icon: Clock,
    },
    resolved: {
      label: "Resolved",
      className: "bg-green-100 text-green-700 hover:bg-green-100",
      icon: CheckCircle,
    },
    closed: {
      label: "Closed",
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
      icon: XCircle,
    },
    reopened: {
      label: "Reopened",
      className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
      icon: RefreshCw,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`${config.className} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

type CasePriorityBadgeProps = {
  priority: CasePriority;
  className?: string;
};

export function CasePriorityBadge({ priority, className }: CasePriorityBadgeProps) {
  const priorityConfig = {
    low: {
      label: "Low",
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    },
    normal: {
      label: "Normal",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    high: {
      label: "High",
      className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    },
    urgent: {
      label: "Urgent",
      className: "bg-red-100 text-red-700 hover:bg-red-100",
    },
    critical: {
      label: "Critical",
      className: "bg-red-600 text-white hover:bg-red-600",
    },
  };

  const config = priorityConfig[priority];

  return (
    <Badge variant="secondary" className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
}



