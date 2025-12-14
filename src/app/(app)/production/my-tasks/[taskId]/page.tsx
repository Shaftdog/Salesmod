'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  ListTodo,
  Timer,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProductionTask,
  useCompleteProductionTask,
  useUpdateProductionTask,
  useStartTimer,
  useStopTimer,
} from '@/hooks/use-production';
import {
  ProductionTask,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_ROLE_LABELS,
  TASK_STATUS_LABELS,
  formatDuration,
  isTaskOverdue,
  isTaskDueToday,
} from '@/types/production';
import { format, formatDistanceToNow } from 'date-fns';
import { TaskAssigneePopover } from '@/components/production/task-assignee-popover';

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = use(params);
  const { data: task, isLoading, error, refetch } = useProductionTask(taskId);
  const completeTask = useCompleteProductionTask();
  const updateTask = useUpdateProductionTask();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleCompleteTask = async (id: string) => {
    try {
      await completeTask.mutateAsync(id);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStartTimer = async () => {
    try {
      await startTimer.mutateAsync(taskId);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStopTimer = async () => {
    if (task?.active_timer) {
      try {
        await stopTimer.mutateAsync({ entryId: task.active_timer.id });
        refetch();
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateTask.mutateAsync({ id: taskId, notes });
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/production/my-tasks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tasks
          </Link>
        </Button>
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>Failed to load task details</span>
        </div>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';
  const hasActiveTimer = !!task.active_timer;
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: ProductionTask) => s.status === 'completed').length;
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="outline" size="sm" asChild>
        <Link href="/production/my-tasks">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tasks
        </Link>
      </Button>

      {/* Task Header Card */}
      <Card className={cn(
        overdue && !isCompleted && 'border-red-300',
        dueToday && !isCompleted && !overdue && 'border-orange-300',
        isCompleted && 'opacity-75'
      )}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className={cn('text-2xl', isCompleted && 'line-through')}>
                {task.title}
              </CardTitle>
              {task.description && (
                <CardDescription className="text-base">{task.description}</CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={isCompleted ? 'default' : 'secondary'}
                className={cn(
                  isCompleted && 'bg-green-500',
                  !isCompleted && task.status === 'in_progress' && 'bg-blue-500 text-white'
                )}
              >
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
              <Badge variant="outline">
                {PRODUCTION_ROLE_LABELS[task.role as keyof typeof PRODUCTION_ROLE_LABELS]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stage */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Stage</p>
              <Badge variant="secondary">{PRODUCTION_STAGE_LABELS[task.stage]}</Badge>
            </div>

            {/* Assigned To */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Assigned To</p>
              <TaskAssigneePopover
                taskId={taskId}
                currentAssignee={task.assigned_user}
                disabled={isCompleted}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Due Date</p>
              {task.due_date ? (
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  overdue && !isCompleted && 'text-red-600 font-medium'
                )}>
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(task.due_date), 'MMM d, yyyy h:mm a')}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No due date</span>
              )}
            </div>

            {/* Time Spent */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Time Spent</p>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(task.total_time_minutes || 0)}</span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          {task.production_card?.order && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Order: {task.production_card.order.order_number}</span>
            </div>
          )}

          <Separator />

          {/* Timer & Action Buttons */}
          {!isCompleted && (
            <div className="flex flex-wrap items-center gap-3">
              {hasActiveTimer ? (
                <Button
                  variant="outline"
                  onClick={handleStopTimer}
                  disabled={stopTimer.isPending}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  {stopTimer.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Stop Timer
                </Button>
              ) : (
                <Button
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

              <Button
                onClick={() => handleCompleteTask(taskId)}
                disabled={completeTask.isPending}
              >
                {completeTask.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark Complete
              </Button>
            </div>
          )}

          {isCompleted && task.completed_at && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subtasks Section */}
      {subtasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                <CardTitle className="text-lg">Subtasks</CardTitle>
                <Badge variant="secondary">{completedSubtasks}/{subtasks.length}</Badge>
              </div>
            </div>
            <Progress value={subtaskProgress} className="h-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subtasks.map((subtask: ProductionTask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onComplete={() => handleCompleteTask(subtask.id)}
                  isCompleting={completeTask.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
            {showNotes ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </CardHeader>
        {showNotes && (
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Add notes about this task..."
              value={notes || task.notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={updateTask.isPending}
            >
              {updateTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Notes
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Time Entries Section */}
      {task.time_entries && task.time_entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Time Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.time_entries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {format(new Date(entry.started_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {entry.notes && (
                      <p className="text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {entry.duration_minutes ? formatDuration(entry.duration_minutes) : (
                      <Badge variant="secondary" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Running
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SubtaskItemProps {
  subtask: ProductionTask;
  onComplete: () => void;
  isCompleting: boolean;
}

function SubtaskItem({ subtask, onComplete, isCompleting }: SubtaskItemProps) {
  const isCompleted = subtask.status === 'completed';

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border',
      isCompleted && 'bg-muted/50 opacity-75'
    )}>
      <button
        onClick={onComplete}
        disabled={isCompleted || isCompleting}
        className={cn(
          'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
          isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
        )}
      >
        {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isCompleted && 'line-through text-muted-foreground')}>
          {subtask.title}
        </p>
        {subtask.description && (
          <p className="text-xs text-muted-foreground mt-1">{subtask.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {PRODUCTION_ROLE_LABELS[subtask.role as keyof typeof PRODUCTION_ROLE_LABELS]}
          </Badge>
          {subtask.estimated_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Est. {subtask.estimated_minutes}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
