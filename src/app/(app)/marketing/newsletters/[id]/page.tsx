'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Plus, Mail, Calendar, Users, FileText,
  Send, Clock, CheckCircle2, Edit
} from 'lucide-react';
import { Newsletter, NewsletterIssue } from '@/lib/types/marketing';

export default function NewsletterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsletterId = params.id as string;

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsletterRes, issuesRes] = await Promise.all([
          fetch(`/api/marketing/newsletters/${newsletterId}`),
          fetch(`/api/marketing/newsletters/${newsletterId}/issues`),
        ]);

        const [newsletterData, issuesData] = await Promise.all([
          newsletterRes.json(),
          issuesRes.json(),
        ]);

        setNewsletter(newsletterData.newsletter);
        setIssues(issuesData.issues || []);
      } catch (error) {
        console.error('Error loading newsletter:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [newsletterId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Newsletter not found</p>
        <Button className="mt-4" onClick={() => router.push('/marketing/newsletters')}>
          Back to Newsletters
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
            onClick={() => router.push('/marketing/newsletters')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{newsletter.name}</h1>
              <Badge variant={newsletter.isActive ? 'default' : 'secondary'}>
                {newsletter.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {newsletter.description || `${newsletter.frequency.replace('_', ' ')} newsletter`}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/marketing/newsletters/${newsletterId}/issues/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Issue
          </Link>
        </Button>
      </div>

      {/* Newsletter Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequency</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {newsletter.frequency.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Audience</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsletter.targetRoleCategories?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Audience segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
            <p className="text-xs text-muted-foreground">
              {issues.filter(i => i.status === 'sent').length} sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audience Details */}
      {newsletter.targetRoleCategories && newsletter.targetRoleCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audience Targeting</CardTitle>
            <CardDescription>Who receives this newsletter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {newsletter.targetRoleCategories.map((category) => (
                <Badge key={category} variant="secondary" className="capitalize">
                  {category.replace('_', ' ')}
                </Badge>
              ))}
            </div>
            {newsletter.targetRoleCodes && newsletter.targetRoleCodes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Specific Roles:</p>
                <div className="flex flex-wrap gap-2">
                  {newsletter.targetRoleCodes.map((code) => (
                    <Badge key={code} variant="outline">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Issues</CardTitle>
          <CardDescription>
            All issues for this newsletter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No issues yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first newsletter issue to get started
              </p>
              <Button asChild>
                <Link href={`/marketing/newsletters/${newsletterId}/issues/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Issue
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(issue.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{issue.subject}</h4>
                        {getStatusBadge(issue.status)}
                      </div>
                      {issue.introText && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {issue.introText}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {issue.scheduledFor && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(issue.scheduledFor).toLocaleDateString()}
                          </div>
                        )}
                        {issue.sentAt && (
                          <div className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            Sent {new Date(issue.sentAt).toLocaleDateString()}
                          </div>
                        )}
                        {issue.metrics && (
                          <>
                            <span>
                              {issue.metrics.sent?.toLocaleString()} sent
                            </span>
                            {issue.metrics.opened !== undefined && (
                              <span>
                                {((issue.metrics.opened / (issue.metrics.sent || 1)) * 100).toFixed(1)}% opened
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
