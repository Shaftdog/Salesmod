'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NewWebinarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    presenterName: '',
    presenterTitle: '',
    scheduledAt: '',
    durationMinutes: 60,
    timezone: 'America/New_York',
    webinarUrl: '',
    maxAttendees: undefined as number | undefined,
    registrationDeadline: '',
    sendConfirmationEmail: true,
    sendReminderEmail: true,
    reminderHoursBefore: 24,
    sendFollowupEmail: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.scheduledAt) {
      toast.error('Scheduled date/time is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketing/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxAttendees: formData.maxAttendees || undefined,
          registrationDeadline: formData.registrationDeadline || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create webinar');
      }

      const { webinar } = await response.json();
      toast.success('Webinar created successfully');
      router.push(`/marketing/webinars/${webinar.id}`);
    } catch (error) {
      console.error('Error creating webinar:', error);
      toast.error('Failed to create webinar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/marketing/webinars')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Webinar</h1>
          <p className="text-muted-foreground">
            Set up a new webinar with registration tracking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Webinar title, description, and presenter details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Real Estate Investing"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what attendees will learn..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="presenterName">Presenter Name</Label>
                <Input
                  id="presenterName"
                  placeholder="John Doe"
                  value={formData.presenterName}
                  onChange={(e) =>
                    setFormData({ ...formData, presenterName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presenterTitle">Presenter Title</Label>
                <Input
                  id="presenterTitle"
                  placeholder="e.g., Real Estate Expert, CEO"
                  value={formData.presenterTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, presenterTitle: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              When the webinar will take place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="America/New_York"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                IANA timezone (e.g., America/New_York, Europe/London)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>
              Webinar link and registration limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webinarUrl">Webinar URL</Label>
              <Input
                id="webinarUrl"
                type="url"
                placeholder="https://zoom.us/..."
                value={formData.webinarUrl}
                onChange={(e) => setFormData({ ...formData, webinarUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Zoom, Google Meet, or other webinar platform link
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={formData.maxAttendees || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAttendees: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationDeadline: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Automation */}
        <Card>
          <CardHeader>
            <CardTitle>Email Automation</CardTitle>
            <CardDescription>
              Automatically send confirmation, reminder, and follow-up emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sendConfirmation">Send Confirmation Email</Label>
                <p className="text-sm text-muted-foreground">
                  Immediately after registration
                </p>
              </div>
              <Switch
                id="sendConfirmation"
                checked={formData.sendConfirmationEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendConfirmationEmail: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sendReminder">Send Reminder Email</Label>
                <p className="text-sm text-muted-foreground">
                  Before the webinar starts
                </p>
              </div>
              <Switch
                id="sendReminder"
                checked={formData.sendReminderEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendReminderEmail: checked })
                }
              />
            </div>

            {formData.sendReminderEmail && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="reminderHours">Hours Before Webinar</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min="1"
                  value={formData.reminderHoursBefore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminderHoursBefore: parseInt(e.target.value) || 24,
                    })
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sendFollowup">Send Follow-up Email</Label>
                <p className="text-sm text-muted-foreground">
                  After the webinar completes
                </p>
              </div>
              <Switch
                id="sendFollowup"
                checked={formData.sendFollowupEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendFollowupEmail: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/marketing/webinars')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Webinar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
