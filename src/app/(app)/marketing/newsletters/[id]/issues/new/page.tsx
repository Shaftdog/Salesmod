'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Plus, Trash2, GripVertical, FileText, Code,
  Eye, Send, Calendar, Save
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentBlock {
  type: 'content' | 'custom';
  contentId?: string;
  html?: string;
  order: number;
  // For display purposes
  title?: string;
  preview?: string;
}

interface MarketingContent {
  id: string;
  title: string;
  contentType: string;
  body: {
    short?: string;
    medium?: string;
    long?: string;
    html?: string;
  };
  status: string;
}

interface Newsletter {
  id: string;
  name: string;
}

export default function NewNewsletterIssuePage() {
  const router = useRouter();
  const params = useParams();
  const newsletterId = params.id as string;

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [subject, setSubject] = useState('');
  const [introText, setIntroText] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [availableContent, setAvailableContent] = useState<MarketingContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customHtml, setCustomHtml] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  // Load newsletter and available content
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsletterRes, contentRes] = await Promise.all([
          fetch(`/api/marketing/newsletters/${newsletterId}`),
          fetch('/api/marketing/content?status=published'),
        ]);

        const [newsletterData, contentData] = await Promise.all([
          newsletterRes.json(),
          contentRes.json(),
        ]);

        setNewsletter(newsletterData.newsletter);
        setAvailableContent(contentData.content || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load newsletter data');
      }
    };

    fetchData();
  }, [newsletterId]);

  const addContentBlock = (content: MarketingContent) => {
    const newBlock: ContentBlock = {
      type: 'content',
      contentId: content.id,
      order: contentBlocks.length,
      title: content.title,
      preview: content.body.medium || content.body.short || content.body.html?.substring(0, 200),
    };

    setContentBlocks([...contentBlocks, newBlock]);
  };

  const addCustomBlock = () => {
    if (!customHtml.trim()) {
      toast.error('Please enter HTML content');
      return;
    }

    const newBlock: ContentBlock = {
      type: 'custom',
      html: customHtml,
      order: contentBlocks.length,
      preview: customHtml.substring(0, 200),
    };

    setContentBlocks([...contentBlocks, newBlock]);
    setCustomHtml('');
  };

  const removeBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    newBlocks.forEach((block, i) => {
      block.order = i;
    });
    setContentBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    newBlocks.forEach((block, i) => {
      block.order = i;
    });
    setContentBlocks(newBlocks);
  };

  const saveDraft = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/marketing/newsletters/${newsletterId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          introText,
          contentBlocks: contentBlocks.map(({ title, preview, ...block }) => block),
          scheduledFor: scheduledFor || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save newsletter issue');
      }

      toast.success('Newsletter issue saved as draft');
      router.push(`/marketing/newsletters/${newsletterId}`);
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter issue');
    } finally {
      setLoading(false);
    }
  };

  const sendNow = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (contentBlocks.length === 0) {
      toast.error('Add at least one content block');
      return;
    }

    setLoading(true);
    try {
      // First create the issue
      const createResponse = await fetch(`/api/marketing/newsletters/${newsletterId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          introText,
          contentBlocks: contentBlocks.map(({ title, preview, ...block }) => block),
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create newsletter issue');
      }

      const { issue } = await createResponse.json();

      // TODO: Implement send functionality
      // This would trigger the email campaign service
      toast.success('Newsletter sent successfully!');
      router.push(`/marketing/newsletters/${newsletterId}`);
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    let html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">${subject}</h1>
    `;

    if (introText) {
      html += `<p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${introText}</p>`;
    }

    contentBlocks.forEach((block) => {
      if (block.type === 'custom') {
        html += `<div style="margin-bottom: 24px;">${block.html}</div>`;
      } else if (block.type === 'content' && block.preview) {
        html += `
          <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            ${block.title ? `<h3 style="color: #333; font-size: 18px; margin-top: 0;">${block.title}</h3>` : ''}
            <div style="color: #666; font-size: 14px; line-height: 1.6;">${block.preview}</div>
          </div>
        `;
      }
    });

    html += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; text-align: center;">
          <p>You're receiving this because you subscribed to ${newsletter?.name || 'our newsletter'}.</p>
          <p><a href="#" style="color: #999;">Unsubscribe</a></p>
        </div>
      </div>
    `;

    return html;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/marketing/newsletters/${newsletterId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Newsletter Issue</h1>
            {newsletter && (
              <p className="text-muted-foreground">{newsletter.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={sendNow} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            Send Now
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject & Intro */}
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intro">Introduction Text (optional)</Label>
                <Textarea
                  id="intro"
                  placeholder="Brief intro text that appears at the top of the email..."
                  rows={3}
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled">Schedule For (optional)</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Blocks */}
          <Card>
            <CardHeader>
              <CardTitle>Content Blocks</CardTitle>
              <CardDescription>
                Add and arrange content for your newsletter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contentBlocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No content blocks added yet</p>
                  <p className="text-sm">Use the sidebar to add content</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contentBlocks.map((block, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveBlockUp(index)}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={block.type === 'content' ? 'default' : 'secondary'}>
                            {block.type === 'content' ? (
                              <>
                                <FileText className="h-3 w-3 mr-1" />
                                Content
                              </>
                            ) : (
                              <>
                                <Code className="h-3 w-3 mr-1" />
                                Custom HTML
                              </>
                            )}
                          </Badge>
                          {block.title && (
                            <span className="font-medium">{block.title}</span>
                          )}
                        </div>
                        {block.preview && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {block.preview}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBlockUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBlockDown(index)}
                          disabled={index === contentBlocks.length - 1}
                          className="h-8 w-8"
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBlock(index)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Add Content */}
        <div className="space-y-6">
          {/* Add from Content Library */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add from Library</CardTitle>
              <CardDescription>Select published content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableContent.length > 0 ? (
                availableContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => addContentBlock(content)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{content.title}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {content.contentType}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        addContentBlock(content);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No published content available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Custom HTML */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Custom HTML</CardTitle>
              <CardDescription>Insert custom HTML block</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="<div>Your HTML here...</div>"
                rows={6}
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={addCustomBlock}
                disabled={!customHtml.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add HTML Block
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Newsletter Preview</DialogTitle>
            <DialogDescription>
              Preview how your newsletter will appear to recipients
            </DialogDescription>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: generatePreview() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
