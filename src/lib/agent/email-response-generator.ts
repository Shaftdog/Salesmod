import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { EmailCategory, EmailClassification } from '@/lib/agent/email-classifier';
import { GmailMessage } from '@/lib/gmail/gmail-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface EmailResponse {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  shouldAutoSend: boolean;
  confidence: number;
}

/**
 * Generates an email response based on category and context
 * Uses Claude Sonnet 4.5 to create contextual, professional responses
 */
export async function generateEmailResponse(
  orgId: string,
  email: GmailMessage,
  classification: EmailClassification,
  context?: BusinessContext,
  campaignContext?: {
    jobName?: string;
    jobDescription?: string;
    originalEmailSubject?: string;
    originalEmailBody?: string;
    conversationHistory?: string;
  }
): Promise<EmailResponse> {
  const { category, entities } = classification;

  // Build context if not provided
  if (!context) {
    context = await buildBusinessContext(orgId, email, classification);
  }

  // Generate response based on category
  const prompt = buildResponsePrompt(email, classification, context, campaignContext);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      temperature: 0.3, // Slightly creative but mostly consistent
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Strip markdown code blocks if present (Claude sometimes wraps JSON in ```json ... ```)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      // Remove opening code block (```json or ```)
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '');
      // Remove closing code block
      jsonText = jsonText.replace(/\n?```\s*$/, '');
    }

    const response = JSON.parse(jsonText);

    // Determine if should auto-send based on category
    const autoSendCategories: EmailCategory[] = ['STATUS', 'SCHEDULING', 'REMOVE'];
    const shouldAutoSend =
      autoSendCategories.includes(category) && classification.confidence >= 0.95;

    return {
      subject: response.subject || `Re: ${email.subject}`,
      bodyHtml: response.bodyHtml,
      bodyText: response.bodyText || stripHtml(response.bodyHtml),
      shouldAutoSend,
      confidence: response.confidence || 0.9,
    };
  } catch (error) {
    console.error('Error generating email response:', error);

    // Fallback response
    return {
      subject: `Re: ${email.subject}`,
      bodyHtml: `<p>Thank you for your email. We have received your message and will respond shortly.</p>`,
      bodyText: 'Thank you for your email. We have received your message and will respond shortly.',
      shouldAutoSend: false,
      confidence: 0,
    };
  }
}

/**
 * Builds the prompt for generating email responses
 */
function buildResponsePrompt(
  email: GmailMessage,
  classification: EmailClassification,
  context: BusinessContext,
  campaignContext?: {
    jobName?: string;
    jobDescription?: string;
    originalEmailSubject?: string;
    originalEmailBody?: string;
    conversationHistory?: string;
  }
): string {
  const { category, entities } = classification;

  const categoryInstructions: Record<EmailCategory, string> = {
    STATUS: `Generate a status update email. Look up the order information and provide current status, progress percentage, and expected completion date. Be specific and helpful.`,

    SCHEDULING: `Generate a scheduling confirmation email. Confirm the appointment details, provide date/time, and include any preparation instructions. Be clear and professional.`,

    REMOVE: `Generate an unsubscribe confirmation email. Confirm that the user has been removed from the mailing list and will no longer receive emails. Be brief and professional.`,

    UPDATES: `Generate an acknowledgment email for the update. Confirm receipt, thank them for the information, and outline next steps if any.`,

    OPPORTUNITY: `Generate a professional response to this business opportunity. Express interest, provide relevant information about ROI Homes' services, mention pricing if appropriate, and suggest next steps.`,

    AMC_ORDER: `This requires human review. Generate a placeholder acknowledging receipt of the order and confirming someone will review it shortly.`,

    CASE: `This requires human review. Generate an empathetic response acknowledging the issue and confirming it will be escalated to the appropriate team.`,

    AP: `This requires human review. Generate a response acknowledging receipt of the invoice and confirming it will be processed.`,

    AR: `This requires human review. Generate a response confirming receipt of payment information.`,

    INFORMATION: `Generate a brief acknowledgment that the information was received and will be reviewed by the team.`,

    NOTIFICATIONS: `No response needed for automated notifications.`,

    ESCALATE: `Generate a generic but professional holding response confirming receipt and promising a response within 24 hours.`,
  };

  return `You are an AI assistant for ROI Homes, an appraisal management company. Generate a professional email response.

INCOMING EMAIL:
From: ${email.from.name || email.from.email}
Subject: ${email.subject}
Body: ${email.bodyText?.substring(0, 1000) || email.snippet}

CLASSIFICATION:
Category: ${category}
Intent: ${classification.intent}
Entities: ${JSON.stringify(entities, null, 2)}

BUSINESS CONTEXT:
${context.isExistingClient ? `This is an existing client: ${context.clientName}` : 'This is a new contact'}
${context.orderInfo ? `Order Information:\n${JSON.stringify(context.orderInfo, null, 2)}` : 'No active orders found'}
${context.propertyInfo ? `Property Information:\n${JSON.stringify(context.propertyInfo, null, 2)}` : ''}

${campaignContext ? `CAMPAIGN CONTEXT (IMPORTANT - This is a reply to our outreach):
Campaign: ${campaignContext.jobName || 'Unknown'}
Campaign Goal: ${campaignContext.jobDescription || 'N/A'}

ORIGINAL EMAIL WE SENT:
Subject: ${campaignContext.originalEmailSubject || 'N/A'}
Body: ${campaignContext.originalEmailBody || 'N/A'}

⚠️ CRITICAL: This person is REPLYING to the email we sent them above. Your response must:
1. Reference the specific content of our original email
2. Continue the conversation naturally (don't start from scratch)
3. Answer their reply in context of what we asked/offered
4. Maintain conversation continuity
` : ''}

INSTRUCTIONS:
${categoryInstructions[category]}

TONE & STYLE:
- Professional but friendly
- Clear and concise
- Helpful and solution-oriented
- ROI Homes representative voice

REQUIREMENTS:
1. Address the sender by name if available
2. Directly answer their question or request
3. Provide specific information (dates, numbers, details)
4. Include next steps or calls to action if appropriate
5. Sign off professionally
6. Keep it brief (2-4 paragraphs max)

RESPONSE FORMAT:
Respond with ONLY valid JSON:
{
  "subject": "Re: [original subject]",
  "bodyHtml": "<p>HTML formatted email body</p>",
  "bodyText": "Plain text version",
  "confidence": 0.95
}

Generate the response now:`;
}

/**
 * Builds business context for response generation
 */
async function buildBusinessContext(
  orgId: string,
  email: GmailMessage,
  classification: EmailClassification
): Promise<BusinessContext> {
  const supabase = await createClient();
  const context: BusinessContext = {};

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId) {
    console.error('[Email Response] User has no tenant_id assigned');
    return context;
  }

  // Find contact and client
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, name, client_id')
    .eq('tenant_id', tenantId)
    .eq('email', email.from.email)
    .single();

  if (contact) {
    context.isExistingClient = !!contact.client_id;

    if (contact.client_id) {
      // Get client info
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', contact.client_id)
        .single();

      context.clientName = client?.name;

      // Get order info if order number mentioned
      if (classification.entities.orderNumber) {
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', contact.client_id)
          .ilike('order_number', `%${classification.entities.orderNumber}%`)
          .single();

        if (order) {
          context.orderInfo = {
            orderNumber: order.order_number,
            status: order.status,
            propertyAddress: order.property_address,
            dueDate: order.due_date,
            progress: calculateOrderProgress(order.status),
          };
        }
      }

      // Get property info if address mentioned
      if (classification.entities.propertyAddress) {
        const { data: property } = await supabase
          .from('properties')
          .select('*')
          .ilike('address', `%${classification.entities.propertyAddress}%`)
          .single();

        if (property) {
          context.propertyInfo = {
            address: property.address,
            city: property.city,
            state: property.state,
            zip: property.zip,
          };
        }
      }
    }
  }

  return context;
}

/**
 * Calculates order progress percentage based on status
 */
function calculateOrderProgress(status: string): number {
  const progressMap: Record<string, number> = {
    pending: 10,
    scheduled: 25,
    in_progress: 50,
    inspection_complete: 75,
    review: 90,
    completed: 100,
  };

  return progressMap[status] || 0;
}

/**
 * Strips HTML tags from a string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Business context for response generation
 */
export interface BusinessContext {
  isExistingClient?: boolean;
  clientName?: string;
  orderInfo?: {
    orderNumber: string;
    status: string;
    propertyAddress?: string;
    dueDate?: string;
    progress: number;
  };
  propertyInfo?: {
    address: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}
