'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CATEGORIES = [
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'transactional', label: 'Transactional' },
];

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'campaign' as const,
    subjectTemplate: '',
    previewText: '',
    bodyTemplate: '',
  });
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [newVarName, setNewVarName] = useState('');
  const [newVarDescription, setNewVarDescription] = useState('');

  const addVariable = () => {
    if (!newVarName.trim()) {
      toast.error('Variable name is required');
      return;
    }

    // Validate variable name (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(newVarName)) {
      toast.error('Variable name can only contain letters, numbers, and underscores');
      return;
    }

    if (variables[newVarName]) {
      toast.error('Variable already exists');
      return;
    }

    setVariables({
      ...variables,
      [newVarName]: newVarDescription.trim() || 'No description',
    });
    setNewVarName('');
    setNewVarDescription('');
  };

  const removeVariable = (varName: string) => {
    const newVars = { ...variables };
    delete newVars[varName];
    setVariables(newVars);
  };

  const insertVariable = (varName: string, field: 'subject' | 'preview' | 'body') => {
    const placeholder = `{{${varName}}}`;
    if (field === 'subject') {
      setFormData({ ...formData, subjectTemplate: formData.subjectTemplate + placeholder });
    } else if (field === 'preview') {
      setFormData({ ...formData, previewText: formData.previewText + placeholder });
    } else {
      setFormData({ ...formData, bodyTemplate: formData.bodyTemplate + placeholder });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!formData.subjectTemplate.trim()) {
      toast.error('Subject template is required');
      return;
    }

    if (!formData.bodyTemplate.trim()) {
      toast.error('Body template is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketing/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: Object.keys(variables).length > 0 ? variables : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const { template } = await response.json();
      toast.success('Template created successfully');
      router.push('/marketing/email-templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/marketing/email-templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Email Template</h1>
          <p className="text-muted-foreground">
            Reusable email template with variable support
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Template name, category, and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Welcome Email"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this template..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Template Variables</CardTitle>
            <CardDescription>
              Define variables that can be used in subject and body (e.g., {`{{first_name}}`})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
              <Input
                placeholder="Variable name"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVariable();
                  }
                }}
              />
              <Input
                placeholder="Description"
                value={newVarDescription}
                onChange={(e) => setNewVarDescription(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVariable();
                  }
                }}
              />
              <Button type="button" onClick={addVariable}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {Object.keys(variables).length > 0 && (
              <div className="space-y-2">
                <Label>Defined Variables ({Object.keys(variables).length})</Label>
                <div className="grid gap-2">
                  {Object.entries(variables).map(([varName, description]) => (
                    <div
                      key={varName}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {`{{${varName}}}`}
                        </code>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariable(varName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
            <CardDescription>
              Subject, preview text, and body template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                placeholder="e.g., Welcome to {{company_name}}, {{first_name}}!"
                value={formData.subjectTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, subjectTemplate: e.target.value })
                }
                required
              />
              {Object.keys(variables).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Insert:</span>
                  {Object.keys(variables).map((varName) => (
                    <Badge
                      key={varName}
                      variant="outline"
                      className="cursor-pointer text-xs"
                      onClick={() => insertVariable(varName, 'subject')}
                    >
                      {`{{${varName}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Text */}
            <div className="space-y-2">
              <Label htmlFor="preview">Preview Text</Label>
              <Input
                id="preview"
                placeholder="Brief preview text shown in email clients..."
                value={formData.previewText}
                onChange={(e) =>
                  setFormData({ ...formData, previewText: e.target.value })
                }
              />
              {Object.keys(variables).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Insert:</span>
                  {Object.keys(variables).map((varName) => (
                    <Badge
                      key={varName}
                      variant="outline"
                      className="cursor-pointer text-xs"
                      onClick={() => insertVariable(varName, 'preview')}
                    >
                      {`{{${varName}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Body Template (HTML) *</Label>
              <Textarea
                id="body"
                placeholder="<div>Hello {{first_name}},<br><br>Welcome to our service...</div>"
                rows={16}
                value={formData.bodyTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, bodyTemplate: e.target.value })
                }
                className="font-mono text-sm"
                required
              />
              {Object.keys(variables).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Insert:</span>
                  {Object.keys(variables).map((varName) => (
                    <Badge
                      key={varName}
                      variant="outline"
                      className="cursor-pointer text-xs"
                      onClick={() => insertVariable(varName, 'body')}
                    >
                      {`{{${varName}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/marketing/email-templates')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of your email template with variables
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-sm">{formData.subjectTemplate}</code>
              </div>
            </div>
            {formData.previewText && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview Text</label>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">{formData.previewText}</code>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Body</label>
              <div className="p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {formData.bodyTemplate}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
