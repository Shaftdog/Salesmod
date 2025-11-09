'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob } from '@/hooks/use-jobs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { CreateJobRequestSchema } from '@/types/jobs';

type CreateJobFormData = z.infer<typeof CreateJobRequestSchema>;

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobFormDialog({ open, onOpenChange }: JobFormDialogProps) {
  const createJob = useCreateJob();
  const [templates, setTemplates] = useState<Array<{ name: string; subject: string; body: string }>>([
    { name: 'intro', subject: '', body: '' },
  ]);

  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(CreateJobRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      params: {
        target_group: 'all_clients',
        cadence: {
          day0: true,
          day4: false,
          day10: false,
          day21: false,
        },
        review_mode: true,
        batch_size: 10,
        auto_approve: false,
        stop_on_error: false,
        portal_checks: false,
        create_tasks: false,
      },
    },
  });

  const onSubmit = async (data: CreateJobFormData) => {
    // Build templates object from array
    const templatesObj: Record<string, { subject: string; body: string }> = {};
    templates.forEach((t) => {
      if (t.name && t.subject && t.body) {
        templatesObj[t.name] = { subject: t.subject, body: t.body };
      }
    });

    const jobData: CreateJobFormData = {
      ...data,
      params: {
        ...data.params,
        templates: templatesObj,
      },
    };

    await createJob.mutateAsync(jobData);
    onOpenChange(false);
    form.reset();
    setTemplates([{ name: 'intro', subject: '', body: '' }]);
  };

  const addTemplate = () => {
    const templateNames = ['intro', 'followup1', 'followup2', 'final'];
    const nextName = templateNames[templates.length] || `template${templates.length + 1}`;
    setTemplates([...templates, { name: nextName, subject: '', body: '' }]);
  };

  const removeTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  const updateTemplate = (index: number, field: 'name' | 'subject' | 'body', value: string) => {
    const updated = [...templates];
    updated[index][field] = value;
    setTemplates(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Set up a multi-step campaign with automated email outreach and follow-ups.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input placeholder="AMC Outreach Campaign" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contact all AMCs to verify active status and update profiles..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Target Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold">Target Settings</h3>

              <FormField
                control={form.control}
                name="params.target_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Group</FormLabel>
                    <FormControl>
                      <Input placeholder="AMC" {...field} />
                    </FormControl>
                    <FormDescription>
                      Client type or group to target (e.g., "AMC", "Lender", "all_clients")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="params.batch_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of contacts to process per batch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Cadence */}
            <div className="space-y-4">
              <h3 className="font-semibold">Email Cadence</h3>
              <p className="text-sm text-muted-foreground">
                Select which days to send follow-up emails
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="params.cadence.day0"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Day 0 - Initial Contact</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="params.cadence.day4"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Day 4 - Follow-up</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="params.cadence.day10"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Day 10 - Second Follow-up</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="params.cadence.day21"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Day 21 - Final Follow-up</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Email Templates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Email Templates</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTemplate}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>

              {templates.map((template, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Template name (e.g., intro)"
                      value={template.name}
                      onChange={(e) => updateTemplate(index, 'name', e.target.value)}
                      className="max-w-xs"
                    />
                    {templates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTemplate(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Subject: Quick profile check"
                    value={template.subject}
                    onChange={(e) => updateTemplate(index, 'subject', e.target.value)}
                  />

                  <Textarea
                    placeholder="Hi {{first_name}},&#10;&#10;I'm reaching out to verify your company profile is up to date...&#10;&#10;Use {{first_name}}, {{last_name}}, {{company_name}} for variables"
                    value={template.body}
                    onChange={(e) => updateTemplate(index, 'body', e.target.value)}
                    rows={5}
                  />

                  <p className="text-xs text-muted-foreground">
                    Available variables: {'{{'}}first_name{'}}'}, {'{{'}}last_name{'}}'}, {'{{'}}company_name{'}}'}}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-4">
              <h3 className="font-semibold">Options</h3>

              <FormField
                control={form.control}
                name="params.review_mode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Review Mode</FormLabel>
                      <FormDescription>
                        Require manual approval before sending emails
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="params.stop_on_error"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Stop on Error</FormLabel>
                      <FormDescription>
                        Pause the job if any errors occur
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createJob.isPending}>
                {createJob.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Job
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
