/**
 * Task Generation System
 * Automatically creates tasks based on response disposition
 * V1: NO AUTO-SEND - All tasks require human action
 */

import { createClient } from '@/lib/supabase/server';
import type { Disposition, CampaignResponse } from './types';
import { generateReplyDraft } from './classifier';

// =====================================================
// Task Generation Rules
// =====================================================

interface TaskRule {
  title: (contactName: string) => string;
  description: (contactName: string, response: CampaignResponse, draft?: string) => string;
  queue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  include_draft?: boolean;
}

const DISPOSITION_TASK_RULES: Partial<Record<Disposition, TaskRule>> = {
  NO_ACTIVE_PROFILE: {
    title: (contactName) => `Set up active profile for ${contactName}`,
    description: (contactName, response) => `
**Contact**: ${contactName}
**Campaign Response**: No active profile

**Their message:**
${response.ai_summary}

**Action needed:**
Provide contact with onboarding materials and profile setup instructions.
    `.trim(),
    queue: 'sales_admin',
    priority: 'high',
  },

  NEEDS_MORE_INFO: {
    title: (contactName) => `Follow up with ${contactName} - more info requested`,
    description: (contactName, response, draft) => `
**Contact**: ${contactName}
**Campaign Response**: Needs more information

**Their message:**
${response.ai_summary}

${draft ? `---
**AI-Generated Draft Reply:**
${draft}

_(Review and edit before sending)_` : ''}
    `.trim(),
    queue: 'account_manager',
    priority: 'medium',
    include_draft: true,
  },

  INTERESTED: {
    title: (contactName) => `Schedule call with ${contactName} - expressed interest`,
    description: (contactName, response) => `
**Contact**: ${contactName}
**Campaign Response**: Interested!

**Their message:**
${response.ai_summary}

**Action needed:**
Reach out to schedule a call to discuss their needs.
    `.trim(),
    queue: 'sales',
    priority: 'high',
  },

  ESCALATE_UNCLEAR: {
    title: (contactName) => `Review response from ${contactName}`,
    description: (contactName, response) => `
**Contact**: ${contactName}
**Campaign Response**: Unclear - needs manual review

**Their message:**
${response.response_text}

**AI Summary:**
${response.ai_summary}

**Action needed:**
Review the response and determine appropriate next steps.
    `.trim(),
    queue: 'sales_manager',
    priority: 'medium',
  },
};

// =====================================================
// Task Generation
// =====================================================

/**
 * Generate tasks based on disposition
 * Returns number of tasks created
 */
export async function generateTasksForDisposition({
  campaignId,
  responseId,
  disposition,
  contactId,
  clientId,
  orgId,
}: {
  campaignId: string;
  responseId: string;
  disposition: Disposition;
  contactId: string | null;
  clientId: string | null;
  orgId: string;
}): Promise<number> {
  const rule = DISPOSITION_TASK_RULES[disposition];

  // No task needed for this disposition
  if (!rule) {
    console.log(`[Task Generator] No task rule for disposition: ${disposition}`);
    return 0;
  }

  const supabase = await createClient();

  // Get response details
  const { data: response, error: responseError } = await supabase
    .from('campaign_responses')
    .select('*')
    .eq('id', responseId)
    .single();

  if (responseError || !response) {
    console.error('[Task Generator] Failed to get response:', responseError);
    return 0;
  }

  // Get contact name
  let contactName = response.email_address;
  if (contactId) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();

    if (contact) {
      contactName = `${contact.first_name} ${contact.last_name}`.trim();
    }
  }

  // Generate AI draft if needed
  let draft: string | undefined;
  if (rule.include_draft) {
    try {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();

      draft = await generateReplyDraft({
        campaignName: campaign?.name || 'Campaign',
        responseText: response.response_text,
        originalMessage: '', // We could fetch this from job_task metadata if needed
      });
    } catch (error) {
      console.error('[Task Generator] Failed to generate draft:', error);
      // Continue without draft
    }
  }

  // Create task (card)
  const { error: taskError } = await supabase.from('cards').insert({
    org_id: orgId,
    campaign_id: campaignId,
    campaign_response_id: responseId,
    contact_id: contactId,
    client_id: clientId,
    title: rule.title(contactName),
    description: rule.description(contactName, response, draft),
    type: 'task',
    queue: rule.queue,
    priority: rule.priority,
    status: 'todo',
  });

  if (taskError) {
    console.error('[Task Generator] Failed to create task:', taskError);
    return 0;
  }

  console.log(`[Task Generator] Created task for ${disposition}: ${rule.title(contactName)}`);
  return 1;
}

/**
 * Get queue name based on disposition
 * Useful for routing tasks
 */
export function getQueueForDisposition(disposition: Disposition): string {
  const rule = DISPOSITION_TASK_RULES[disposition];
  return rule?.queue || 'general';
}

/**
 * Get priority based on disposition
 */
export function getPriorityForDisposition(disposition: Disposition): 'low' | 'medium' | 'high' | 'urgent' {
  const rule = DISPOSITION_TASK_RULES[disposition];
  return rule?.priority || 'medium';
}
