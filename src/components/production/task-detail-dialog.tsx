'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Play,
  Pause,
  AlertCircle,
  FileText,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCompleteProductionTask,
  useStartTimer,
  useStopTimer,
  useUpdateProductionTask,
} from '@/hooks/use-production';
import {
  ProductionTask,
  PRODUCTION_ROLE_LABELS,
  PRODUCTION_STAGE_LABELS,
  TASK_STATUS_LABELS,
  formatDuration,
  isTaskOverdue,
} from '@/types/production';
import { format, formatDistanceToNow } from 'date-fns';
import { TaskAssigneePopover } from './task-assignee-popover';

interface TaskDetailDialogProps {
  task: ProductionTask & {
    subtasks?: ProductionTask[];
    assigned_user?: { id: string; name: string | null; email: string } | null;
    time_entries?: Array<{
      id: string;
      started_at: string;
      ended_at: string | null;
      duration_minutes: number | null;
    }>;
    active_timer?: { id: string; started_at: string } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const [notes, setNotes] = useState(task.notes || '');
  const completeTask = useCompleteProductionTask();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const updateTask = useUpdateProductionTask();

  // Sync notes state with task prop when task changes or dialog opens
  useEffect(() => {
    if (open) {
      setNotes(task.notes || '');
    }
  }, [open, task.id, task.notes]);

  const isCompleted = task.status === 'completed';
  const hasActiveTimer = !!task.active_timer;
  const overdue = isTaskOverdue(task);

  const handleComplete = async () => {
    try {
      await completeTask.mutateAsync(task.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStartTimer = async () => {
    try {
      await startTimer.mutateAsync(task.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStopTimer = async () => {
    if (!task.active_timer) return;
    try {
      await stopTimer.mutateAsync({ entryId: task.active_timer.id });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSaveNotes = async () => {
    if (notes === (task.notes || '')) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        notes: notes.trim() || null,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Calculate total time from time entries
  const totalTimeMinutes = task.time_entries?.reduce(
    (sum, entry) => sum + (entry.duration_minutes || 0),
    0
  ) || task.total_time_minutes || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : overdue ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <ListTodo className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn(isCompleted && 'line-through text-muted-foreground')}>
                  {task.title}
                </span>
              </DialogTitle>
              {task.description && (
                <DialogDescription className="mt-2">
                  {task.description}
                </DialogDescription>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className={cn('text-xs', STATUS_COLORS[task.status])}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {PRODUCTION_STAGE_LABELS[task.stage]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {PRODUCTION_ROLE_LABELS[task.role as keyof typeof PRODUCTION_ROLE_LABELS]}
            </Badge>
            {task.is_required && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
            {overdue && !isCompleted && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Assignee */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Assigned To</Label>
                <TaskAssigneePopover
                  taskId={task.id}
                  currentAssignee={task.assigned_user || null}
                  disabled={isCompleted}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <div className={cn(
                  'flex items-center gap-1',
                  overdue && !isCompleted && 'text-red-600'
                )}>
                  <Calendar className="h-4 w-4" />
                  {task.due_date ? (
                    <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </div>
              </div>

              {/* Time Spent */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Time Spent</Label>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(totalTimeMinutes)}</span>
                  {task.estimated_minutes && (
                    <span className="text-muted-foreground">
                      / {formatDuration(task.estimated_minutes)} estimated
                    </span>
                  )}
                </div>
              </div>

              {/* Completed At */}
              {task.completed_at && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Completed</Label>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{format(new Date(task.completed_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Timer Controls */}
            {!isCompleted && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Time Tracking</Label>
                <div className="flex items-center gap-2">
                  {hasActiveTimer ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStopTimer}
                        disabled={stopTimer.isPending}
                        className="flex-1"
                      >
                        {stopTimer.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4 mr-2" />
                        )}
                        Stop Timer
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Started {formatDistanceToNow(new Date(task.active_timer!.started_at), { addSuffix: true })}
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartTimer}
                      disabled={startTimer.isPending}
                    >
                      {startTimer.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Timer
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Time Entries History */}
            {task.time_entries && task.time_entries.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Time Entries ({task.time_entries.length})
                </Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {task.time_entries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                    >
                      <span>
                        {format(new Date(entry.started_at), 'MMM d, h:mm a')}
                      </span>
                      <span className="font-medium">
                        {entry.duration_minutes
                          ? formatDuration(entry.duration_minutes)
                          : 'In progress'}
                      </span>
                    </div>
                  ))}
                  {task.time_entries.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{task.time_entries.length - 5} more entries
                    </p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="task-notes" className="text-xs text-muted-foreground">
                Notes
              </Label>
              <Textarea
                id="task-notes"
                placeholder="Add notes about this task..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isCompleted}
              />
              {notes !== (task.notes || '') && !isCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveNotes}
                  disabled={updateTask.isPending}
                >
                  {updateTask.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              )}
            </div>

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Subtasks ({task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length})
                  </Label>
                  <div className="space-y-1">
                    {task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className={cn(
                          'flex items-center gap-2 text-sm p-2 rounded border',
                          subtask.status === 'completed' && 'bg-green-50 border-green-200'
                        )}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                          subtask.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        )}>
                          {subtask.status === 'completed' && (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className={cn(
                          'flex-1',
                          subtask.status === 'completed' && 'line-through text-muted-foreground'
                        )}>
                          {subtask.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {PRODUCTION_ROLE_LABELS[subtask.role as keyof typeof PRODUCTION_ROLE_LABELS]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isCompleted && (
            <Button
              onClick={handleComplete}
              disabled={completeTask.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeTask.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Mark Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailDialog;
