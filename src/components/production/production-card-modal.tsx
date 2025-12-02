'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Calendar,
  User,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProductionCard,
  useMoveProductionCard,
  useCompleteProductionTask,
  useStartTimer,
  useStopTimer,
} from '@/hooks/use-production';
import {
  ProductionStage,
  ProductionTask,
  ProductionCardWithTasks,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGES,
  TASK_STATUS_LABELS,
  PRODUCTION_ROLE_LABELS,
  calculateCompletionPercent,
  formatDuration,
  getNextStage,
  isTaskOverdue,
} from '@/types/production';
import { format, formatDistanceToNow } from 'date-fns';

interface ProductionCardModalProps {
  cardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductionCardModal({ cardId, open, onOpenChange }: ProductionCardModalProps) {
  const { data, isLoading, error } = useProductionCard(cardId);
  const moveCard = useMoveProductionCard();
  const completeTask = useCompleteProductionTask();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const [expandedStages, setExpandedStages] = useState<Set<ProductionStage>>(new Set());

  const card = data?.card;
  const canMoveToNextStage = data?.can_move_to_next_stage;
  const nextStage = card ? getNextStage(card.current_stage) : null;

  const toggleStageExpanded = (stage: ProductionStage) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  const handleMoveToNextStage = async () => {
    if (!card || !nextStage) return;
    try {
      await moveCard.mutateAsync({ cardId: card.id, targetStage: nextStage });
    } catch (error) {
      // Error handled by hook
    }
  };

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

  // Group tasks by stage
  type TasksArray = ProductionCardWithTasks['tasks'];
  const tasksByStage: Partial<Record<ProductionStage, TasksArray>> = card?.tasks.reduce((acc, task) => {
    const stageKey = task.stage as ProductionStage;
    if (!acc[stageKey]) acc[stageKey] = [];
    acc[stageKey]!.push(task);
    return acc;
  }, {} as Partial<Record<ProductionStage, TasksArray>>) || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-hidden flex flex-col">
        {isLoading ? (
          <SheetHeader>
            <SheetTitle>Loading...</SheetTitle>
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </SheetHeader>
        ) : error || !card ? (
          <SheetHeader>
            <SheetTitle>Error</SheetTitle>
            <div className="flex items-center justify-center h-full text-red-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <span>Failed to load card details</span>
            </div>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl">
                    {card.order?.order_number || 'Production Card'}
                  </SheetTitle>
                  {card.order?.property_address && (
                    <p className="text-sm text-muted-foreground">
                      {card.order.property_address}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-sm">
                  {PRODUCTION_STAGE_LABELS[card.current_stage]}
                </Badge>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">
                    {calculateCompletionPercent(card.completed_tasks, card.total_tasks)}%
                  </span>
                </div>
                <Progress
                  value={calculateCompletionPercent(card.completed_tasks, card.total_tasks)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {card.completed_tasks} of {card.total_tasks} tasks completed
                </p>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {card.due_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(new Date(card.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {card.assigned_appraiser && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{card.assigned_appraiser.name || card.assigned_appraiser.email}</span>
                  </div>
                )}
              </div>

              {/* Move to Next Stage Button */}
              {nextStage && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleMoveToNextStage}
                    disabled={!canMoveToNextStage || moveCard.isPending}
                    className="flex-1"
                  >
                    {moveCard.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    Move to {PRODUCTION_STAGE_LABELS[nextStage]}
                  </Button>
                  {!canMoveToNextStage && (
                    <p className="text-xs text-amber-600">
                      Complete all required tasks first
                    </p>
                  )}
                </div>
              )}
            </SheetHeader>

            <Separator className="my-4" />

            {/* Tasks List */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {PRODUCTION_STAGES.map(stage => {
                  const tasks = tasksByStage[stage] || [];
                  if (tasks.length === 0) return null;

                  const stageTasks = tasks.filter(t => !t.parent_task_id);
                  const stageCompleted = stageTasks.filter(t => t.status === 'completed').length;
                  const isCurrentStage = stage === card.current_stage;
                  const isExpanded = expandedStages.has(stage) || isCurrentStage;

                  return (
                    <div key={stage} className={cn(
                      'rounded-lg border p-3',
                      isCurrentStage && 'border-blue-300 bg-blue-50/50'
                    )}>
                      <button
                        onClick={() => toggleStageExpanded(stage)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn(
                            'h-4 w-4 transition-transform',
                            isExpanded && 'rotate-90'
                          )} />
                          <span className="font-medium text-sm">
                            {PRODUCTION_STAGE_LABELS[stage]}
                          </span>
                          {isCurrentStage && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {stageCompleted}/{stageTasks.length} tasks
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {stageTasks.map(task => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onComplete={() => handleCompleteTask(task.id)}
                              onStartTimer={() => handleStartTimer(task.id)}
                              onStopTimer={() => task.active_timer && handleStopTimer(task.active_timer.id)}
                              isCompletingTask={completeTask.isPending}
                              isStartingTimer={startTimer.isPending}
                              isStoppingTimer={stopTimer.isPending}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface TaskItemProps {
  task: any; // ProductionTask with subtasks and time_entries
  onComplete: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  isCompletingTask: boolean;
  isStartingTimer: boolean;
  isStoppingTimer: boolean;
}

function TaskItem({
  task,
  onComplete,
  onStartTimer,
  onStopTimer,
  isCompletingTask,
  isStartingTimer,
  isStoppingTimer,
}: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const hasActiveTimer = !!task.active_timer;
  const overdue = isTaskOverdue(task);

  return (
    <div className={cn(
      'p-3 rounded border bg-white',
      isCompleted && 'opacity-60',
      overdue && !isCompleted && 'border-red-300'
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onComplete}
          disabled={isCompleted || isCompletingTask}
          className={cn(
            'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
            isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
          )}
        >
          {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
        </button>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium', isCompleted && 'line-through')}>
              {task.title}
            </p>
            <Badge variant="outline" className="text-xs shrink-0">
              {PRODUCTION_ROLE_LABELS[task.role as keyof typeof PRODUCTION_ROLE_LABELS]}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          )}

          {/* Task Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {task.assigned_user && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assigned_user.name || task.assigned_user.email}</span>
              </div>
            )}
            {task.due_date && (
              <div className={cn('flex items-center gap-1', overdue && !isCompleted && 'text-red-600')}>
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
            {task.total_time_minutes > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(task.total_time_minutes)}</span>
              </div>
            )}
          </div>

          {/* Timer Controls */}
          {!isCompleted && (
            <div className="mt-2">
              {hasActiveTimer ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStopTimer}
                  disabled={isStoppingTimer}
                  className="h-7 text-xs"
                >
                  {isStoppingTimer ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Pause className="h-3 w-3 mr-1" />
                  )}
                  Stop Timer
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartTimer}
                  disabled={isStartingTimer}
                  className="h-7 text-xs"
                >
                  {isStartingTimer ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Start Timer
                </Button>
              )}
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-gray-200 space-y-1">
              {task.subtasks.map((subtask: ProductionTask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    'h-3 w-3 rounded-full border',
                    subtask.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  )} />
                  <span className={subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductionCardModal;
