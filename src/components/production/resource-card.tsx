"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { User, Pencil, Trash2, Clock, CheckCircle } from "lucide-react";
import { PRODUCTION_ROLE_LABELS, type ProductionRole } from "@/types/production";
import type { ProductionResourceWithUser } from "@/types/production";

interface ResourceCardProps {
  resource: ProductionResourceWithUser;
  onEdit: (resource: ProductionResourceWithUser) => void;
  onDelete: (resource: ProductionResourceWithUser) => void;
  onToggleAvailability: (resource: ProductionResourceWithUser, available: boolean) => void;
}

const ROLE_COLORS: Record<ProductionRole, string> = {
  appraiser: "bg-blue-100 text-blue-800 border-blue-200",
  reviewer: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-orange-100 text-orange-800 border-orange-200",
  trainee: "bg-green-100 text-green-800 border-green-200",
  researcher_level_1: "bg-cyan-100 text-cyan-800 border-cyan-200",
  researcher_level_2: "bg-teal-100 text-teal-800 border-teal-200",
  researcher_level_3: "bg-emerald-100 text-emerald-800 border-emerald-200",
  inspector: "bg-amber-100 text-amber-800 border-amber-200",
};

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ResourceCardProps) {
  const completionRate = Math.round(resource.on_time_completion_rate * 100);
  const avgTime = resource.avg_task_completion_minutes;

  return (
    <Card className={`transition-opacity ${!resource.is_available ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">{resource.user.name || "Unknown"}</h3>
              <p className="text-sm text-muted-foreground">{resource.user.email}</p>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {resource.is_available ? "Available" : "Unavailable"}
            </span>
            <Switch
              checked={resource.is_available}
              onCheckedChange={(checked) => onToggleAvailability(resource, checked)}
            />
          </div>
        </div>

        {/* Roles */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Roles</p>
          <div className="flex flex-wrap gap-1.5">
            {resource.roles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className={ROLE_COLORS[role as ProductionRole] || ""}
              >
                {PRODUCTION_ROLE_LABELS[role as ProductionRole] || role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Capacity */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Daily Capacity</p>
            <p className="font-medium">{resource.max_daily_tasks} tasks/day</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weekly Hours</p>
            <p className="font-medium">{resource.max_weekly_hours} hrs/week</p>
          </div>
        </div>

        {/* Performance Metrics */}
        {resource.tasks_completed_count > 0 && (
          <div className="mt-4 flex items-center gap-4 border-t pt-4">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{completionRate}% on-time</span>
            </div>
            {avgTime && (
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Avg {avgTime} min/task</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {resource.tasks_completed_count} completed
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => onEdit(resource)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(resource)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
