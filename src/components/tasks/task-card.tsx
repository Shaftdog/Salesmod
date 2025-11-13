import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/lib/types";
import { Calendar, User, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

type TaskCardProps = {
  task: Task;
  onComplete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  showClient?: boolean;
};

export function TaskCard({ task, onComplete, onEdit, onDelete, showClient = true }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card className={cn(
      "group hover:shadow-md transition-shadow cursor-pointer relative",
      task.status === 'completed' && "opacity-60"
    )} onClick={() => onEdit?.(task)}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {onComplete && task.status !== 'completed' && (
            <Checkbox
              checked={false}
              onCheckedChange={() => onComplete(task)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}
          {task.status === 'completed' && (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          )}

          <div className="flex-1 space-y-2">
            <div>
              <h4 className={cn(
                "font-semibold",
                task.status === 'completed' && "line-through"
              )}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={statusColors[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
              
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue && "text-red-600 font-semibold",
                  isDueToday && !isOverdue && "text-orange-600 font-semibold"
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), "MMM d")}
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                </div>
              )}

              {showClient && task.client && (
                <span className="text-xs text-muted-foreground">
                  {task.client.companyName}
                </span>
              )}

              {task.assignee && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.assignee.name}
                </div>
              )}
            </div>
          </div>

          {/* Delete button - appears on hover */}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

