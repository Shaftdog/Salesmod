"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Search, Smile, Meh, Frown, Calendar } from 'lucide-react';
import { DISPOSITION_LABELS } from '@/lib/campaigns/types';

interface ResponsesListProps {
  campaignId: string;
}

interface Response {
  id: string;
  email_address: string;
  sentiment: string;
  disposition: string;
  ai_summary: string;
  response_text: string;
  received_at: string;
}

export function ResponsesList({ campaignId }: ResponsesListProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  useEffect(() => {
    fetchResponses();
  }, [campaignId]);

  async function fetchResponses() {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/responses`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch responses');

      const { responses } = await response.json();
      setResponses(responses || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredResponses = responses.filter(
    (r) =>
      r.email_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getSentimentIcon(sentiment: string) {
    switch (sentiment) {
      case 'POSITIVE':
        return <Smile className="h-4 w-4 text-green-600" />;
      case 'NEGATIVE':
        return <Frown className="h-4 w-4 text-red-600" />;
      default:
        return <Meh className="h-4 w-4 text-yellow-600" />;
    }
  }

  function getSentimentBadge(sentiment: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      POSITIVE: 'default',
      NEUTRAL: 'secondary',
      NEGATIVE: 'destructive',
    };

    return (
      <Badge variant={variants[sentiment] || 'secondary'} className="flex items-center gap-1">
        {getSentimentIcon(sentiment)}
        {sentiment.charAt(0) + sentiment.slice(1).toLowerCase()}
      </Badge>
    );
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading responses...</p>
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
          <CardDescription>Email responses from recipients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm font-medium">No responses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Responses will appear here once recipients reply to campaign emails
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Responses List */}
      <Card>
        <CardHeader>
          <CardTitle>All Responses ({filteredResponses.length})</CardTitle>
          <CardDescription>
            Chronological list of email responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredResponses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                No responses match your search
              </p>
            ) : (
              filteredResponses.map((response) => (
                <div
                  key={response.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedResponse(response)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{response.email_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(response.received_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {getSentimentBadge(response.sentiment)}
                    <Badge variant="outline">
                      {DISPOSITION_LABELS[response.disposition as keyof typeof DISPOSITION_LABELS] || response.disposition}
                    </Badge>
                  </div>

                  {response.ai_summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {response.ai_summary}
                    </p>
                  )}

                  {selectedResponse?.id === response.id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Full Response:</p>
                      <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {response.response_text}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
