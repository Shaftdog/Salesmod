'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ResourceTaskWithRelations, TaskStatus } from '@/types/production';
import { TASK_STATUS_LABELS } from '@/types/production';
import {
  Calendar,
  AlertTriangle,
  User,
  FileText,
  MapPin,
  Clock,
  ExternalLink,
  ListTodo,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'border-l-slate-400',
  in_progress: 'border-l-blue-400',
  completed: 'border-l-green-400',
  blocked: 'border-l-red-400',
};

interface ResourceTaskCardProps {
  task: ResourceTaskWithRelations;
  onDragStart: (task: ResourceTaskWithRelations) => void;
  onClick: () => void;
  isDragging: boolean;
}

export function ResourceTaskCard({
  task,
  onDragStart,
  onClick,
  isDragging,
}: ResourceTaskCardProps) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const isDueTomorrow = task.due_date && isTomorrow(new Date(task.due_date));

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return formatDistanceToNow(date, { addSuffix: true });
    return format(date, 'MMM d');
  };

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:shadow-md transition-all border-l-4',
        STATUS_COLORS[task.status],
        isDragging && 'opacity-50 scale-95',
        task.has_issue && 'ring-2 ring-rose-300'
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Task Title */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{task.title}</p>
          </div>
          {task.has_issue && (
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
          )}
        </div>

        {/* Order Number, Status & Production Card Link */}
        <div className="flex items-center gap-2 flex-wrap">
          {task.production_card?.order?.order_number && (
            <Link
              href={`/production/board?cardId=${task.production_card.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className="text-xs hover:bg-primary/10 cursor-pointer transition-colors group"
              >
                <FileText className="h-3 w-3 mr-1" />
                {task.production_card.order.order_number}
                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            </Link>
          )}
          <Badge variant="secondary" className="text-xs">
            {TASK_STATUS_LABELS[task.status]}
          </Badge>
        </div>

        {/* Property Address */}
        {task.production_card?.order?.property_address && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{task.production_card.order.property_address}</span>
          </div>
        )}

        {/* Issue Description */}
        {task.has_issue && task.issue_description && (
          <div className="p-2 bg-rose-50 rounded text-xs text-rose-700 line-clamp-2">
            <span className="font-medium">Issue: </span>
            {task.issue_description}
          </div>
        )}

        {/* Subtask Count Indicator */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ListTodo className="h-3 w-3" />
            <span>
              {task.subtasks.filter((s) => s.status === 'completed').length}/{task.subtasks.length} subtasks
            </span>
          </div>
        )}

        {/* Due Date & Assigned User */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          {task.due_date ? (
            <div
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-red-600 font-medium',
                isDueToday && !isOverdue && 'text-amber-600 font-medium',
                isDueTomorrow && 'text-blue-600'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>No due date</span>
            </div>
          )}

          {task.assigned_user && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">
                {task.assigned_user.name || task.assigned_user.email.split('@')[0]}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
