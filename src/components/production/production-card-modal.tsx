'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  User,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Users,
  FileText,
  Home,
  PauseCircle,
  XCircle,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  useProductionCard,
  useMoveProductionCard,
  useCompleteProductionTask,
  useDeleteProductionTask,
  useStartTimer,
  useStopTimer,
  useResumeProductionCard,
  useUpdateProductionCard,
} from '@/hooks/use-production';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

// Helper to parse date strings as local dates, not UTC
// Handles both date-only strings (YYYY-MM-DD) and full ISO timestamps
// This prevents timezone issues where Dec 23 becomes Dec 22
function parseLocalDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;

  let date: Date;

  // Check if it's a full ISO timestamp (contains 'T')
  if (dateString.includes('T')) {
    // Parse the ISO timestamp and extract date parts in UTC, then create local date
    const isoDate = new Date(dateString);
    if (isNaN(isoDate.getTime())) return undefined;
    // Create a new date using the UTC date components as local
    date = new Date(isoDate.getUTCFullYear(), isoDate.getUTCMonth(), isoDate.getUTCDate());
  } else {
    // Date-only string (YYYY-MM-DD) - add time component to force local interpretation
    date = new Date(dateString + 'T00:00:00');
  }

  // Return undefined if invalid date
  if (isNaN(date.getTime())) return undefined;
  return date;
}

// Safe date formatter that handles null/invalid dates
function formatLocalDate(dateString: string | null | undefined, formatStr: string): string {
  const date = parseLocalDate(dateString);
  if (!date) return '';
  return format(date, formatStr);
}
import { CorrectionDialog } from './correction-dialog';
import { TaskAssigneePopover } from './task-assignee-popover';
import { EditTeamDialog } from './edit-team-dialog';
import { HoldOrderDialog } from './hold-order-dialog';
import { CancelOrderDialog } from './cancel-order-dialog';
import { AddTasksDialog } from './add-tasks-dialog';
import { TaskDetailDialog } from './task-detail-dialog';
import { ScheduleInspectionDialog } from '@/components/orders/schedule-inspection-dialog';
import type { Order } from '@/lib/types';

interface ProductionCardModalProps {
  cardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductionCardModal({ cardId, open, onOpenChange }: ProductionCardModalProps) {
  const { data, isLoading, error } = useProductionCard(cardId);
  const moveCard = useMoveProductionCard();
  const completeTask = useCompleteProductionTask();
  const deleteTask = useDeleteProductionTask();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const resumeCard = useResumeProductionCard();
  const updateCard = useUpdateProductionCard();
  const [expandedStages, setExpandedStages] = useState<Set<ProductionStage>>(new Set());
  const [dueDatePopoverOpen, setDueDatePopoverOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedTaskForCorrection, setSelectedTaskForCorrection] = useState<any>(null);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [addTasksDialogOpen, setAddTasksDialogOpen] = useState(false);
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);
  const [scheduleInspectionDialogOpen, setScheduleInspectionDialogOpen] = useState(false);

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

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
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

  const handleRequestCorrection = (task: any) => {
    setSelectedTaskForCorrection(task);
    setCorrectionDialogOpen(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTaskForDetail(task);
    setTaskDetailDialogOpen(true);
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

              {/* Order and Property Links */}
              <div className="flex flex-wrap gap-2">
                <Link href={`/orders/${card.order_id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <FileText className="h-3 w-3 mr-1" />
                    Order: {card.order?.order_number || card.order_id.slice(0, 8)}
                  </Badge>
                </Link>
                {card.order?.property_id && (
                  <Link href={`/properties/${card.order.property_id}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      <Home className="h-3 w-3 mr-1" />
                      Property
                    </Badge>
                  </Link>
                )}
              </div>

              {/* Inspection Date - Prominent Display with Schedule Button */}
              {card.order?.inspection_date ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-200">
                  <CalendarCheck className="h-8 w-8 text-teal-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-teal-700">Inspection Date</p>
                    <p className="text-lg font-semibold text-teal-800">
                      {format(new Date(card.order.inspection_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-teal-600">
                      {formatDistanceToNow(new Date(card.order.inspection_date), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleInspectionDialogOpen(true)}
                    className="border-teal-300 text-teal-700 hover:bg-teal-100"
                  >
                    <CalendarPlus className="h-4 w-4 mr-1" />
                    Reschedule
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setScheduleInspectionDialogOpen(true)}
                  className="w-full border-dashed border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Schedule Inspection
                </Button>
              )}

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
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {/* Editable Due Date */}
                <Popover open={dueDatePopoverOpen} onOpenChange={setDueDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1 hover:text-primary transition-colors',
                        card.due_date ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>
                        {card.due_date
                          ? `Due: ${formatLocalDate(card.due_date, 'MMM d, yyyy')}`
                          : 'Set due date'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={parseLocalDate(card.due_date)}
                      onSelect={(date) => {
                        updateCard.mutate({
                          id: card.id,
                          due_date: date ? format(date, 'yyyy-MM-dd') : null,
                        });
                        setDueDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                    {card.due_date && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground"
                          onClick={() => {
                            updateCard.mutate({
                              id: card.id,
                              due_date: null,
                            });
                            setDueDatePopoverOpen(false);
                          }}
                        >
                          Clear due date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                {card.assigned_appraiser && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{card.assigned_appraiser.name || card.assigned_appraiser.email}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTeamDialogOpen(true)}
                  className="ml-auto"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Edit Team
                </Button>
              </div>

              {/* Action Buttons */}
              {card.current_stage === 'ON_HOLD' ? (
                /* Resume from Hold */
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => resumeCard.mutate({ cardId: card.id })}
                    disabled={resumeCard.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {resumeCard.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4 mr-2" />
                    )}
                    Resume Order
                  </Button>
                  {card.hold_reason && (
                    <p className="text-xs text-muted-foreground">
                      Reason: {card.hold_reason}
                    </p>
                  )}
                </div>
              ) : card.current_stage === 'CANCELLED' ? (
                /* Cancelled - show reason if any */
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Order Cancelled</p>
                    {card.cancelled_reason && (
                      <p className="text-xs text-red-600">Reason: {card.cancelled_reason}</p>
                    )}
                    {card.cancelled_at && (
                      <p className="text-xs text-red-600">
                        Cancelled {format(new Date(card.cancelled_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Normal workflow - Move, Hold, Cancel buttons */
                <div className="space-y-2">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHoldDialogOpen(true)}
                      className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Hold
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
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
                              onClick={() => handleTaskClick(task)}
                              onComplete={() => handleCompleteTask(task.id)}
                              onDelete={() => handleDeleteTask(task.id)}
                              onStartTimer={() => handleStartTimer(task.id)}
                              onStopTimer={() => task.active_timer && handleStopTimer(task.active_timer.id)}
                              onRequestCorrection={() => handleRequestCorrection(task)}
                              isCompletingTask={completeTask.isPending}
                              isDeletingTask={deleteTask.isPending}
                              isStartingTimer={startTimer.isPending}
                              isStoppingTimer={stopTimer.isPending}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Tasks Button */}
                {card.current_stage !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setAddTasksDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tasks from Library
                  </Button>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>

      {/* Correction Dialog */}
      {selectedTaskForCorrection && card && (
        <CorrectionDialog
          open={correctionDialogOpen}
          onOpenChange={(open) => {
            setCorrectionDialogOpen(open);
            if (!open) setSelectedTaskForCorrection(null);
          }}
          task={{
            id: selectedTaskForCorrection.id,
            title: selectedTaskForCorrection.title,
            description: selectedTaskForCorrection.description,
            stage: selectedTaskForCorrection.stage,
            assigned_to: selectedTaskForCorrection.assigned_to,
          }}
          productionCard={{
            id: card.id,
            order: card.order,
          }}
          assignedProfile={selectedTaskForCorrection.assigned_user}
        />
      )}

      {/* Edit Team Dialog */}
      {card && (
        <EditTeamDialog
          cardId={card.id}
          currentAssignments={{
            assigned_appraiser_id: card.assigned_appraiser_id,
            assigned_reviewer_id: card.assigned_reviewer_id,
            assigned_admin_id: card.assigned_admin_id,
            assigned_trainee_id: card.assigned_trainee_id,
            assigned_researcher_level_1_id: card.assigned_researcher_level_1_id,
            assigned_researcher_level_2_id: card.assigned_researcher_level_2_id,
            assigned_researcher_level_3_id: card.assigned_researcher_level_3_id,
            assigned_inspector_id: card.assigned_inspector_id,
          }}
          open={editTeamDialogOpen}
          onOpenChange={setEditTeamDialogOpen}
        />
      )}

      {/* Hold Order Dialog */}
      {card && (
        <HoldOrderDialog
          cardId={card.id}
          orderNumber={card.order?.order_number || null}
          open={holdDialogOpen}
          onOpenChange={setHoldDialogOpen}
        />
      )}

      {/* Cancel Order Dialog */}
      {card && (
        <CancelOrderDialog
          cardId={card.id}
          orderNumber={card.order?.order_number || null}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
        />
      )}

      {/* Add Tasks Dialog */}
      {card && (
        <AddTasksDialog
          cardId={card.id}
          currentStage={card.current_stage}
          open={addTasksDialogOpen}
          onOpenChange={setAddTasksDialogOpen}
        />
      )}

      {/* Task Detail Dialog */}
      {selectedTaskForDetail && (
        <TaskDetailDialog
          task={selectedTaskForDetail}
          open={taskDetailDialogOpen}
          onOpenChange={(open) => {
            setTaskDetailDialogOpen(open);
            if (!open) setSelectedTaskForDetail(null);
          }}
        />
      )}

      {/* Schedule Inspection Dialog */}
      {card?.order && (
        <ScheduleInspectionDialog
          order={{
            id: card.order.id,
            orderNumber: card.order.order_number || '',
            propertyAddress: card.order.property_address || '',
            propertyCity: card.order.property_city || '',
            propertyState: card.order.property_state || '',
            propertyZip: card.order.property_zip || '',
            borrowerName: card.order.borrower_name || '',
            borrowerEmail: card.order.borrower_email || undefined,
            borrowerPhone: card.order.borrower_phone || undefined,
            propertyContactName: card.order.property_contact_name || undefined,
            propertyContactPhone: card.order.property_contact_phone || undefined,
            propertyContactEmail: card.order.property_contact_email || undefined,
            accessInstructions: card.order.access_instructions || undefined,
            specialInstructions: card.order.special_instructions || undefined,
          } as Order}
          open={scheduleInspectionDialogOpen}
          onOpenChange={setScheduleInspectionDialogOpen}
        />
      )}
    </Sheet>
  );
}

interface TaskItemProps {
  task: any; // ProductionTask with subtasks and time_entries
  onClick?: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onRequestCorrection: () => void;
  isCompletingTask: boolean;
  isDeletingTask: boolean;
  isStartingTimer: boolean;
  isStoppingTimer: boolean;
}

function TaskItem({
  task,
  onClick,
  onComplete,
  onDelete,
  onStartTimer,
  onStopTimer,
  onRequestCorrection,
  isCompletingTask,
  isDeletingTask,
  isStartingTimer,
  isStoppingTimer,
}: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const hasActiveTimer = !!task.active_timer;
  const overdue = isTaskOverdue(task);

  return (
    <div
      className={cn(
        'p-3 rounded border bg-white cursor-pointer hover:bg-gray-50 transition-colors',
        isCompleted && 'opacity-60',
        overdue && !isCompleted && 'border-red-300'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
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
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className="text-xs">
                {PRODUCTION_ROLE_LABELS[task.role as keyof typeof PRODUCTION_ROLE_LABELS]}
              </Badge>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                disabled={isDeletingTask}
                className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete task"
              >
                {isDeletingTask ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          )}

          {/* Task Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {/* Assignee - clickable to reassign */}
            <TaskAssigneePopover
              taskId={task.id}
              currentAssignee={task.assigned_user}
              disabled={isCompleted}
            />
            {task.due_date && (
              <div className={cn('flex items-center gap-1', overdue && !isCompleted && 'text-red-600')}>
                <Calendar className="h-3 w-3" />
                <span>{formatLocalDate(task.due_date, 'MMM d')}</span>
              </div>
            )}
            {task.total_time_minutes > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(task.total_time_minutes)}</span>
              </div>
            )}
          </div>

          {/* Timer Controls & Correction Button */}
          {!isCompleted && (
            <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
              <Button
                size="sm"
                variant="ghost"
                onClick={onRequestCorrection}
                className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Correction
              </Button>
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
