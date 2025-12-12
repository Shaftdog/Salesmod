'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ListPlus,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCreateProductionTemplate,
  useUpdateProductionTemplate,
} from '@/hooks/use-production';
import {
  ProductionTemplateWithTasks,
  PRODUCTION_STAGES,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_ROLES,
  PRODUCTION_ROLE_LABELS,
  ProductionStage,
  ProductionRole,
} from '@/types/production';
import { useTaskLibraryByStage } from '@/hooks/use-task-library';
import { LibraryTaskWithSubtasks } from '@/types/task-library';
import { LibraryTaskPickerForForm } from '@/components/production/library-task-picker-form';

// Schema for task definition
const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  stage: z.enum(PRODUCTION_STAGES as unknown as [string, ...string[]]),
  role: z.enum(PRODUCTION_ROLES as unknown as [string, ...string[]]),
  is_required: z.boolean().default(true),
  estimated_minutes: z.number().min(0).optional(),
  sort_order: z.number(),
  subtasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Subtask title is required'),
    sort_order: z.number(),
  })).default([]),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  tasks: z.array(taskSchema).default([]),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type TaskFormData = z.infer<typeof taskSchema>;

interface TemplateEditorProps {
  template?: ProductionTemplateWithTasks;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSuccess, onCancel }: TemplateEditorProps) {
  const createTemplate = useCreateProductionTemplate();
  const updateTemplate = useUpdateProductionTemplate();
  const [expandedStages, setExpandedStages] = useState<string[]>(
    template ? [] : ['INTAKE']
  );
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [libraryPickerStage, setLibraryPickerStage] = useState<ProductionStage | null>(null);

  const isEditing = !!template;

  // Transform template data for form
  const defaultValues: TemplateFormData = template
    ? {
        name: template.name,
        description: template.description || '',
        is_active: template.is_active,
        tasks: (template.tasks || []).map((task, index) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          stage: task.stage,
          role: task.default_role,
          is_required: task.is_required,
          estimated_minutes: task.estimated_minutes || undefined,
          sort_order: task.sort_order ?? index,
          subtasks: (task.subtasks || []).map((sub, subIndex) => ({
            id: sub.id,
            title: sub.title,
            sort_order: sub.sort_order ?? subIndex,
          })),
        })),
      }
    : {
        name: '',
        description: '',
        is_active: true,
        tasks: [],
      };

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues,
  });

  const { fields: taskFields, append: appendTask, remove: removeTask, move: moveTask } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  const onSubmit = async (data: TemplateFormData) => {
    console.log('[TemplateEditor] onSubmit called with data:', data);
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        is_active: data.is_active,
        is_default: false,
        applicable_order_types: [] as string[],
        applicable_property_types: [] as string[],
        tasks: data.tasks.map((task, index) => ({
          title: task.title,
          description: task.description || null,
          stage: task.stage as ProductionStage,
          default_role: task.role as ProductionRole,
          is_required: task.is_required,
          estimated_minutes: task.estimated_minutes ?? 30,
          sort_order: index,
          subtasks: task.subtasks.map((sub, subIndex) => ({
            title: sub.title,
            sort_order: subIndex,
            default_role: task.role as ProductionRole, // Inherit from parent task
            estimated_minutes: 15, // Default
            is_required: true,
          })),
        })),
      };

      if (isEditing && template) {
        await updateTemplate.mutateAsync({ id: template.id, ...payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }
      onSuccess();
    } catch (error) {
      // Error handled by hook
    }
  };

  const addTask = (stage: ProductionStage) => {
    const stageTasks = taskFields.filter(t => t.stage === stage);
    appendTask({
      title: '',
      description: '',
      stage,
      role: 'appraiser',
      is_required: true,
      estimated_minutes: undefined,
      sort_order: stageTasks.length,
      subtasks: [],
    });
    if (!expandedStages.includes(stage)) {
      setExpandedStages([...expandedStages, stage]);
    }
  };

  const openLibraryPicker = (stage: ProductionStage) => {
    setLibraryPickerStage(stage);
    setShowLibraryPicker(true);
  };

  const handleAddFromLibrary = (libraryTasks: LibraryTaskWithSubtasks[]) => {
    // Convert library tasks to form tasks and append them
    libraryTasks.forEach(libraryTask => {
      const stageTasks = taskFields.filter(t => t.stage === libraryTask.stage);
      appendTask({
        title: libraryTask.title,
        description: libraryTask.description || '',
        stage: libraryTask.stage,
        role: libraryTask.default_role as ProductionRole,
        is_required: libraryTask.is_required,
        estimated_minutes: libraryTask.estimated_minutes,
        sort_order: stageTasks.length,
        subtasks: libraryTask.subtasks.map((sub, idx) => ({
          title: sub.title,
          sort_order: idx,
        })),
      });
      // Expand the stage if not already expanded
      if (!expandedStages.includes(libraryTask.stage)) {
        setExpandedStages(prev => [...prev, libraryTask.stage]);
      }
    });
    setShowLibraryPicker(false);
    setLibraryPickerStage(null);
  };

  const getTasksByStage = (stage: string) => {
    return taskFields
      .map((field, index) => ({ ...field, fieldIndex: index }))
      .filter(task => task.stage === stage);
  };

  const toggleStage = (stage: string) => {
    setExpandedStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="e.g., Standard Residential Appraisal"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Describe this template's purpose..."
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Active</Label>
            <p className="text-sm text-muted-foreground">
              Active templates can be selected for new orders
            </p>
          </div>
          <Switch
            id="is_active"
            checked={form.watch('is_active')}
            onCheckedChange={(checked) => form.setValue('is_active', checked)}
          />
        </div>
      </div>

      <Separator />

      {/* Tasks by Stage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Tasks by Stage</h3>
            <p className="text-sm text-muted-foreground">
              Define tasks for each production stage
            </p>
          </div>
          <Badge variant="outline">
            {taskFields.length} tasks total
          </Badge>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {PRODUCTION_STAGES.map(stage => {
              const stageTasks = getTasksByStage(stage);
              const isExpanded = expandedStages.includes(stage);

              return (
                <div key={stage} className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleStage(stage)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4 rotate-180" />
                      )}
                      <span className="font-medium">
                        {PRODUCTION_STAGE_LABELS[stage]}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {stageTasks.length} tasks
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLibraryPicker(stage);
                        }}
                      >
                        <Library className="h-4 w-4 mr-1" />
                        From Library
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addTask(stage);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-3">
                      {stageTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tasks for this stage. Click &quot;Add Task&quot; to create one.
                        </p>
                      ) : (
                        stageTasks.map((task, taskIndex) => (
                          <TaskEditor
                            key={task.id}
                            form={form}
                            index={task.fieldIndex}
                            onRemove={() => removeTask(task.fieldIndex)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          onClick={() => {
            console.log('[TemplateEditor] Save button clicked');
            console.log('[TemplateEditor] Form errors:', form.formState.errors);
            console.log('[TemplateEditor] Form isValid:', form.formState.isValid);
            console.log('[TemplateEditor] Form isDirty:', form.formState.isDirty);
          }}
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>

    {/* Library Task Picker - outside form to prevent focus issues */}
    <LibraryTaskPickerForForm
      open={showLibraryPicker}
      onOpenChange={setShowLibraryPicker}
      defaultStage={libraryPickerStage || undefined}
      onAdd={handleAddFromLibrary}
    />
    </>
  );
}

interface TaskEditorProps {
  form: ReturnType<typeof useForm<TemplateFormData>>;
  index: number;
  onRemove: () => void;
}

function TaskEditor({ form, index, onRemove }: TaskEditorProps) {
  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: `tasks.${index}.subtasks`,
  });

  const [showSubtasks, setShowSubtasks] = useState(subtaskFields.length > 0);

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-background">
      <div className="flex items-start gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
        <div className="flex-1 space-y-3">
          {/* Title Row */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                {...form.register(`tasks.${index}.title`)}
                placeholder="Task title"
                className="h-8"
              />
              {form.formState.errors.tasks?.[index]?.title && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.tasks[index]?.title?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select
                value={form.watch(`tasks.${index}.role`)}
                onValueChange={(value) => form.setValue(`tasks.${index}.role`, value as ProductionRole)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {PRODUCTION_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Est. Minutes</Label>
              <Input
                type="number"
                {...form.register(`tasks.${index}.estimated_minutes`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
                className="h-8"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={form.watch(`tasks.${index}.is_required`)}
                  onCheckedChange={(checked) => form.setValue(`tasks.${index}.is_required`, checked)}
                />
                <span className="text-xs">Required</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <Textarea
              {...form.register(`tasks.${index}.description`)}
              placeholder="Task description (optional)"
              rows={1}
              className="text-sm resize-none"
            />
          </div>

          {/* Subtasks Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ListPlus className="h-3.5 w-3.5" />
              {showSubtasks ? 'Hide' : 'Show'} Subtasks ({subtaskFields.length})
            </button>
          </div>

          {/* Subtasks */}
          {showSubtasks && (
            <div className="pl-4 border-l-2 border-muted space-y-2">
              {subtaskFields.map((subtask, subIndex) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Input
                    {...form.register(`tasks.${index}.subtasks.${subIndex}.title`)}
                    placeholder="Subtask title"
                    className="h-7 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subIndex)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendSubtask({ title: '', sort_order: subtaskFields.length })}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Subtask
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateEditor;
