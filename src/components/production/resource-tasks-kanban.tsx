'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useResourceTasksKanban, useMoveResourceTask, isDroppableColumn } from '@/hooks/use-resource-tasks';
import { useProductionResources } from '@/hooks/use-production';
import { ResourceFilterSelect } from './resource-filter-select';
import { ResourceTaskColumn } from './resource-task-column';
import { IssueDescriptionDialog } from './issue-description-dialog';
import type {
  ResourceTaskWithRelations,
  ResourceTaskColumn as ResourceTaskColumnType,
} from '@/types/production';

interface ResourceTasksKanbanProps {
  onTaskClick?: (task: ResourceTaskWithRelations) => void;
}

export function ResourceTasksKanban({ onTaskClick }: ResourceTasksKanbanProps) {
  // Filter state
  const [selectedResource, setSelectedResource] = useState<string | undefined>();

  // Drag state
  const [draggedTask, setDraggedTask] = useState<ResourceTaskWithRelations | null>(null);

  // Issue dialog state
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    task: ResourceTaskWithRelations;
    column: ResourceTaskColumnType;
  } | null>(null);

  // Data hooks
  const { data: boardData, isLoading: isBoardLoading } = useResourceTasksKanban(selectedResource);
  const { data: resources, isLoading: isResourcesLoading } = useProductionResources();
  const moveTask = useMoveResourceTask();

  // Drag handlers
  const handleDragStart = (task: ResourceTaskWithRelations) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = async (targetColumn: ResourceTaskColumnType) => {
    if (!draggedTask) return;

    // Don't do anything if dropping in same column
    const currentColumn = boardData?.columns.find((col) =>
      col.tasks.some((t) => t.id === draggedTask.id)
    );
    if (currentColumn?.id === targetColumn) {
      setDraggedTask(null);
      return;
    }

    // Check if column allows drops
    if (!isDroppableColumn(targetColumn)) {
      setDraggedTask(null);
      return;
    }

    // Special handling for ISSUES column - show dialog
    if (targetColumn === 'ISSUES') {
      setPendingDrop({ task: draggedTask, column: targetColumn });
      setIssueDialogOpen(true);
      setDraggedTask(null);
      return;
    }

    // For other columns, move directly
    await moveTask.mutateAsync({
      task_id: draggedTask.id,
      target_column: targetColumn,
    });

    setDraggedTask(null);
  };

  // Issue dialog submit handler
  const handleIssueSubmit = async (description: string) => {
    if (!pendingDrop) return;

    await moveTask.mutateAsync({
      task_id: pendingDrop.task.id,
      target_column: pendingDrop.column,
      issue_description: description,
    });

    setIssueDialogOpen(false);
    setPendingDrop(null);
  };

  // Handle issue dialog cancel
  const handleIssueDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPendingDrop(null);
    }
    setIssueDialogOpen(open);
  };

  // Task click handler
  const handleTaskClick = (task: ResourceTaskWithRelations) => {
    onTaskClick?.(task);
  };

  if (isBoardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" onDragEnd={handleDragEnd}>
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Resource Tasks</h2>
          <span className="text-sm text-muted-foreground">
            {boardData?.total_tasks || 0} total tasks
          </span>
        </div>
        <ResourceFilterSelect
          resources={resources}
          value={selectedResource}
          onChange={setSelectedResource}
          isLoading={isResourcesLoading}
        />
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-3 h-[calc(100vh-16rem)] overflow-x-auto pb-4">
        {boardData?.columns.map((column) => (
          <ResourceTaskColumn
            key={column.id}
            column={column}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
            onTaskClick={handleTaskClick}
            onTaskDragStart={handleDragStart}
            isDragging={draggedTask !== null}
            draggedTaskId={draggedTask?.id}
          />
        ))}
      </div>

      {/* Issue Description Dialog */}
      <IssueDescriptionDialog
        open={issueDialogOpen}
        onOpenChange={handleIssueDialogOpenChange}
        onSubmit={handleIssueSubmit}
        task={pendingDrop?.task}
        isLoading={moveTask.isPending}
      />
    </div>
  );
}
