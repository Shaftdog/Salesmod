import { createClient } from '@/lib/supabase/server';
import {
  Newsletter,
  NewsletterIssue,
  CreateNewsletterInput,
  CreateNewsletterIssueInput,
} from '@/lib/types/marketing';

/**
 * Create newsletter
 */
export async function createNewsletter(
  orgId: string,
  userId: string,
  data: CreateNewsletterInput
): Promise<Newsletter | null> {
  const supabase = await createClient();

  const { data: newsletter, error } = await supabase
    .from('marketing_newsletters')
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description,
      target_role_codes: data.targetRoleCodes,
      target_role_categories: data.targetRoleCategories,
      include_tags: data.includeTags,
      frequency: data.frequency,
      template_id: data.templateId,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating newsletter:', error);
    return null;
  }

  return newsletter as Newsletter;
}

/**
 * List newsletters
 */
export async function listNewsletters(
  orgId: string,
  activeOnly: boolean = true
): Promise<Newsletter[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_newsletters')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data: newsletters, error } = await query;

  if (error) {
    console.error('Error listing newsletters:', error);
    return [];
  }

  return (newsletters || []) as Newsletter[];
}

/**
 * Get newsletter by ID
 */
export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const supabase = await createClient();

  const { data: newsletter, error } = await supabase
    .from('marketing_newsletters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching newsletter:', error);
    return null;
  }

  return newsletter as Newsletter;
}

/**
 * Update newsletter
 */
export async function updateNewsletter(
  id: string,
  data: Partial<CreateNewsletterInput>
): Promise<Newsletter | null> {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.targetRoleCodes !== undefined) updateData.target_role_codes = data.targetRoleCodes;
  if (data.targetRoleCategories !== undefined) updateData.target_role_categories = data.targetRoleCategories;
  if (data.includeTags !== undefined) updateData.include_tags = data.includeTags;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.templateId !== undefined) updateData.template_id = data.templateId;

  const { data: newsletter, error } = await supabase
    .from('marketing_newsletters')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating newsletter:', error);
    return null;
  }

  return newsletter as Newsletter;
}

/**
 * Create newsletter issue
 */
export async function createNewsletterIssue(
  userId: string,
  data: CreateNewsletterIssueInput
): Promise<NewsletterIssue | null> {
  const supabase = await createClient();

  const { data: issue, error } = await supabase
    .from('newsletter_issues')
    .insert({
      newsletter_id: data.newsletterId,
      campaign_id: data.campaignId,
      subject: data.subject,
      intro_text: data.introText,
      content_blocks: data.contentBlocks,
      scheduled_for: data.scheduledFor,
      status: 'draft',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating newsletter issue:', error);
    return null;
  }

  return issue as NewsletterIssue;
}

/**
 * List newsletter issues
 */
export async function listNewsletterIssues(
  newsletterId: string
): Promise<NewsletterIssue[]> {
  const supabase = await createClient();

  const { data: issues, error } = await supabase
    .from('newsletter_issues')
    .select('*, newsletter:marketing_newsletters(name), campaign:marketing_campaigns(name)')
    .eq('newsletter_id', newsletterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing newsletter issues:', error);
    return [];
  }

  return (issues || []) as NewsletterIssue[];
}

/**
 * Get newsletter issue
 */
export async function getNewsletterIssue(id: string): Promise<NewsletterIssue | null> {
  const supabase = await createClient();

  const { data: issue, error } = await supabase
    .from('newsletter_issues')
    .select('*, newsletter:marketing_newsletters(*), campaign:marketing_campaigns(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching newsletter issue:', error);
    return null;
  }

  return issue as NewsletterIssue;
}

/**
 * Update newsletter issue
 */
export async function updateNewsletterIssue(
  id: string,
  data: Partial<CreateNewsletterIssueInput> & { status?: string }
): Promise<NewsletterIssue | null> {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.introText !== undefined) updateData.intro_text = data.introText;
  if (data.contentBlocks !== undefined) updateData.content_blocks = data.contentBlocks;
  if (data.scheduledFor !== undefined) updateData.scheduled_for = data.scheduledFor;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: issue, error } = await supabase
    .from('newsletter_issues')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating newsletter issue:', error);
    return null;
  }

  return issue as NewsletterIssue;
}

/**
 * Send newsletter issue
 */
export async function sendNewsletterIssue(id: string): Promise<boolean> {
  const supabase = await createClient();

  // Update status to sending
  await supabase
    .from('newsletter_issues')
    .update({
      status: 'sending',
      sent_at: new Date().toISOString(),
    })
    .eq('id', id);

  // TODO: Implement actual email sending logic
  // This would:
  // 1. Get newsletter subscribers (based on target_role_codes, etc.)
  // 2. Render email template with content blocks
  // 3. Send via email service (Resend)
  // 4. Track individual sends in email_sends table
  // 5. Update metrics

  // For now, just mark as sent
  const { error } = await supabase
    .from('newsletter_issues')
    .update({
      status: 'sent',
      metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
    })
    .eq('id', id);

  return !error;
}

/**
 * Schedule newsletter issue
 */
export async function scheduleNewsletterIssue(
  id: string,
  scheduledFor: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('newsletter_issues')
    .update({
      status: 'scheduled',
      scheduled_for: scheduledFor,
    })
    .eq('id', id);

  return !error;
}
