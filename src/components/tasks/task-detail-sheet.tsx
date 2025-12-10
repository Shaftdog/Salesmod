'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task } from '@/lib/types';
import {
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Bot,
} from 'lucide-react';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskReviewChat } from './task-review-chat';

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onEdit,
  onComplete,
  onDelete,
}: TaskDetailSheetProps) {
  const [showReviewChat, setShowReviewChat] = useState(false);

  if (!task) {
    return null;
  }

  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isCompleted = task.status === 'completed';

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.(task);
  };

  const handleComplete = () => {
    onComplete?.(task);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      onOpenChange(false);
      onDelete?.(task);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn(isCompleted && 'line-through text-muted-foreground')}>
                  {task.title}
                </span>
              </SheetTitle>
              <SheetDescription className="mt-1">
                Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
              </SheetDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-14rem)] mt-6">
          <div className="space-y-6">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={priorityColors[task.priority]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </Badge>
              <Badge variant="outline" className={statusColors[task.status]}>
                {statusLabels[task.status]}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
              {isDueToday && !isOverdue && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  Due Today
                </Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            {task.description && (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Task Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Details</h3>

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center gap-3">
                  <Calendar
                    className={cn(
                      'h-4 w-4',
                      isOverdue && 'text-red-600',
                      isDueToday && !isOverdue && 'text-orange-600'
                    )}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isOverdue && 'text-red-600',
                        isDueToday && !isOverdue && 'text-orange-600'
                      )}
                    >
                      {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                      {isOverdue && ' (Overdue)'}
                      {isDueToday && !isOverdue && ' (Today)'}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned To */}
              {task.assignee && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">{task.assignee.name}</p>
                  </div>
                </div>
              )}

              {/* Client */}
              {task.client && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="text-sm font-medium">{task.client.companyName}</p>
                  </div>
                </div>
              )}

              {/* Completed At */}
              {task.completedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.completedAt), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Review with AI Agent */}
            {!isCompleted && (
              <>
                <Separator />
                <div>
                  <Button
                    variant={showReviewChat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowReviewChat(!showReviewChat)}
                    className="w-full"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    {showReviewChat ? 'Hide' : 'Review with'} AI Agent
                  </Button>
                </div>

                {showReviewChat && (
                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Review with AI Agent</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get help completing this task, discuss approach, or get suggestions
                    </p>
                    <TaskReviewChat task={task} />
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {!isCompleted && (
            <>
              <Button variant="outline" className="flex-1" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button className="flex-1" onClick={handleComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </>
          )}
          {isCompleted && (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">
              Task completed{' '}
              {task.completedAt &&
                formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
