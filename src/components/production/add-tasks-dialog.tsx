'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  Clock,
  CheckSquare,
  Library,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskLibraryByStage } from '@/hooks/use-task-library';
import { useAddTasksToCard } from '@/hooks/use-production';
import {
  LibraryTaskWithSubtasks,
  ProductionStage,
  PRODUCTION_STAGES,
  STAGE_DISPLAY_NAMES,
  STAGE_COLORS,
  ROLE_DISPLAY_NAMES,
} from '@/types/task-library';

interface AddTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  currentStage?: ProductionStage;
  onSuccess?: () => void;
}

export function AddTasksDialog({
  open,
  onOpenChange,
  cardId,
  currentStage,
  onSuccess,
}: AddTasksDialogProps) {
  const { data: tasksByStage, isLoading } = useTaskLibraryByStage();
  const addTasks = useAddTasksToCard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<ProductionStage | 'all'>('all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedStage('all');
      setSelectedTaskIds(new Set());
    }
  }, [open]);

  // Filter out ON_HOLD and CANCELLED from available stages for task selection
  // Memoize to prevent useMemo dependency recalculation
  const selectableStages = useMemo(
    () => PRODUCTION_STAGES.filter(s => s !== 'ON_HOLD' && s !== 'CANCELLED'),
    []
  );

  // Flatten all tasks and apply filters
  const filteredTasks = useMemo(() => {
    if (!tasksByStage) return [];

    let tasks: LibraryTaskWithSubtasks[] = [];

    if (selectedStage === 'all') {
      selectableStages.forEach(stage => {
        tasks = [...tasks, ...(tasksByStage[stage] || [])];
      });
    } else {
      tasks = tasksByStage[selectedStage] || [];
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.subtasks.some(st => st.title.toLowerCase().includes(query))
      );
    }

    return tasks;
  }, [tasksByStage, selectedStage, searchQuery, selectableStages]);

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleAdd = async () => {
    if (selectedTaskIds.size === 0) return;

    try {
      await addTasks.mutateAsync({
        cardId,
        libraryTaskIds: Array.from(selectedTaskIds),
      });
      setSelectedTaskIds(new Set());
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const allSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Add Tasks from Library
          </DialogTitle>
          <DialogDescription>
            Select tasks to add to this production card. Tasks will be assigned based on the card&apos;s team assignments.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedStage}
            onValueChange={(value) => setSelectedStage(value as ProductionStage | 'all')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {selectableStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_DISPLAY_NAMES[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Library className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found</p>
            {searchQuery && (
              <p className="text-sm">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <>
            {/* Select All */}
            {filteredTasks.length > 0 && (
              <div className="flex items-center gap-2 py-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All ({filteredTasks.length})
                </label>
              </div>
            )}

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 py-2">
                {filteredTasks.map((task) => {
                  const isSelected = selectedTaskIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => toggleTask(task.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTask(task.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn('text-xs shrink-0', STAGE_COLORS[task.stage])}>
                            {STAGE_DISPLAY_NAMES[task.stage]}
                          </Badge>
                          <span className="font-medium">{task.title}</span>
                          {task.is_required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {ROLE_DISPLAY_NAMES[task.default_role]}
                            </Badge>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimated_minutes} min
                          </span>
                          {task.subtasks.length > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-3 w-3" />
                              {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedTaskIds.size === 0 || addTasks.isPending}
          >
            {addTasks.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Selected ({selectedTaskIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTasksDialog;
