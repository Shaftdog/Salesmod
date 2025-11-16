import { createClient } from '@/lib/supabase/server';
import DOMPurify from 'isomorphic-dompurify';

export interface EmailTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  category: 'newsletter' | 'campaign' | 'follow_up' | 'announcement' | 'transactional';
  subjectTemplate: string;
  previewText?: string;
  bodyTemplate: string;
  variables?: Record<string, string>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  description?: string;
  category: 'newsletter' | 'campaign' | 'follow_up' | 'announcement' | 'transactional';
  subjectTemplate: string;
  previewText?: string;
  bodyTemplate: string;
  variables?: Record<string, string>;
}

export interface UpdateEmailTemplateInput extends Partial<CreateEmailTemplateInput> {
  isActive?: boolean;
}

/**
 * List email templates for an organization
 */
export async function listEmailTemplates(
  orgId: string,
  filters?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<EmailTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from('email_templates')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing email templates:', error);
    throw error;
  }

  return (data || []).map(mapToEmailTemplate);
}

/**
 * Get a single email template by ID
 */
export async function getEmailTemplate(
  templateId: string
): Promise<EmailTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('Error getting email template:', error);
    return null;
  }

  return data ? mapToEmailTemplate(data) : null;
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  orgId: string,
  userId: string,
  input: CreateEmailTemplateInput
): Promise<EmailTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      org_id: orgId,
      name: input.name,
      description: input.description,
      category: input.category,
      subject_template: input.subjectTemplate,
      preview_text: input.previewText,
      body_template: input.bodyTemplate,
      variables: input.variables || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating email template:', error);
    throw error;
  }

  return data ? mapToEmailTemplate(data) : null;
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  templateId: string,
  input: UpdateEmailTemplateInput
): Promise<EmailTemplate | null> {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.subjectTemplate !== undefined) updateData.subject_template = input.subjectTemplate;
  if (input.previewText !== undefined) updateData.preview_text = input.previewText;
  if (input.bodyTemplate !== undefined) updateData.body_template = input.bodyTemplate;
  if (input.variables !== undefined) updateData.variables = input.variables;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from('email_templates')
    .update(updateData)
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('Error updating email template:', error);
    throw error;
  }

  return data ? mapToEmailTemplate(data) : null;
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(templateId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('Error deleting email template:', error);
    return false;
  }

  return true;
}

/**
 * Render template with variables (XSS-protected)
 */
export function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let rendered = template;

  // Replace all {{variable}} placeholders with sanitized values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    // Sanitize the value to prevent XSS attacks
    const sanitized = DOMPurify.sanitize(String(value || ''), {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target'],
    });
    rendered = rendered.replace(regex, sanitized);
  });

  return rendered;
}

/**
 * Extract variables from template (protected against ReDoS)
 */
export function extractVariables(template: string): string[] {
  // Protect against very large templates that could cause ReDoS
  if (template.length > 100000) {
    throw new Error('Template too large (max 100KB)');
  }

  // Fixed regex - removed incorrect backslash escaping
  const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const variables: string[] = [];
  let match;
  let iterations = 0;
  const MAX_ITERATIONS = 1000;

  while ((match = regex.exec(template)) !== null) {
    if (++iterations > MAX_ITERATIONS) {
      throw new Error('Too many variables in template (max 1000)');
    }
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

// Helper function to map database row to EmailTemplate
function mapToEmailTemplate(row: any): EmailTemplate {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    category: row.category,
    subjectTemplate: row.subject_template,
    previewText: row.preview_text,
    bodyTemplate: row.body_template,
    variables: row.variables,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
