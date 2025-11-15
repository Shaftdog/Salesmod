import Anthropic from '@anthropic-ai/sdk';
import { GmailMessage } from '@/lib/gmail/gmail-service';

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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  }
): Promise<EmailClassification> {
  try {
    const prompt = buildClassificationPrompt(email, context);

    const message = await anthropic.messages.create({
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

    const classification = JSON.parse(content.text) as EmailClassification;

    // Apply 95% confidence rule
    classification.shouldEscalate = classification.confidence < 0.95;
    if (classification.shouldEscalate) {
      classification.category = 'ESCALATE';
    }

    return classification;
  } catch (error) {
    console.error('Error classifying email:', error);

    // Default to escalate if classification fails
    return {
      category: 'ESCALATE',
      confidence: 0,
      intent: 'Unable to classify',
      entities: {},
      shouldEscalate: true,
      reasoning: 'Classification error - requires human review',
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
  }
): string {
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
Subject: ${email.subject}
Snippet: ${email.snippet}

${email.bodyText ? `Body:\n${email.bodyText.substring(0, 2000)}` : ''}

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
 * Batch classifies multiple emails
 */
export async function classifyEmails(
  emails: GmailMessage[],
  contextMap?: Map<string, { isExistingClient?: boolean; hasActiveOrders?: boolean }>
): Promise<Map<string, EmailClassification>> {
  const classifications = new Map<string, EmailClassification>();

  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const promises = batch.map(async (email) => {
      const context = contextMap?.get(email.from.email);
      const classification = await classifyEmail(email, context);
      return { emailId: email.id, classification };
    });

    const results = await Promise.all(promises);
    results.forEach(({ emailId, classification }) => {
      classifications.set(emailId, classification);
    });
  }

  return classifications;
}
