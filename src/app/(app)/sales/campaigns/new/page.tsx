"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Step components
import { AudienceStep } from '@/components/sales/campaigns/AudienceStep';
import { EmailContentStep } from '@/components/sales/campaigns/EmailContentStep';
import { SettingsStep } from '@/components/sales/campaigns/SettingsStep';
import { ReviewStep } from '@/components/sales/campaigns/ReviewStep';

interface CampaignFormData {
  // Basic info
  name: string;
  description: string;

  // Target segment
  target_segment: {
    type: 'filter' | 'n8n_list';
    filters?: {
      client_types?: string[];
      tags?: string[];
      states?: string[];
      last_order_days_ago_min?: number;
      last_order_days_ago_max?: number;
    };
    n8n_list_id?: string;
  };

  // Email content
  email_subject: string;
  email_body: string;
  email_template_id?: string;
  used_merge_tokens: string[];

  // Settings
  send_rate_per_hour: number;
  send_batch_size: number;
  start_at?: string;
}

const STEPS = [
  { id: 1, name: 'Audience', description: 'Select your target audience' },
  { id: 2, name: 'Email Content', description: 'Compose your email' },
  { id: 3, name: 'Settings', description: 'Configure send settings' },
  { id: 4, name: 'Review', description: 'Review and launch' },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    target_segment: {
      type: 'filter',
      filters: {},
    },
    email_subject: '',
    email_body: '',
    used_merge_tokens: [],
    send_rate_per_hour: 75,
    send_batch_size: 25,
  });

  function updateFormData(updates: Partial<CampaignFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }));
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        // Audience step
        return formData.name.trim().length > 0;
      case 2:
        // Email content step
        return (
          formData.email_subject.trim().length > 0 &&
          formData.email_body.trim().length > 0
        );
      case 3:
        // Settings step
        return (
          formData.send_rate_per_hour > 0 && formData.send_batch_size > 0
        );
      case 4:
        // Review step
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleSubmit() {
    if (!canProceed()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const { campaign } = await response.json();

      toast({
        title: 'Campaign created',
        description: 'Your campaign has been created successfully.',
      });

      router.push(`/sales/campaigns/${campaign.id}`);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/sales/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground">
            Set up a new email re-engagement campaign
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center ${
                  step.id === currentStep
                    ? 'text-primary'
                    : step.id < currentStep
                    ? 'text-green-600'
                    : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="text-sm font-medium">{step.name}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {currentStep === 1 && (
            <AudienceStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <EmailContentStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <SettingsStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 4 && (
            <ReviewStep formData={formData} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || submitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} disabled={!canProceed() || submitting}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
            {submitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        )}
      </div>
    </div>
  );
}
