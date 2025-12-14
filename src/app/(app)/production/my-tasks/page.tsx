'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Loader2,
  Calendar,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMyProductionTasksToday,
  useCompleteProductionTask,
  useStartTimer,
  useStopTimer,
} from '@/hooks/use-production';
import {
  ProductionTask,
  ProductionTaskWithRelations,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_ROLE_LABELS,
  formatDuration,
  isTaskOverdue,
  isTaskDueToday,
} from '@/types/production';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function MyTasksPage() {
  const { data, isLoading, error, refetch, isRefetching } = useMyProductionTasksToday();
  const completeTask = useCompleteProductionTask();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const [activeTab, setActiveTab] = useState('all');

  const tasks: ProductionTaskWithRelations[] = data?.tasks || [];

  // Filter tasks based on tab
  const filteredTasks = tasks.filter((task: ProductionTaskWithRelations) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'overdue') return isTaskOverdue(task);
    if (activeTab === 'today') return isTaskDueToday(task);
    if (activeTab === 'in_progress') return task.status === 'in_progress';
    return true;
  });

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      await startTimer.mutateAsync(taskId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStopTimer = async (entryId: string) => {
    try {
      await stopTimer.mutateAsync({ entryId });
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <AlertTriangle className="h-6 w-6 mr-2" />
        <span>Failed to load tasks</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Your production tasks sorted by due date
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/production/board">
              Back to Board
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">assigned to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.overdue_count || 0}</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.due_today_count || 0}</div>
            <p className="text-xs text-muted-foreground">tasks for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.upcoming_count || 0}</div>
            <p className="text-xs text-muted-foreground">scheduled ahead</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Tasks ({data?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">
            Overdue ({data?.overdue_count || 0})
          </TabsTrigger>
          <TabsTrigger value="today" className="text-orange-600">
            Due Today ({data?.due_today_count || 0})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  No tasks in this category
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleCompleteTask(task.id)}
                  onCompleteSubtask={(subtaskId) => handleCompleteTask(subtaskId)}
                  onStartTimer={() => handleStartTimer(task.id)}
                  onStopTimer={() => task.active_timer && handleStopTimer(task.active_timer.id)}
                  isCompletingTask={completeTask.isPending}
                  isStartingTimer={startTimer.isPending}
                  isStoppingTimer={stopTimer.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TaskCardProps {
  task: ProductionTaskWithRelations;
  onComplete: () => void;
  onCompleteSubtask: (subtaskId: string) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  isCompletingTask: boolean;
  isStartingTimer: boolean;
  isStoppingTimer: boolean;
}

function TaskCard({
  task,
  onComplete,
  onCompleteSubtask,
  onStartTimer,
  onStopTimer,
  isCompletingTask,
  isStartingTimer,
  isStoppingTimer,
}: TaskCardProps) {
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);
  const isCompleted = task.status === 'completed';
  const hasActiveTimer = !!(task as any).active_timer;
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const subtasks: ProductionTask[] = (task as any).subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const hasSubtasks = subtasks.length > 0;
  const subtaskProgress = hasSubtasks ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <Card className={cn(
      'transition-all',
      overdue && !isCompleted && 'border-red-300 bg-red-50/50',
      dueToday && !isCompleted && !overdue && 'border-orange-300 bg-orange-50/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={onComplete}
            disabled={isCompleted || isCompletingTask}
            className={cn(
              'mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
              isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
            )}
          >
            {isCompleted && <CheckCircle2 className="h-4 w-4 text-white" />}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={cn('font-medium', isCompleted && 'line-through text-muted-foreground')}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
              </div>
              <Badge variant="outline" className="shrink-0">
                {PRODUCTION_ROLE_LABELS[task.role as keyof typeof PRODUCTION_ROLE_LABELS]}
              </Badge>
            </div>

            {/* Order & Stage Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {(task as any).production_card?.order?.file_number && (
                <Link
                  href={`/production/board`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{(task as any).production_card.order.file_number}</span>
                </Link>
              )}
              <Badge variant="secondary" className="text-xs">
                {PRODUCTION_STAGE_LABELS[task.stage]}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {task.due_date && (
                <div className={cn(
                  'flex items-center gap-1',
                  overdue && !isCompleted ? 'text-red-600 font-medium' : 'text-muted-foreground'
                )}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {overdue ? 'Overdue: ' : dueToday ? 'Due today: ' : 'Due: '}
                    {format(new Date(task.due_date), 'MMM d, h:mm a')}
                  </span>
                  <span className="text-xs">
                    ({formatDistanceToNow(new Date(task.due_date), { addSuffix: true })})
                  </span>
                </div>
              )}
              {task.total_time_minutes > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Time: {formatDuration(task.total_time_minutes)}</span>
                </div>
              )}
            </div>

            {/* Timer Controls & Actions */}
            {!isCompleted && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {hasActiveTimer ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onStopTimer}
                    disabled={isStoppingTimer}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    {isStoppingTimer ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    Stop Timer
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onStartTimer}
                      disabled={isStartingTimer}
                    >
                      {isStartingTimer ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Timer
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onComplete}
                      disabled={isCompletingTask}
                    >
                      {isCompletingTask ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Complete
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/production/my-tasks/${task.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            )}

            {/* Completed task - still show View Details */}
            {isCompleted && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/production/my-tasks/${task.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            )}

            {/* Collapsible Subtasks */}
            {hasSubtasks && (
              <Collapsible open={isSubtasksOpen} onOpenChange={setIsSubtasksOpen} className="mt-3">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2 border-t">
                    {isSubtasksOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <ListTodo className="h-4 w-4" />
                    <span>Subtasks ({completedSubtasks}/{subtasks.length})</span>
                    <div className="flex-1 ml-2">
                      <Progress value={subtaskProgress} className="h-1.5" />
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {subtasks.map((subtask) => {
                    const subtaskCompleted = subtask.status === 'completed';
                    return (
                      <div
                        key={subtask.id}
                        className={cn(
                          'flex items-start gap-3 p-2 rounded-md border bg-background',
                          subtaskCompleted && 'opacity-60'
                        )}
                      >
                        <button
                          onClick={() => onCompleteSubtask(subtask.id)}
                          disabled={subtaskCompleted || isCompletingTask}
                          className={cn(
                            'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                            subtaskCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
                          )}
                        >
                          {subtaskCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium',
                            subtaskCompleted && 'line-through text-muted-foreground'
                          )}>
                            {subtask.title}
                          </p>
                          {subtask.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{subtask.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {PRODUCTION_ROLE_LABELS[subtask.role as keyof typeof PRODUCTION_ROLE_LABELS]}
                            </Badge>
                            {subtask.estimated_minutes && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Est. {subtask.estimated_minutes}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
