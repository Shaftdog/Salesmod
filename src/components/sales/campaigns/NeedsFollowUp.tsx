"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Mail } from 'lucide-react';
import { DISPOSITION_LABELS } from '@/lib/campaigns/types';

interface NeedsFollowUpProps {
  contacts: Array<{
    email_address: string;
    last_disposition: string;
    last_reply_at: string;
    open_tasks_count: number;
  }>;
}

export function NeedsFollowUp({ contacts }: NeedsFollowUpProps) {
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  function getDispositionBadge(disposition: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NO_ACTIVE_PROFILE: 'destructive',
      NEEDS_MORE_INFO: 'default',
      ESCALATE_UNCLEAR: 'outline',
    };

    const label = DISPOSITION_LABELS[disposition as keyof typeof DISPOSITION_LABELS] || disposition;

    return (
      <Badge variant={variants[disposition] || 'secondary'}>
        {label}
      </Badge>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs Follow-Up</CardTitle>
          <CardDescription>
            Contacts that require follow-up action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <AlertCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              All caught up!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              No contacts currently need follow-up
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Needs Follow-Up</CardTitle>
            <CardDescription>
              {contacts.length} {contacts.length === 1 ? 'contact requires' : 'contacts require'} follow-up action
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {contacts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.map((contact, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{contact.email_address}</p>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Disposition:</span>
                  {getDispositionBadge(contact.last_disposition)}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Last reply: {formatDate(contact.last_reply_at)}</span>
                  <span>•</span>
                  <span>
                    {contact.open_tasks_count} open{' '}
                    {contact.open_tasks_count === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>

              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Tasks
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
