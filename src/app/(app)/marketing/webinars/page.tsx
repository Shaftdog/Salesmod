'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Video, Calendar, Users, Clock, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'outline',
  scheduled: 'default',
  live: 'destructive',
  completed: 'secondary',
  cancelled: 'outline',
};

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  useEffect(() => {
    fetchWebinars();
  }, [statusFilter, timeFilter]);

  async function fetchWebinars() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (timeFilter === 'upcoming') params.append('upcoming', 'true');

      const response = await fetch(`/api/marketing/webinars?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setWebinars(data.webinars || []);
      }
    } catch (error) {
      console.error('Error fetching webinars:', error);
      toast.error('Failed to load webinars');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webinar?')) {
      return;
    }

    try {
      const response = await fetch(`/api/marketing/webinars/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWebinars(webinars.filter((w) => w.id !== id));
        toast.success('Webinar deleted successfully');
      } else {
        throw new Error('Failed to delete webinar');
      }
    } catch (error) {
      console.error('Error deleting webinar:', error);
      toast.error('Failed to delete webinar');
    }
  };

  const isUpcoming = (scheduledAt: string) => {
    return new Date(scheduledAt) > new Date();
  };

  const isPast = (scheduledAt: string) => {
    return new Date(scheduledAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webinars</h1>
          <p className="text-muted-foreground">
            Manage webinars, registrations, and follow-up automation
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/webinars/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Webinar
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <div className="flex gap-3">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Webinars Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : webinars.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webinars yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first webinar to engage with your audience
            </p>
            <Button asChild>
              <Link href="/marketing/webinars/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Webinar
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {webinars.map((webinar) => (
            <Card key={webinar.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="h-4 w-4 flex-shrink-0" />
                      <CardTitle className="line-clamp-1 text-base">
                        {webinar.title}
                      </CardTitle>
                    </div>
                    {webinar.presenterName && (
                      <CardDescription className="line-clamp-1">
                        by {webinar.presenterName}
                        {webinar.presenterTitle && ` • ${webinar.presenterTitle}`}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={STATUS_COLORS[webinar.status] as any}>
                    {STATUS_LABELS[webinar.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {webinar.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {webinar.description}
                  </p>
                )}

                {/* Date & Time */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(webinar.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(webinar.scheduledAt)}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{webinar.durationMinutes} minutes</span>
                </div>

                {/* Max Attendees */}
                {webinar.maxAttendees && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Max {webinar.maxAttendees} attendees</span>
                  </div>
                )}

                {/* Time indicator */}
                {isUpcoming(webinar.scheduledAt) && webinar.status === 'scheduled' && (
                  <Badge variant="default" className="text-xs">
                    Upcoming
                  </Badge>
                )}
                {isPast(webinar.scheduledAt) && webinar.status !== 'completed' && (
                  <Badge variant="outline" className="text-xs">
                    Past Due
                  </Badge>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/marketing/webinars/${webinar.id}`}>
                      <Users className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                  </Button>
                  {webinar.webinarUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={webinar.webinarUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(webinar.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
