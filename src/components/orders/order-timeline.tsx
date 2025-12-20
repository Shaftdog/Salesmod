"use client";

import { useEffect, useState } from "react";
import {
  CircleUser,
  File,
  History,
  Package,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  AlertCircle,
  MessageSquare,
  DollarSign,
  UserPlus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface OrderActivity {
  id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown>;
  performed_by: string | null;
  performed_by_name: string;
  is_system: boolean;
  created_at: string;
}

interface OrderTimelineProps {
  orderId: string;
}

// Map activity types to icons
const activityIcons: Record<string, React.ElementType> = {
  order_created: Package,
  status_changed: History,
  assigned: UserCheck,
  unassigned: UserX,
  document_uploaded: File,
  document_deleted: File,
  note_added: MessageSquare,
  note_updated: MessageSquare,
  due_date_changed: Calendar,
  priority_changed: AlertCircle,
  invoice_created: DollarSign,
  invoice_sent: DollarSign,
  payment_received: DollarSign,
  contact_added: UserPlus,
  contact_removed: UserX,
  revision_requested: RefreshCw,
  correction_requested: RefreshCw,
  custom: FileText,
};

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [activities, setActivities] = useState<OrderActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      if (!orderId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${orderId}/activities`);
        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data = await response.json();
        setActivities(data.data?.activities || []);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to load activity history");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">No activity history yet</p>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <ul className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.activity_type] || FileText;
          const metadata = activity.metadata || {};

          return (
            <li key={activity.id} className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  by {activity.performed_by_name || (activity.is_system ? "System" : "Unknown")} &bull;{" "}
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
                {/* Show status change details */}
                {activity.activity_type === "status_changed" && metadata.old_status && metadata.new_status && (
                  <p className="text-xs text-muted-foreground">
                    From: <span className="font-semibold capitalize">{String(metadata.old_status).replace(/_/g, " ")}</span>{" "}
                    &rarr; To: <span className="font-semibold capitalize">{String(metadata.new_status).replace(/_/g, " ")}</span>
                  </p>
                )}
                {/* Show assignment details */}
                {activity.activity_type === "assigned" && metadata.old_assigned_to_name && (
                  <p className="text-xs text-muted-foreground">
                    Previously: <span className="font-semibold">{String(metadata.old_assigned_to_name)}</span>
                  </p>
                )}
                {/* Show document details */}
                {(activity.activity_type === "document_uploaded" || activity.activity_type === "document_deleted") && metadata.document_type && (
                  <p className="text-xs text-muted-foreground">
                    Type: <span className="font-semibold capitalize">{String(metadata.document_type).replace(/_/g, " ")}</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
