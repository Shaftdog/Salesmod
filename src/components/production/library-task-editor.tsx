'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  useCreateLibraryTask,
  useUpdateLibraryTask,
  useCreateLibrarySubtask,
  useUpdateLibrarySubtask,
  useDeleteLibrarySubtask,
} from '@/hooks/use-task-library';
import {
  LibraryTaskWithSubtasks,
  LibrarySubtask,
  ProductionStage,
  ProductionRole,
  PRODUCTION_STAGES,
  PRODUCTION_ROLES,
  STAGE_DISPLAY_NAMES,
  ROLE_DISPLAY_NAMES,
  CreateLibraryTaskSchema,
} from '@/types/task-library';

// Form Schema
const TaskFormSchema = z.object({
  stage: z.enum(PRODUCTION_STAGES),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  default_role: z.enum(PRODUCTION_ROLES),
  estimated_minutes: z.number().int().min(1).max(480),
  is_required: z.boolean(),
});

type TaskFormData = z.infer<typeof TaskFormSchema>;

interface LibraryTaskEditorProps {
  task?: LibraryTaskWithSubtasks;
  defaultStage?: ProductionStage;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LibraryTaskEditor({
  task,
  defaultStage,
  onSuccess,
  onCancel,
}: LibraryTaskEditorProps) {
  const isEditing = !!task;

  const createTask = useCreateLibraryTask();
  const updateTask = useUpdateLibraryTask();
  const createSubtask = useCreateLibrarySubtask();
  const updateSubtask = useUpdateLibrarySubtask();
  const deleteSubtask = useDeleteLibrarySubtask();

  const [subtasks, setSubtasks] = useState<(LibrarySubtask | { tempId: string } & Omit<LibrarySubtask, 'id' | 'library_task_id' | 'created_at' | 'updated_at'>)[]>(
    task?.subtasks || []
  );
  const [newSubtask, setNewSubtask] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      stage: task?.stage || defaultStage || 'INTAKE',
      title: task?.title || '',
      description: task?.description || '',
      default_role: task?.default_role || 'appraiser',
      estimated_minutes: task?.estimated_minutes || 30,
      is_required: task?.is_required ?? true,
    },
  });

  const watchedStage = watch('stage');
  const watchedRole = watch('default_role');
  const watchedRequired = watch('is_required');

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (isEditing) {
        // Update existing task
        await updateTask.mutateAsync({
          id: task.id,
          ...data,
        });

        // Handle subtask changes
        const existingIds = task.subtasks.map(s => s.id);
        const currentIds = subtasks.filter(s => 'id' in s && typeof s.id === 'string').map(s => (s as LibrarySubtask).id);

        // Delete removed subtasks
        for (const id of existingIds) {
          if (!currentIds.includes(id)) {
            await deleteSubtask.mutateAsync(id);
          }
        }

        // Update existing or create new subtasks
        for (let i = 0; i < subtasks.length; i++) {
          const st = subtasks[i];
          if ('id' in st && typeof st.id === 'string') {
            // Update existing
            await updateSubtask.mutateAsync({
              id: st.id,
              title: st.title,
              description: st.description,
              default_role: st.default_role,
              estimated_minutes: st.estimated_minutes,
              is_required: st.is_required,
              sort_order: i,
            });
          } else if ('tempId' in st) {
            // Create new
            await createSubtask.mutateAsync({
              library_task_id: task.id,
              title: st.title,
              description: st.description,
              default_role: st.default_role,
              estimated_minutes: st.estimated_minutes,
              is_required: st.is_required,
              sort_order: i,
            });
          }
        }
      } else {
        // Create new task
        const newTask = await createTask.mutateAsync(data);

        // Create subtasks
        for (let i = 0; i < subtasks.length; i++) {
          const st = subtasks[i];
          await createSubtask.mutateAsync({
            library_task_id: newTask.id,
            title: st.title,
            description: st.description || undefined,
            default_role: st.default_role,
            estimated_minutes: st.estimated_minutes,
            is_required: st.is_required,
            sort_order: i,
          });
        }
      }

      onSuccess();
    } catch (error) {
      // Error handled by hooks
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;

    const subtask = {
      tempId: `temp-${Date.now()}`,
      title: newSubtask.trim(),
      description: null,
      default_role: watchedRole as ProductionRole,
      estimated_minutes: 15,
      is_required: true,
      sort_order: subtasks.length,
    };

    setSubtasks([...subtasks, subtask]);
    setNewSubtask('');
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const moveSubtask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === subtasks.length - 1)
    ) {
      return;
    }

    const newSubtasks = [...subtasks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSubtasks[index], newSubtasks[swapIndex]] = [newSubtasks[swapIndex], newSubtasks[index]];
    setSubtasks(newSubtasks);
  };

  const updateSubtaskField = (index: number, field: string, value: any) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = { ...newSubtasks[index], [field]: value };
    setSubtasks(newSubtasks);
  };

  const isPending = createTask.isPending || updateTask.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Task Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select
              value={watchedStage}
              onValueChange={(value) => setValue('stage', value as ProductionStage)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTION_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_DISPLAY_NAMES[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stage && (
              <p className="text-sm text-red-500">{errors.stage.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_role">Default Role</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue('default_role', value as ProductionRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTION_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_DISPLAY_NAMES[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter task title..."
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="Enter task description..."
            rows={2}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimated_minutes">Estimated Minutes</Label>
            <Input
              id="estimated_minutes"
              type="number"
              min={1}
              max={480}
              {...register('estimated_minutes', { valueAsNumber: true })}
            />
            {errors.estimated_minutes && (
              <p className="text-sm text-red-500">{errors.estimated_minutes.message}</p>
            )}
          </div>

          <div className="space-y-2 flex items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_required"
                checked={watchedRequired}
                onCheckedChange={(checked) => setValue('is_required', checked)}
              />
              <Label htmlFor="is_required">Required Task</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Subtasks ({subtasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add New Subtask */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubtask();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addSubtask}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Subtask List */}
          {subtasks.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {subtasks.map((subtask, index) => (
                <div
                  key={'id' in subtask ? subtask.id : subtask.tempId}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={subtask.title}
                    onChange={(e) => updateSubtaskField(index, 'title', e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={subtask.default_role}
                    onValueChange={(value) => updateSubtaskField(index, 'default_role', value)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTION_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_DISPLAY_NAMES[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={480}
                    value={subtask.estimated_minutes}
                    onChange={(e) => updateSubtaskField(index, 'estimated_minutes', parseInt(e.target.value) || 15)}
                    className="w-16"
                  />
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveSubtask(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveSubtask(index, 'down')}
                      disabled={index === subtasks.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      onClick={() => removeSubtask(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subtasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No subtasks yet. Add subtasks to break down this task.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
