'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Mail, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  subjectTemplate: string;
  previewText?: string;
  bodyTemplate: string;
  variables?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  newsletter: 'Newsletter',
  campaign: 'Campaign',
  follow_up: 'Follow Up',
  announcement: 'Announcement',
  transactional: 'Transactional',
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== 'all') params.append('category', categoryFilter);

        const response = await fetch(`/api/marketing/email-templates?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/marketing/email-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
        toast.success('Template deleted successfully');
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const getVariableCount = (variables?: Record<string, string>) => {
    return variables ? Object.keys(variables).length : 0;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Reusable email templates with variable support
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/email-templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Templates Grid */}
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
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first email template with variable support
            </p>
            <Button asChild>
              <Link href="/marketing/email-templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <CardTitle className="line-clamp-1 text-base">
                        {template.name}
                      </CardTitle>
                    </div>
                    {template.description && (
                      <CardDescription className="line-clamp-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={template.isActive ? 'default' : 'outline'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Subject Preview */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Subject:</p>
                  <p className="text-sm line-clamp-1 font-medium">
                    {template.subjectTemplate}
                  </p>
                </div>

                {/* Preview Text */}
                {template.previewText && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Preview:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.previewText}
                    </p>
                  </div>
                )}

                {/* Variables */}
                {getVariableCount(template.variables) > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Badge variant="outline" className="text-xs">
                      {getVariableCount(template.variables)} variables
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(template.variables || {})
                        .slice(0, 3)
                        .map((varName) => (
                          <code
                            key={varName}
                            className="text-xs bg-muted px-1.5 py-0.5 rounded"
                          >
                            {`{{${varName}}}`}
                          </code>
                        ))}
                      {getVariableCount(template.variables) > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{getVariableCount(template.variables) - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/marketing/email-templates/${template.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Email template preview with variables
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">{previewTemplate.subjectTemplate}</code>
                </div>
              </div>

              {/* Preview Text */}
              {previewTemplate.previewText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview Text</label>
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-sm">{previewTemplate.previewText}</code>
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Body Template</label>
                <div className="p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {previewTemplate.bodyTemplate}
                  </pre>
                </div>
              </div>

              {/* Variables */}
              {previewTemplate.variables && Object.keys(previewTemplate.variables).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available Variables</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(previewTemplate.variables).map(([key, description]) => (
                      <div key={key} className="p-2 bg-muted rounded-md">
                        <code className="text-xs font-mono">{`{{${key}}}`}</code>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
