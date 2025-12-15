'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Calendar, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import type { Task, TaskStatus } from '@/lib/types';
import { useUpdateTask } from '@/hooks/use-tasks';

const TASK_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-50 border-gray-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', color: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 border-red-200' },
};

const priorityColors = {
  low: 'border-l-gray-400',
  normal: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
};

const priorityBadgeColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface TaskKanbanBoardProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  currentUserId?: string;
  filterMyTasks?: boolean;
}

export function TaskKanbanBoard({
  tasks,
  isLoading,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  currentUserId,
  filterMyTasks = false,
}: TaskKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { mutateAsync: updateTask } = useUpdateTask();

  // Filter tasks if needed
  const filteredTasks = filterMyTasks && currentUserId
    ? tasks.filter(task => task.assignedTo === currentUserId)
    : tasks;

  // Group tasks by status
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: TaskStatus) => {
    if (!draggedTask) return;

    // Don't allow dropping on the same status
    if (draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const updates: Record<string, unknown> = { status: targetStatus };

      // If moving to completed, set completed_at
      if (targetStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      // If moving from completed to another status, clear completed_at
      else if (draggedTask.status === 'completed') {
        updates.completed_at = null;
      }

      await updateTask({
        id: draggedTask.id,
        ...updates,
      });
    } finally {
      setDraggedTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-14rem)] overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader className="pb-2 px-3 py-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="px-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-14rem)] overflow-x-auto pb-4">
      {TASK_STATUSES.map((status) => (
        <div
          key={status}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(status)}
        >
          <Card className={cn('h-full border', STATUS_CONFIG[status].color)}>
            <CardHeader className="pb-2 px-3 py-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{STATUS_CONFIG[status].label}</span>
                <Badge variant="secondary" className="ml-2">
                  {tasksByStatus[status].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-2">
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <div className="space-y-2 p-1">
                  {tasksByStatus[status].map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onClick={() => onTaskClick?.(task)}
                      isDragging={draggedTask?.id === task.id}
                    />
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

interface KanbanTaskCardProps {
  task: Task;
  onDragStart: (task: Task) => void;
  onClick: () => void;
  isDragging: boolean;
}

function KanbanTaskCard({ task, onDragStart, onClick, isDragging }: KanbanTaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:shadow-md transition-all border-l-4',
        priorityColors[task.priority],
        isDragging && 'opacity-50 scale-95',
        isOverdue && 'ring-2 ring-red-300',
        task.status === 'completed' && 'opacity-60'
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Title & Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold truncate',
              task.status === 'completed' && 'line-through'
            )}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={cn('text-xs shrink-0', priorityBadgeColors[task.priority])}
          >
            {task.priority}
          </Badge>
        </div>

        {/* Client */}
        {task.client && (
          <p className="text-xs text-muted-foreground truncate">
            {task.client.companyName}
          </p>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-600 font-semibold' : isDueToday ? 'text-orange-600 font-semibold' : 'text-muted-foreground'
          )}>
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{task.assignee.name}</span>
          </div>
        )}

        {/* Completed indicator */}
        {task.status === 'completed' && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TaskKanbanBoard;
