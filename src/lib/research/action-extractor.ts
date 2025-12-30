/**
 * Extract actionable tasks from research summaries and create kanban cards
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Schema for extracted actions - EMAILS ONLY with full email content
// The agent should send emails automatically, not create tasks for the user
const ExtractedActionSchema = z.object({
  title: z.string().describe('Short, actionable title for the email'),
  type: z.literal('send_email').describe('Always send_email - the agent sends emails automatically'),
  priority: z.enum(['high', 'medium', 'low']).describe('Priority based on urgency'),
  timeframe: z.enum(['immediate', 'short_term', 'ongoing']).describe('When this should be done'),
  target_contact: z.string().describe('Name of the person to email'),
  rationale: z.string().describe('Why this email should be sent'),
  email_subject: z.string().min(5).describe('The email subject line'),
  email_body: z.string().min(50).describe('The full email body as HTML with <p> tags. Be professional and personalized.'),
});

const ActionExtractionResultSchema = z.object({
  actions: z.array(ExtractedActionSchema),
});

export type ExtractedAction = z.infer<typeof ExtractedActionSchema>;

/**
 * Extract actionable tasks from a research summary using AI
 */
export async function extractActionsFromResearch(
  researchSummary: string,
  clientName: string,
  existingContacts: Array<{ name: string; email?: string; title?: string }>
): Promise<ExtractedAction[]> {
  const contactList = existingContacts.length > 0
    ? existingContacts.map(c => `- ${c.name}${c.title ? ` (${c.title})` : ''}${c.email ? ` - ${c.email}` : ''}`).join('\n')
    : 'No contacts on file.';

  const prompt = `You are an AI sales agent for ROI Homes (an appraisal management company). Create EMAIL outreach based on this research.

RESEARCH SUMMARY:
${researchSummary}

EXISTING CONTACTS:
${contactList}

TASK:
Create 2-5 EMAIL outreach actions with COMPLETE email content. You send emails directly - no tasks or calls.

FOR EACH EMAIL, INCLUDE:
- email_subject: A clear, professional subject line (at least 5 characters)
- email_body: The FULL email message as HTML (use <p> tags for paragraphs, at least 50 characters)

EMAIL BODY GUIDELINES:
- Start with a personalized greeting using their first name
- Reference specific information from the research
- Keep it concise but complete
- Sign off with "Best,\n\nRod Haug\nROI Homes" - NEVER leave signature blank
- Ask them to REPLY to this email if interested

CRITICAL: NEVER mention calls, phone, meetings, or scheduling. Keep all communication via email only.

YEAR GUIDANCE: We are at the end of 2025. Any forward-looking references should use 2026 (e.g., "Q1 2026", "strong start to 2026", "looking ahead to 2026").

RULES:
- ONLY target contacts who have an email address listed above
- If a contact has no email, SKIP them entirely
- Write complete, ready-to-send emails
- Be professional and personalized

IMPORTANT: If there are no contacts with email addresses, return an empty actions array.`;

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: ActionExtractionResultSchema,
      prompt,
      temperature: 0.3,
    });

    console.log(`[ActionExtractor] Extracted ${object.actions.length} actions from research`);
    return object.actions;
  } catch (error) {
    console.error('[ActionExtractor] Failed to extract actions:', error);
    return [];
  }
}

/**
 * Convert extracted actions to kanban card format with scheduling
 */
export function actionsToCardPayloads(
  actions: ExtractedAction[],
  clientId: string,
  contacts: Array<{ id: string; firstName: string; lastName: string; email?: string }>
): Array<{
  type: string;
  title: string;
  description: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  client_id: string;
  contact_id?: string;
  action_payload?: any;
  state: 'scheduled' | 'suggested';
  due_at: string | null;
}> {
  return actions.map(action => {
    // Try to match target contact to existing contacts
    let contactId: string | undefined;
    let contactEmail: string | undefined;

    if (action.target_contact) {
      const targetLower = action.target_contact.toLowerCase();
      const matchedContact = contacts.find(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return fullName.includes(targetLower) || targetLower.includes(fullName) ||
               c.firstName.toLowerCase() === targetLower ||
               c.lastName.toLowerCase() === targetLower;
      });

      if (matchedContact) {
        contactId = matchedContact.id;
        contactEmail = matchedContact.email;
      }
    }

    // Calculate scheduling based on timeframe
    const scheduling = calculateScheduling(action.timeframe);

    const baseCard = {
      type: action.type,
      title: action.title,
      description: action.rationale, // Use rationale as description since schema doesn't have description
      rationale: action.rationale,
      priority: action.priority,
      client_id: clientId,
      contact_id: contactId,
      state: scheduling.state,
      due_at: scheduling.due_at,
    };

    // Only create email cards with full content
    if (action.type === 'send_email' && contactEmail) {
      return {
        ...baseCard,
        action_payload: {
          to: contactEmail,
          subject: action.email_subject,
          body: action.email_body,
        },
      };
    }

    // Skip any non-email actions (shouldn't happen with new schema)
    return {
      ...baseCard,
      action_payload: {},
    };
  });
}

/**
 * Map timeframe to priority
 */
export function timeframeToPriority(timeframe: string): 'high' | 'medium' | 'low' {
  switch (timeframe) {
    case 'immediate':
      return 'high';
    case 'short_term':
      return 'medium';
    case 'ongoing':
    default:
      return 'low';
  }
}

/**
 * Calculate due_at and initial state based on timeframe
 * - immediate: suggested now (no due date)
 * - short_term: scheduled for +7 days
 * - ongoing: scheduled for +21 days
 */
export function calculateScheduling(timeframe: string): {
  state: 'scheduled' | 'suggested';
  due_at: string | null;
} {
  const now = new Date();

  switch (timeframe) {
    case 'immediate':
      // Execute now - go straight to suggested
      return { state: 'suggested', due_at: null };

    case 'short_term':
      // Due in 7 days
      const shortTermDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { state: 'scheduled', due_at: shortTermDate.toISOString() };

    case 'ongoing':
      // Due in 21 days
      const ongoingDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      return { state: 'scheduled', due_at: ongoingDate.toISOString() };

    default:
      return { state: 'suggested', due_at: null };
  }
}
