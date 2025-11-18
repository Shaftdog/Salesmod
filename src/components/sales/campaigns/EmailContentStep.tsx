"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Code } from 'lucide-react';
import { replaceMergeTokens, getAvailableTokens } from '@/lib/campaigns/merge-tokens';

interface EmailContentStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const SAMPLE_MERGE_DATA = {
  first_name: 'John',
  last_name: 'Smith',
  company_name: 'Acme Appraisals',
  last_order_date: '2024-08-15',
  days_since_last_order: 90,
  property_count: 12,
  total_orders: 45,
};

export function EmailContentStep({ formData, updateFormData }: EmailContentStepProps) {
  const [showPreview, setShowPreview] = useState(false);

  function insertToken(token: string) {
    const textarea = document.getElementById('email_body') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formData.email_body;
    const newValue =
      currentValue.substring(0, start) +
      `{{${token}}}` +
      currentValue.substring(end);

    updateFormData({ email_body: newValue });

    // Update used tokens
    const tokens = extractTokens(newValue);
    updateFormData({ used_merge_tokens: tokens });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length + 4, start + token.length + 4);
    }, 0);
  }

  function extractTokens(text: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const tokens = new Set<string>();
    let match;

    while ((match = regex.exec(text)) !== null) {
      tokens.add(match[1]);
    }

    return Array.from(tokens);
  }

  function handleBodyChange(value: string) {
    updateFormData({ email_body: value });
    const tokens = extractTokens(value);
    updateFormData({ used_merge_tokens: tokens });
  }

  function handleSubjectChange(value: string) {
    updateFormData({ email_subject: value });
    const subjectTokens = extractTokens(value);
    const bodyTokens = extractTokens(formData.email_body);
    const allTokens = Array.from(new Set([...subjectTokens, ...bodyTokens]));
    updateFormData({ used_merge_tokens: allTokens });
  }

  const previewSubject = replaceMergeTokens(formData.email_subject, SAMPLE_MERGE_DATA);
  const previewBody = replaceMergeTokens(formData.email_body, SAMPLE_MERGE_DATA);

  return (
    <div className="space-y-6">
      {/* Subject Line */}
      <div className="space-y-2">
        <Label htmlFor="email_subject">Email Subject *</Label>
        <Input
          id="email_subject"
          placeholder="e.g., {{first_name}}, let's reconnect!"
          value={formData.email_subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use merge tokens like {{'{first_name}'}} to personalize
        </p>
      </div>

      {/* Merge Tokens Helper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Merge Tokens</CardTitle>
          <CardDescription className="text-xs">
            Click a token to insert it at cursor position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getAvailableTokens().map(({ token, description }) => (
              <Button
                key={token}
                variant="outline"
                size="sm"
                onClick={() => insertToken(token)}
                className="font-mono text-xs"
                title={description}
              >
                <Code className="h-3 w-3 mr-1" />
                {{token}}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Body */}
      <div className="space-y-2">
        <Label htmlFor="email_body">Email Body *</Label>
        <Textarea
          id="email_body"
          placeholder={`Hi {{first_name}},\n\nI hope this email finds you well! It's been {{days_since_last_order}} days since we last worked together on an appraisal for {{company_name}}.\n\nI wanted to reach out and see if you have any upcoming appraisal needs...\n\nBest regards`}
          value={formData.email_body}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Plain text only. Merge tokens will be replaced with actual values for each recipient.
        </p>
      </div>

      {/* Used Tokens Summary */}
      {formData.used_merge_tokens?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tokens Used in This Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formData.used_merge_tokens.map((token: string) => (
                <Badge key={token} variant="secondary" className="font-mono">
                  {{token}}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant={showPreview ? 'default' : 'outline'}
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle className="text-lg">Email Preview</CardTitle>
            </div>
            <CardDescription>
              How the email will look to a sample recipient
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-lg border">
              <div className="mb-4 pb-4 border-b">
                <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                <p className="font-semibold">{previewSubject || '(No subject)'}</p>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {previewBody || '(No content)'}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Sample data used:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Recipient: {SAMPLE_MERGE_DATA.first_name} {SAMPLE_MERGE_DATA.last_name}</li>
                <li>Company: {SAMPLE_MERGE_DATA.company_name}</li>
                <li>Days since last order: {SAMPLE_MERGE_DATA.days_since_last_order}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
