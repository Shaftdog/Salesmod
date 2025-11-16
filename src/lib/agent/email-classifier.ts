import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { GmailMessage } from '@/lib/gmail/gmail-service';
import { sanitizeForAI, sanitizeEmailBody, sanitizeSubject } from '@/lib/utils/email-sanitizer';
import { AnthropicRateLimiter } from '@/lib/utils/rate-limiter';
import { validateEnv } from '@/lib/env';

export type EmailCategory =
  | 'AMC_ORDER' // Official appraisal orders from AMCs
  | 'OPPORTUNITY' // New business leads seeking quotes
  | 'CASE' // Complex issues (complaints, disputes, rebuttals)
  | 'STATUS' // Simple update requests on orders
  | 'SCHEDULING' // Property inspection logistics
  | 'UPDATES' // New/changed info for existing orders
  | 'AP' // Accounts Payable (bills to pay)
  | 'AR' // Accounts Receivable (payments owed)
  | 'INFORMATION' // General announcements, news
  | 'NOTIFICATIONS' // Automated system alerts
  | 'REMOVE' // Unsubscribe requests
  | 'ESCALATE'; // Low confidence, needs human review

export interface EmailClassification {
  category: EmailCategory;
  confidence: number; // 0-1
  intent: string;
  entities: {
    orderNumber?: string;
    propertyAddress?: string;
    amount?: number;
    urgency?: 'low' | 'medium' | 'high';
    requestedAction?: string;
  };
  shouldEscalate: boolean; // true if confidence < 0.95
  reasoning: string; // Why this classification was chosen
}

// Zod schema for validating Claude's response
const EmailClassificationSchema = z.object({
  category: z.enum([
    'AMC_ORDER',
    'OPPORTUNITY',
    'CASE',
    'STATUS',
    'SCHEDULING',
    'UPDATES',
    'AP',
    'AR',
    'INFORMATION',
    'NOTIFICATIONS',
    'REMOVE',
    'ESCALATE',
  ]),
  confidence: z.number().min(0).max(1),
  intent: z.string(),
  entities: z.object({
    orderNumber: z.string().optional(),
    propertyAddress: z.string().optional(),
    amount: z.number().optional(),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    requestedAction: z.string().optional(),
  }),
  shouldEscalate: z.boolean(),
  reasoning: z.string(),
});

// Lazy initialization to avoid module-load time validation errors
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    try {
      const env = validateEnv();
      anthropic = new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });
      console.log('[Email Classifier] Anthropic client initialized successfully');
    } catch (error) {
      console.error('[Email Classifier] Failed to initialize Anthropic client:', error);
      throw new Error(`Email classification unavailable: ${(error as Error).message}`);
    }
  }
  return anthropic;
}

/**
 * Classifies an email using Claude Sonnet 4.5
 * Based on Lindy.ai classification rules
 */
export async function classifyEmail(
  email: GmailMessage,
  context?: {
    isExistingClient?: boolean;
    hasActiveOrders?: boolean;
    recentInteractions?: number;
    isCampaignReply?: boolean;
    jobContext?: {
      jobName?: string;
      jobDescription?: string;
      originalEmail?: string;
    };
  }
): Promise<EmailClassification> {
  try {
    console.log(`[Email Classifier] Classifying email ${email.id} from ${email.from.email}`);
    const prompt = buildClassificationPrompt(email, context);

    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse JSON response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Validate with Zod schema
    const parsed = JSON.parse(content.text);
    const classification = EmailClassificationSchema.parse(parsed);

    // Apply 95% confidence rule
    classification.shouldEscalate = classification.confidence < 0.95;
    if (classification.shouldEscalate) {
      classification.category = 'ESCALATE';
    }

    return classification;
  } catch (error) {
    // Log detailed error for monitoring
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = {
      emailId: email.id,
      from: email.from.email,
      subject: email.subject,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error('Email classification failed:', errorDetails);

    // TODO: Send to monitoring/alerting system
    // await alertMonitoring({
    //   severity: 'high',
    //   message: 'Email classification system failure',
    //   context: errorDetails,
    // });

    // Default to escalate if classification fails
    return {
      category: 'ESCALATE',
      confidence: 0,
      intent: 'Unable to classify due to system error',
      entities: {},
      shouldEscalate: true,
      reasoning: `Classification error: ${errorMessage}`,
    };
  }
}

/**
 * Builds the classification prompt for Claude
 */
function buildClassificationPrompt(
  email: GmailMessage,
  context?: {
    isExistingClient?: boolean;
    hasActiveOrders?: boolean;
    recentInteractions?: number;
    isCampaignReply?: boolean;
    jobContext?: {
      jobName?: string;
      jobDescription?: string;
      originalEmail?: string;
    };
  }
): string {
  // Sanitize email content to prevent prompt injection
  const sanitizedSubject = sanitizeSubject(email.subject);
  const sanitizedSnippet = sanitizeForAI(email.snippet || '');
  const sanitizedBody = email.bodyText
    ? sanitizeForAI(sanitizeEmailBody(email.bodyText).substring(0, 2000))
    : '';

  return `You are the AI Inbox Manager for ROI Homes, an appraisal management company. Your task is to classify incoming emails with high accuracy.

CLASSIFICATION CATEGORIES:
- AMC_ORDER: Official appraisal orders from AMCs with formal order sheets or portal links
- OPPORTUNITY: New business leads from non-AMC clients seeking quotes or services
- CASE: Complex issues requiring investigation (complaints, rebuttals, disputes)
- STATUS: Simple update requests on existing orders
- SCHEDULING: Property inspection logistics and appointments
- UPDATES: New/changed information for existing orders
- AP: Invoices/bills ROI Home Services needs to pay
- AR: Payments owed to ROI Home Services
- INFORMATION: General announcements, news, guidelines for team awareness
- NOTIFICATIONS: Automated system alerts
- REMOVE: Unsubscribe requests
- ESCALATE: Default for unclear emails (if confidence < 95%)

CONFIDENCE THRESHOLD: Only classify with confidence ≥ 0.95. If unsure, use ESCALATE.

EMAIL DETAILS:
From: ${email.from.name || ''} <${email.from.email}>
Subject: ${sanitizedSubject}
Snippet: ${sanitizedSnippet}

${sanitizedBody ? `Body:\n${sanitizedBody}` : ''}

${context ? `CONTEXT:
- Existing client: ${context.isExistingClient ? 'Yes' : 'No'}
- Active orders: ${context.hasActiveOrders ? 'Yes' : 'No'}
- Recent interactions: ${context.recentInteractions || 0}
` : ''}

INSTRUCTIONS:
1. Analyze the email content carefully
2. Determine the primary purpose
3. Assign ONE category
4. Calculate confidence (0-1 scale)
5. Extract relevant entities (order numbers, addresses, amounts, etc.)
6. Determine urgency level
7. Explain your reasoning

Respond with ONLY valid JSON in this exact format:
{
  "category": "CATEGORY_NAME",
  "confidence": 0.98,
  "intent": "Brief description of sender's intent",
  "entities": {
    "orderNumber": "extracted order number if any",
    "propertyAddress": "extracted property address if any",
    "amount": 1234.56,
    "urgency": "low|medium|high",
    "requestedAction": "what the sender wants"
  },
  "shouldEscalate": false,
  "reasoning": "Brief explanation of why this category was chosen"
}

EXAMPLES:

Example 1 - AMC Order:
Email: "New order #12345 for 123 Main St. Please see attached order form."
Response:
{
  "category": "AMC_ORDER",
  "confidence": 0.99,
  "intent": "New appraisal order submission",
  "entities": {
    "orderNumber": "12345",
    "propertyAddress": "123 Main St",
    "urgency": "high"
  },
  "shouldEscalate": false,
  "reasoning": "Clear order submission with order number and property address"
}

Example 2 - Status Request:
Email: "Hi, what's the status on my appraisal for 456 Oak Ave?"
Response:
{
  "category": "STATUS",
  "confidence": 0.98,
  "intent": "Request status update on appraisal",
  "entities": {
    "propertyAddress": "456 Oak Ave",
    "urgency": "medium",
    "requestedAction": "status update"
  },
  "shouldEscalate": false,
  "reasoning": "Clear status request for specific property"
}

Example 3 - Complaint (Case):
Email: "This appraisal is completely wrong! The comps are terrible and the value is way off!"
Response:
{
  "category": "CASE",
  "confidence": 0.97,
  "intent": "Complaint about appraisal quality",
  "entities": {
    "urgency": "high",
    "requestedAction": "review appraisal"
  },
  "shouldEscalate": false,
  "reasoning": "Clear complaint requiring investigation and resolution"
}

Example 4 - Unclear Email (Escalate):
Email: "Hey, following up on that thing we discussed."
Response:
{
  "category": "ESCALATE",
  "confidence": 0.60,
  "intent": "Unclear follow-up request",
  "entities": {
    "urgency": "low"
  },
  "shouldEscalate": true,
  "reasoning": "Vague reference without clear context - confidence below 95% threshold"
}

Now classify the email above. Return ONLY the JSON response, no other text.`;
}

/**
 * Batch classifies multiple emails with rate limiting
 */
export async function classifyEmails(
  emails: GmailMessage[],
  contextMap?: Map<string, { isExistingClient?: boolean; hasActiveOrders?: boolean }>
): Promise<Map<string, EmailClassification>> {
  console.log(`Classifying ${emails.length} emails...`);

  // Use rate limiter to prevent API quota exhaustion
  const { results, errors } = await AnthropicRateLimiter.classifyEmails(
    emails,
    async (email) => {
      const context = contextMap?.get(email.from.email);
      const classification = await classifyEmail(email, context);
      return { emailId: email.id, classification };
    }
  );

  // Convert results to map
  const classifications = new Map<string, EmailClassification>();
  results.forEach(({ emailId, classification }) => {
    classifications.set(emailId, classification);
  });

  // Log any errors
  if (errors.length > 0) {
    console.warn(
      `Failed to classify ${errors.length}/${emails.length} emails. ` +
      `Check logs for details.`
    );
  }

  console.log(
    `Classification complete: ${results.length} successful, ${errors.length} errors`
  );

  return classifications;
}
