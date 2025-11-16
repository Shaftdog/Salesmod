'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Image, Video, Podcast, Mail, Filter } from 'lucide-react';
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
import { MarketingContent, ContentType } from '@/lib/types/marketing';

const CONTENT_TYPE_ICONS: Record<ContentType, any> = {
  'blog': FileText,
  'social_post': Image,
  'email': Mail,
  'case_study': FileText,
  'testimonial': FileText,
  'market_update': FileText,
  'educational': FileText,
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'blog': 'Blog Post',
  'social_post': 'Social Post',
  'email': 'Email',
  'case_study': 'Case Study',
  'testimonial': 'Testimonial',
  'market_update': 'Market Update',
  'educational': 'Educational',
};

export default function ContentLibraryPage() {
  const [content, setContent] = useState<MarketingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchContent() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (typeFilter !== 'all') params.append('contentType', typeFilter);

        const response = await fetch(`/api/marketing/content?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || []);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'archived':
        return <Badge>Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatBadges = (body: any) => {
    const formats = [];
    if (body?.short) formats.push('Short');
    if (body?.medium) formats.push('Medium');
    if (body?.long) formats.push('Long');
    if (body?.html) formats.push('HTML');
    return formats;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">
            Multi-format content for all your marketing channels
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/content/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Content
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
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

      {/* Content Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      ) : content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first piece of multi-format content
            </p>
            <Button asChild>
              <Link href="/marketing/content/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Content
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => {
            const Icon = CONTENT_TYPE_ICONS[item.contentType] || FileText;
            const formats = getFormatBadges(item.body);

            return (
              <Link key={item.id} href={`/marketing/content/${item.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="line-clamp-2 text-base">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {CONTENT_TYPE_LABELS[item.contentType]}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.previewText && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.previewText}
                      </p>
                    )}

                    {/* Format Badges */}
                    {formats.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formats.map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {item.audienceTags && item.audienceTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.audienceTags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.audienceTags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.audienceTags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Featured Image */}
                    {item.featuredImageUrl && (
                      <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                        <img
                          src={item.featuredImageUrl}
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.funnelStage && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.funnelStage.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
