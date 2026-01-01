'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ResourceTaskCard } from './resource-task-card';
import { isDroppableColumn } from '@/hooks/use-resource-tasks';
import type {
  ResourceTaskKanbanColumn as ColumnType,
  ResourceTaskWithRelations,
} from '@/types/production';

interface ResourceTaskColumnProps {
  column: ColumnType;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onTaskClick: (task: ResourceTaskWithRelations) => void;
  onTaskDragStart: (task: ResourceTaskWithRelations) => void;
  isDragging: boolean;
  draggedTaskId?: string;
}

export function ResourceTaskColumn({
  column,
  onDragOver,
  onDrop,
  onTaskClick,
  onTaskDragStart,
  isDragging,
  draggedTaskId,
}: ResourceTaskColumnProps) {
  const canDrop = isDroppableColumn(column.id);

  return (
    <div
      className={cn(
        'flex-shrink-0 w-56 flex flex-col rounded-lg border',
        column.color,
        isDragging && canDrop && 'ring-2 ring-primary/50',
        isDragging && !canDrop && 'opacity-50'
      )}
      onDragOver={(e) => {
        if (canDrop) {
          e.preventDefault();
          onDragOver(e);
        }
      }}
      onDrop={(e) => {
        if (canDrop) {
          e.preventDefault();
          onDrop();
        }
      }}
    >
      {/* Column Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {column.count}
        </Badge>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {column.tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {isDragging && canDrop ? (
                <span>Drop task here</span>
              ) : (
                <span>No tasks</span>
              )}
            </div>
          ) : (
            column.tasks.map((task) => (
              <ResourceTaskCard
                key={task.id}
                task={task}
                onDragStart={onTaskDragStart}
                onClick={() => onTaskClick(task)}
                isDragging={draggedTaskId === task.id}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
