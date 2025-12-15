'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob, useUpdateJob } from '@/hooks/use-jobs';
import { Job } from '@/types/jobs';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { CreateJobRequestSchema } from '@/types/jobs';
import { PartyRoleCode, getRoleLabel } from '@/lib/roles/mapPartyRole';

type CreateJobFormData = z.infer<typeof CreateJobRequestSchema>;

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null; // Optional job for edit mode
}

// All available role codes for contact targeting
const ALL_ROLE_CODES: PartyRoleCode[] = [
  'mortgage_lender',
  'loan_officer',
  'qm_lender_contact',
  'non_qm_lender_contact',
  'private_lender',
  'investor',
  'accredited_investor',
  'real_estate_investor',
  'short_term_re_investor',
  'long_term_re_investor',
  'registered_investment_advisor',
  'fund_manager',
  'co_gp',
  'realtor',
  'real_estate_broker',
  'real_estate_dealer',
  'wholesaler',
  'buyer',
  'seller',
  'owner',
  'builder',
  'general_contractor',
  'attorney',
  'real_estate_attorney',
  'estate_attorney',
  'family_attorney',
  'accountant',
  'ira_custodian_contact',
  'amc_contact',
  'amc_billing_contact',
  'gse',
  'vendor',
  'personal',
  'staff',
];

export function JobFormDialog({ open, onOpenChange, job }: JobFormDialogProps) {
  const isEditMode = !!job;
  const createJob = useCreateJob();
  const updateJob = useUpdateJob(job?.id || '');
  const [templates, setTemplates] = useState<Array<{ name: string; subject: string; body: string }>>([
    { name: 'intro', subject: '', body: '' },
  ]);

  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(CreateJobRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      params: {
        target_type: 'contacts',
        target_group: 'all_clients',
        target_filter: {
          target_role_codes: [],
        },
        cadence: {
          day0: true,
          day4: false,
          day10: false,
          day21: false,
        },
        review_mode: true,
        edit_mode: false,
        bulk_mode: false,
        batch_size: 10,
        auto_approve: false,
        stop_on_error: false,
        portal_checks: false,
        create_tasks: false,
      },
    },
  });

  // Populate form when editing an existing job
  useEffect(() => {
    if (job && open) {
      form.reset({
        name: job.name,
        description: job.description || '',
        params: job.params,
      });

      // Populate templates from job.params.templates
      if (job.params.templates) {
        const templateArray = Object.entries(job.params.templates).map(([name, template]) => ({
          name,
          subject: template.subject,
          body: template.body,
        }));
        setTemplates(templateArray.length > 0 ? templateArray : [{ name: 'intro', subject: '', body: '' }]);
      } else {
        setTemplates([{ name: 'intro', subject: '', body: '' }]);
      }
    } else if (!open) {
      // Reset form when dialog closes
      form.reset();
      setTemplates([{ name: 'intro', subject: '', body: '' }]);
    }
  }, [job, open, form]);

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

    if (isEditMode) {
      await updateJob.mutateAsync(jobData);
    } else {
      await createJob.mutateAsync(jobData);
    }

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
          <DialogTitle>{isEditMode ? 'Edit Job' : 'Create New Job'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your campaign settings, templates, and target audience.'
              : 'Set up a multi-step campaign with automated email outreach and follow-ups.'}
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
                name="params.target_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contacts">
                          Contacts - Target individual people
                        </SelectItem>
                        <SelectItem value="clients">
                          Clients - Target companies
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether to target individual contacts or companies
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      Filter name or description (e.g., "AMC", "Lender", "all_clients")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="params.target_filter.target_role_codes"
                render={({ field }) => {
                  const selectedCount = field.value?.length || 0;

                  return (
                    <FormItem>
                      <FormLabel>
                        Target Roles (Optional)
                        {selectedCount > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({selectedCount} selected)
                          </span>
                        )}
                      </FormLabel>
                      <FormDescription>
                        Select specific contact roles to target. Leave empty to target all roles.
                      </FormDescription>
                      <div className="mt-2 border rounded-lg p-3 max-h-64 overflow-y-auto bg-background">
                        <div className="space-y-2">
                          {ALL_ROLE_CODES.map((roleCode) => (
                            <div key={roleCode} className="flex items-center space-x-2 hover:bg-accent/50 rounded p-2 transition-colors">
                              <Checkbox
                                id={`role-${roleCode}`}
                                checked={field.value?.includes(roleCode) || false}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValues, roleCode]);
                                  } else {
                                    field.onChange(currentValues.filter((v) => v !== roleCode));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`role-${roleCode}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {getRoleLabel(roleCode)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                    Available variables: {'{{first_name}}, {{last_name}}, {{company_name}}'}
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
                name="params.edit_mode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Edit Mode</FormLabel>
                      <FormDescription>
                        Allow editing email content before approval
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
                name="params.bulk_mode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Bulk Mode</FormLabel>
                      <FormDescription>
                        Process all contacts in batches, ignoring cadence limits
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
              <Button type="submit" disabled={isEditMode ? updateJob.isPending : createJob.isPending}>
                {(isEditMode ? updateJob.isPending : createJob.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEditMode ? 'Update Job' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
