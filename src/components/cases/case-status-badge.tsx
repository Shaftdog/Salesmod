import { Badge } from "@/components/ui/badge";
import type { CaseStatus, CasePriority } from "@/lib/types";
import { CASE_STATUS_LABELS } from "@/lib/types";
import {
  Circle,
  Wrench,
  Factory,
  AlertTriangle,
  Ban,
  Users,
  Eye,
  Truck,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

type CaseStatusBadgeProps = {
  status: CaseStatus;
  className?: string;
};

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const statusConfig: Record<CaseStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    new: {
      label: CASE_STATUS_LABELS.new,
      className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
      icon: Circle,
    },
    working: {
      label: CASE_STATUS_LABELS.working,
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      icon: Wrench,
    },
    in_production: {
      label: CASE_STATUS_LABELS.in_production,
      className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
      icon: Factory,
    },
    correction: {
      label: CASE_STATUS_LABELS.correction,
      className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
      icon: AlertTriangle,
    },
    impeded: {
      label: CASE_STATUS_LABELS.impeded,
      className: "bg-red-100 text-red-700 hover:bg-red-100",
      icon: Ban,
    },
    workshop_meeting: {
      label: CASE_STATUS_LABELS.workshop_meeting,
      className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      icon: Users,
    },
    review: {
      label: CASE_STATUS_LABELS.review,
      className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
      icon: Eye,
    },
    deliver: {
      label: CASE_STATUS_LABELS.deliver,
      className: "bg-teal-100 text-teal-700 hover:bg-teal-100",
      icon: Truck,
    },
    completed: {
      label: CASE_STATUS_LABELS.completed,
      className: "bg-green-100 text-green-700 hover:bg-green-100",
      icon: CheckCircle,
    },
    process_improvement: {
      label: CASE_STATUS_LABELS.process_improvement,
      className: "bg-pink-100 text-pink-700 hover:bg-pink-100",
      icon: TrendingUp,
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
