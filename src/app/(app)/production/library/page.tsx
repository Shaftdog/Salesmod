'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ListTodo,
  Clock,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  useTaskLibraryByStage,
  useDeleteLibraryTask,
} from '@/hooks/use-task-library';
import {
  LibraryTaskWithSubtasks,
  ProductionStage,
  STAGE_DISPLAY_NAMES,
  STAGE_COLORS,
  ROLE_DISPLAY_NAMES,
  PRODUCTION_STAGES,
} from '@/types/task-library';
import { LibraryTaskEditor } from '@/components/production/library-task-editor';

export default function TaskLibraryPage() {
  const { data: tasksByStage, isLoading, error, refetch, isRefetching } = useTaskLibraryByStage();
  const deleteTask = useDeleteLibraryTask();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<ProductionStage>>(
    new Set(PRODUCTION_STAGES)
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<LibraryTaskWithSubtasks | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<LibraryTaskWithSubtasks | null>(null);
  const [createForStage, setCreateForStage] = useState<ProductionStage | null>(null);

  const toggleStage = (stage: ProductionStage) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask.mutateAsync(taskToDelete.id);
      setTaskToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const filterTasks = (tasks: LibraryTaskWithSubtasks[]) => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.subtasks.some(st => st.title.toLowerCase().includes(query))
    );
  };

  const getTotalCounts = () => {
    if (!tasksByStage) return { tasks: 0, subtasks: 0 };
    let tasks = 0;
    let subtasks = 0;
    Object.values(tasksByStage).forEach(stageTasks => {
      tasks += stageTasks.length;
      stageTasks.forEach(task => {
        subtasks += task.subtasks.length;
      });
    });
    return { tasks, subtasks };
  };

  const totals = getTotalCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">Failed to load task library</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/production">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Task Library</h1>
            <p className="text-sm text-muted-foreground">
              Manage reusable tasks that can be added to production templates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {totals.tasks} tasks, {totals.subtasks} subtasks
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setCreateForStage(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Library Task</DialogTitle>
              </DialogHeader>
              <LibraryTaskEditor
                defaultStage={createForStage || undefined}
                onSuccess={() => {
                  setShowCreateDialog(false);
                  setCreateForStage(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowCreateDialog(false);
                  setCreateForStage(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks and subtasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stage Accordions */}
      <div className="space-y-3">
        {PRODUCTION_STAGES.map((stage) => {
          const stageTasks = tasksByStage?.[stage] || [];
          const filteredStageTasks = filterTasks(stageTasks);
          const isExpanded = expandedStages.has(stage);

          if (searchQuery && filteredStageTasks.length === 0) {
            return null;
          }

          return (
            <Card key={stage}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleStage(stage)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Badge className={cn('font-medium', STAGE_COLORS[stage])}>
                          {STAGE_DISPLAY_NAMES[stage]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {filteredStageTasks.length} task{filteredStageTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateForStage(stage);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {filteredStageTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks in this stage</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setCreateForStage(stage);
                            setShowCreateDialog(true);
                          }}
                        >
                          Add a task
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredStageTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            isExpanded={expandedTasks.has(task.id)}
                            onToggle={() => toggleTask(task.id)}
                            onEdit={() => setEditingTask(task)}
                            onDelete={() => setTaskToDelete(task)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Library Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <LibraryTaskEditor
              task={editingTask}
              onSuccess={() => {
                setEditingTask(null);
                refetch();
              }}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Library Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{taskToDelete?.title}&quot;?
              {taskToDelete?.subtasks && taskToDelete.subtasks.length > 0 && (
                <span className="block mt-2">
                  This will also delete {taskToDelete.subtasks.length} subtask
                  {taskToDelete.subtasks.length !== 1 ? 's' : ''}.
                </span>
              )}
              <span className="block mt-2 text-amber-600">
                Templates using this task will no longer have access to it.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: LibraryTaskWithSubtasks;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {task.subtasks.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          ) : (
            <div className="w-4" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{task.title}</span>
              {task.is_required && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Required
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground truncate">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {ROLE_DISPLAY_NAMES[task.default_role]}
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimated_minutes}m
            </div>
            {task.subtasks.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {task.subtasks.length}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && task.subtasks.length > 0 && (
        <div className="border-t bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Subtasks
          </p>
          {task.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center justify-between pl-6 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                <span>{subtask.title}</span>
                {subtask.is_required && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {ROLE_DISPLAY_NAMES[subtask.default_role]}
                </Badge>
                <span className="text-xs">{subtask.estimated_minutes}m</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
