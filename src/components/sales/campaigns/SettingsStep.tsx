"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, Clock, Send } from 'lucide-react';
import { useState } from 'react';

interface SettingsStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export function SettingsStep({ formData, updateFormData }: SettingsStepProps) {
  const [scheduleEnabled, setScheduleEnabled] = useState(!!formData.start_at);

  function toggleSchedule(enabled: boolean) {
    setScheduleEnabled(enabled);
    if (!enabled) {
      updateFormData({ start_at: undefined });
    } else {
      // Set default to tomorrow at 9am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      updateFormData({ start_at: tomorrow.toISOString().slice(0, 16) });
    }
  }

  function calculateEstimatedTime(totalRecipients: number, ratePerHour: number): string {
    if (totalRecipients === 0 || ratePerHour === 0) return 'N/A';

    const hours = totalRecipients / ratePerHour;
    if (hours < 1) {
      return `${Math.ceil(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else {
      return `${(hours / 24).toFixed(1)} days`;
    }
  }

  // Mock recipient count - in real app, would come from audience preview
  const estimatedRecipients = 150; // TODO: Get from audience preview

  return (
    <div className="space-y-6">
      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <CardTitle>Send Rate Limiting</CardTitle>
          </div>
          <CardDescription>
            Control how fast emails are sent to avoid spam filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="send_rate">Emails per Hour</Label>
              <Input
                id="send_rate"
                type="number"
                min="1"
                max="500"
                value={formData.send_rate_per_hour}
                onChange={(e) =>
                  updateFormData({
                    send_rate_per_hour: parseInt(e.target.value) || 75,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50-100 per hour
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_size">Batch Size</Label>
              <Input
                id="batch_size"
                type="number"
                min="1"
                max="100"
                value={formData.send_batch_size}
                onChange={(e) =>
                  updateFormData({
                    send_batch_size: parseInt(e.target.value) || 25,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Emails processed per execution
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Estimated Recipients</p>
                <p className="text-2xl font-bold">{estimatedRecipients}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Estimated Time</p>
                <p className="text-2xl font-bold">
                  {calculateEstimatedTime(
                    estimatedRecipients,
                    formData.send_rate_per_hour
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1 text-muted-foreground">
            <p>
              <strong>Why rate limiting?</strong> Sending too many emails too quickly can:
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Trigger spam filters</li>
              <li>Get your domain blacklisted</li>
              <li>Lower deliverability rates</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Schedule Campaign</CardTitle>
          </div>
          <CardDescription>
            Choose when to start sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="schedule-toggle">Schedule for later</Label>
              <p className="text-xs text-muted-foreground">
                If disabled, campaign starts immediately after launch
              </p>
            </div>
            <Switch
              id="schedule-toggle"
              checked={scheduleEnabled}
              onCheckedChange={toggleSchedule}
            />
          </div>

          {scheduleEnabled && (
            <div className="space-y-2">
              <Label htmlFor="start_at">Start Date & Time</Label>
              <Input
                id="start_at"
                type="datetime-local"
                value={formData.start_at?.slice(0, 16) || ''}
                onChange={(e) => updateFormData({ start_at: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Campaign will start sending at this time
              </p>
            </div>
          )}

          {!scheduleEnabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Immediate Start:</strong> Emails will begin sending as soon as you launch
                the campaign, respecting the rate limit above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Notice */}
      <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-900 dark:text-yellow-100">
            Important Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-yellow-900 dark:text-yellow-100">
          <ul className="list-disc list-inside space-y-1">
            <li>Emails in the suppression list will be automatically excluded</li>
            <li>All merge tokens will be replaced with actual recipient data</li>
            <li>You can pause the campaign at any time from the dashboard</li>
            <li>
              Response tracking and AI classification will begin once emails are sent
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
