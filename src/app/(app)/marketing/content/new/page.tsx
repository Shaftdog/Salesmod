'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, FileText, Hash, Target } from 'lucide-react';
import { toast } from 'sonner';
import { CreateContentInput, ContentType, FunnelStage } from '@/lib/types/marketing';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'email', label: 'Email' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'market_update', label: 'Market Update' },
  { value: 'educational', label: 'Educational' },
];

const FUNNEL_STAGES: { value: FunnelStage; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'retention', label: 'Retention' },
];

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateContentInput>({
    title: '',
    contentType: 'blog',
    body: {
      short: '',
      medium: '',
      long: '',
      html: '',
    },
    previewText: '',
    featuredImageUrl: '',
    audienceTags: [],
    themeTags: [],
    funnelStage: undefined,
  });
  const [tagInput, setTagInput] = useState('');
  const [themeInput, setThemeInput] = useState('');

  const addTag = (type: 'audience' | 'theme') => {
    const input = type === 'audience' ? tagInput : themeInput;
    if (!input.trim()) return;

    if (type === 'audience') {
      setFormData({
        ...formData,
        audienceTags: [...(formData.audienceTags || []), input.trim()],
      });
      setTagInput('');
    } else {
      setFormData({
        ...formData,
        themeTags: [...(formData.themeTags || []), input.trim()],
      });
      setThemeInput('');
    }
  };

  const removeTag = (type: 'audience' | 'theme', tag: string) => {
    if (type === 'audience') {
      setFormData({
        ...formData,
        audienceTags: formData.audienceTags?.filter((t) => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        themeTags: formData.themeTags?.filter((t) => t !== tag),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Check if at least one body format is provided
    const hasContent =
      formData.body.short?.trim() ||
      formData.body.medium?.trim() ||
      formData.body.long?.trim() ||
      formData.body.html?.trim();

    if (!hasContent) {
      toast.error('At least one content format is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketing/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create content');
      }

      const { content } = await response.json();
      toast.success('Content created successfully');
      router.push(`/marketing/content/${content.id}`);
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const getCharCount = (format: 'short' | 'medium' | 'long' | 'html') => {
    return formData.body[format]?.length || 0;
  };

  const getCharLimit = (format: 'short' | 'medium' | 'long' | 'html') => {
    switch (format) {
      case 'short':
        return 280;
      case 'medium':
        return 2200;
      case 'long':
      case 'html':
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/marketing/content')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Content</h1>
          <p className="text-muted-foreground">
            Multi-format content for all marketing channels
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Define the content title, type, and preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Content title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type *</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value: ContentType) =>
                    setFormData({ ...formData, contentType: value })
                  }
                >
                  <SelectTrigger id="contentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview">Preview Text</Label>
              <Textarea
                id="preview"
                placeholder="Brief preview or excerpt..."
                rows={2}
                value={formData.previewText}
                onChange={(e) =>
                  setFormData({ ...formData, previewText: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Featured Image URL</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://..."
                value={formData.featuredImageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, featuredImageUrl: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Multi-Format Content Body */}
        <Card>
          <CardHeader>
            <CardTitle>Content Body *</CardTitle>
            <CardDescription>
              Create multiple formats for different channels (at least one required)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="short" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="short">
                  Short
                  {formData.body.short && (
                    <Badge variant="secondary" className="ml-2">
                      {getCharCount('short')}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="medium">
                  Medium
                  {formData.body.medium && (
                    <Badge variant="secondary" className="ml-2">
                      {getCharCount('medium')}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="long">
                  Long
                  {formData.body.long && (
                    <Badge variant="secondary" className="ml-2">
                      {getCharCount('long')}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="html">
                  HTML
                  {formData.body.html && (
                    <Badge variant="secondary" className="ml-2">
                      {getCharCount('html')}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="short" className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Twitter/X, TikTok captions (280 chars max)</span>
                  <span
                    className={
                      getCharCount('short') > 280 ? 'text-destructive' : ''
                    }
                  >
                    {getCharCount('short')} / 280
                  </span>
                </div>
                <Textarea
                  placeholder="Short-form content (280 characters)..."
                  rows={4}
                  value={formData.body.short}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      body: { ...formData.body, short: e.target.value },
                    })
                  }
                  maxLength={280}
                />
              </TabsContent>

              <TabsContent value="medium" className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Instagram, Facebook (2200 chars max)</span>
                  <span
                    className={
                      getCharCount('medium') > 2200 ? 'text-destructive' : ''
                    }
                  >
                    {getCharCount('medium')} / 2200
                  </span>
                </div>
                <Textarea
                  placeholder="Medium-form content (2200 characters)..."
                  rows={8}
                  value={formData.body.medium}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      body: { ...formData.body, medium: e.target.value },
                    })
                  }
                  maxLength={2200}
                />
              </TabsContent>

              <TabsContent value="long" className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  LinkedIn, Blog, Substack (full article)
                </div>
                <Textarea
                  placeholder="Long-form content (no limit)..."
                  rows={16}
                  value={formData.body.long}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      body: { ...formData.body, long: e.target.value },
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="html" className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Email, Blog HTML formatted content
                </div>
                <Textarea
                  placeholder="<div>HTML formatted content...</div>"
                  rows={16}
                  value={formData.body.html}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      body: { ...formData.body, html: e.target.value },
                    })
                  }
                  className="font-mono text-sm"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Metadata & Targeting */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Audience Tags */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <CardTitle className="text-base">Audience Tags</CardTitle>
              </div>
              <CardDescription>
                Target specific audience segments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('audience');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag('audience')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.audienceTags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag('audience', tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme Tags */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <CardTitle className="text-base">Theme Tags</CardTitle>
              </div>
              <CardDescription>
                Organize by topic or theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add theme..."
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('theme');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag('theme')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.themeTags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag('theme', tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel Stage</CardTitle>
            <CardDescription>
              Where does this content fit in the buyer journey?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.funnelStage}
              onValueChange={(value: FunnelStage) =>
                setFormData({ ...formData, funnelStage: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funnel stage..." />
              </SelectTrigger>
              <SelectContent>
                {FUNNEL_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/marketing/content')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Content'}
          </Button>
        </div>
      </form>
    </div>
  );
}
