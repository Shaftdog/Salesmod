'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Video, Calendar, Clock, Users, ExternalLink,
  UserPlus, CheckCircle2, XCircle, Mail, Download
} from 'lucide-react';
import { toast } from 'sonner';

interface Webinar {
  id: string;
  title: string;
  description?: string;
  presenterName?: string;
  presenterTitle?: string;
  scheduledAt: string;
  durationMinutes: number;
  webinarUrl?: string;
  recordingUrl?: string;
  status: string;
  maxAttendees?: number;
  sendConfirmationEmail: boolean;
  sendReminderEmail: boolean;
  sendFollowupEmail: boolean;
}

interface Registration {
  id: string;
  contactId: string;
  registeredAt: string;
  attended: boolean;
  attendedAt?: string;
  contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    company_name?: string;
  };
}

interface Stats {
  totalRegistrations: number;
  totalAttended: number;
  attendanceRate: number;
  avgDuration: number;
}

export default function WebinarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const webinarId = params.id as string;

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    fetchWebinarDetails();
    fetchRegistrations();
  }, [webinarId]);

  async function fetchWebinarDetails() {
    try {
      const response = await fetch(`/api/marketing/webinars/${webinarId}`);
      if (response.ok) {
        const data = await response.json();
        setWebinar(data.webinar);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching webinar:', error);
      toast.error('Failed to load webinar');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegistrations() {
    try {
      const response = await fetch(`/api/marketing/webinars/${webinarId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  }

  const handleAddRegistration = async () => {
    if (!contactEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    // In a real app, you'd search for the contact by email first
    // For now, we'll show a message
    toast.info('Manual registration feature coming soon. Use the API or contact import.');
    setShowAddDialog(false);
    setContactEmail('');
  };

  const handleToggleAttendance = async (registrationId: string, currentlyAttended: boolean) => {
    // TODO: Implement attendance toggle API call
    toast.info('Attendance tracking feature ready for backend integration');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Webinar not found</p>
        <Button className="mt-4" onClick={() => router.push('/marketing/webinars')}>
          Back to Webinars
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/marketing/webinars')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{webinar.title}</h1>
              <Badge>{webinar.status}</Badge>
            </div>
            {webinar.presenterName && (
              <p className="text-muted-foreground mt-1">
                by {webinar.presenterName}
                {webinar.presenterTitle && ` • ${webinar.presenterTitle}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {webinar.webinarUrl && (
            <Button variant="outline" asChild>
              <a href={webinar.webinarUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Webinar
              </a>
            </Button>
          )}
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Registration
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              {webinar.maxAttendees && (
                <p className="text-xs text-muted-foreground">
                  of {webinar.maxAttendees} max
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attended</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttended}</div>
              <p className="text-xs text-muted-foreground">
                {stats.attendanceRate.toFixed(1)}% attendance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avgDuration)}</div>
              <p className="text-xs text-muted-foreground">minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Automation</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 text-xs">
                {webinar.sendConfirmationEmail && <span>✓ Confirmation</span>}
                {webinar.sendReminderEmail && <span>✓ Reminder</span>}
                {webinar.sendFollowupEmail && <span>✓ Follow-up</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webinar Details */}
      <Card>
        <CardHeader>
          <CardTitle>Webinar Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {webinar.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{webinar.description}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(webinar.scheduledAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(webinar.scheduledAt)} ({webinar.durationMinutes} min)
                </p>
              </div>
            </div>
          </div>

          {webinar.recordingUrl && (
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Recording Available</p>
                <a
                  href={webinar.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Watch Recording →
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrations ({registrations.length})</CardTitle>
              <CardDescription>Manage attendee list and track attendance</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No registrations yet</p>
              <p className="text-sm mt-2">Add registrations to track attendance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={reg.attended}
                      onCheckedChange={() => handleToggleAttendance(reg.id, reg.attended)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {reg.contact?.first_name} {reg.contact?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{reg.contact?.email}</p>
                      {reg.contact?.company_name && (
                        <p className="text-xs text-muted-foreground">{reg.contact?.company_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Registered</p>
                      <p className="font-medium">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                    {reg.attended ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Attended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        No Show
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Registration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Registration</DialogTitle>
            <DialogDescription>
              Register a contact for this webinar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll find the contact by email and register them
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRegistration}>
                Add Registration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
