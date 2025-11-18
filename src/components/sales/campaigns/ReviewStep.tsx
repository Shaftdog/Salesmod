"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Mail, Users, Settings, Send, AlertTriangle } from 'lucide-react';
import { replaceMergeTokens } from '@/lib/campaigns/merge-tokens';

interface ReviewStepProps {
  formData: any;
}

const SAMPLE_DATA = {
  first_name: 'John',
  last_name: 'Smith',
  company_name: 'Acme Appraisals',
  last_order_date: '2024-08-15',
  days_since_last_order: 90,
};

export function ReviewStep({ formData }: ReviewStepProps) {
  const [sendingTest, setSendingTest] = useState(false);

  async function sendTestEmail() {
    setSendingTest(true);
    try {
      const response = await fetch('/api/campaigns/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.email_subject,
          body: formData.email_body,
        }),
      });

      if (!response.ok) throw new Error('Failed to send test email');

      alert('Test email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Failed to send test email. Please try again.');
    } finally {
      setSendingTest(false);
    }
  }

  const previewSubject = replaceMergeTokens(formData.email_subject, SAMPLE_DATA);
  const previewBody = replaceMergeTokens(formData.email_body, SAMPLE_DATA);

  // Mock recipient count - in real app, would come from API
  const estimatedRecipients = 150;
  const isLargeSend = estimatedRecipients > 200;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Audience</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{estimatedRecipients}</p>
            <p className="text-xs text-muted-foreground mt-1">recipients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Send Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formData.send_rate_per_hour}</p>
            <p className="text-xs text-muted-foreground mt-1">emails/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Start Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {formData.start_at
                ? new Date(formData.start_at).toLocaleString()
                : 'Immediately'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
            <p className="text-lg font-semibold">{formData.name}</p>
          </div>

          {formData.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </p>
              <p className="text-sm">{formData.description}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Target Filters
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.target_segment?.filters?.client_types?.map(
                (type: string) => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                )
              )}
              {formData.target_segment?.filters?.last_order_days_ago_min && (
                <Badge variant="outline">
                  Last order ≥{' '}
                  {formData.target_segment.filters.last_order_days_ago_min} days ago
                </Badge>
              )}
              {formData.target_segment?.filters?.last_order_days_ago_max && (
                <Badge variant="outline">
                  Last order ≤{' '}
                  {formData.target_segment.filters.last_order_days_ago_max} days ago
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                Sample email with merge tokens replaced
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestEmail}
              disabled={sendingTest}
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendingTest ? 'Sending...' : 'Send Test to Me'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg border">
            <div className="mb-4 pb-4 border-b">
              <p className="text-xs text-muted-foreground mb-1">Subject:</p>
              <p className="font-semibold">{previewSubject}</p>
            </div>
            <div className="whitespace-pre-wrap text-sm">{previewBody}</div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {isLargeSend && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Large Send Warning:</strong> You're about to send to{' '}
            {estimatedRecipients} recipients. This action cannot be undone. Are you sure
            you want to proceed?
          </AlertDescription>
        </Alert>
      )}

      {/* Pre-Launch Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Launch Checklist</CardTitle>
          <CardDescription>Review before launching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Email content reviewed</p>
                <p className="text-sm text-muted-foreground">
                  Subject and body look professional and error-free
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Target audience confirmed</p>
                <p className="text-sm text-muted-foreground">
                  {estimatedRecipients} recipients match your criteria
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Suppression list active</p>
                <p className="text-sm text-muted-foreground">
                  Unsubscribed contacts will be automatically excluded
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Rate limiting configured</p>
                <p className="text-sm text-muted-foreground">
                  Sending {formData.send_rate_per_hour} emails/hour to avoid spam
                  filters
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Response tracking enabled</p>
                <p className="text-sm text-muted-foreground">
                  AI will classify all replies and create follow-up tasks
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Warning */}
      <Alert>
        <AlertDescription>
          <strong>Ready to launch?</strong> Click "Create Campaign" to finalize and
          launch this campaign. Emails will{' '}
          {formData.start_at ? 'start sending at the scheduled time' : 'begin sending immediately'}.
        </AlertDescription>
      </Alert>
    </div>
  );
}
