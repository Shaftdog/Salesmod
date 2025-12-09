import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { GmailMessage } from '@/lib/gmail/gmail-service';
import { sanitizeForAI, sanitizeEmailBody, sanitizeSubject } from '@/lib/utils/email-sanitizer';
import { AnthropicRateLimiter } from '@/lib/utils/rate-limiter';
import { validateEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

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
 * Sanitize user-supplied text to prevent prompt injection
 */
function sanitizeForPrompt(text: string, maxLength: number = 500): string {
  if (!text) return '';

  return text
    // Remove potential prompt injection attempts
    .replace(/IGNORE.*(PREVIOUS|ABOVE|ALL|PRIOR).*INSTRUCTIONS?/gi, '[removed]')
    .replace(/SYSTEM\s*:/gi, '')
    .replace(/ASSISTANT\s*:/gi, '')
    .replace(/USER\s*:/gi, '')
    .replace(/\n{3,}/g, '\n\n') // Limit excessive newlines
    .substring(0, maxLength)
    .trim();
}

/**
 * Validate and sanitize regex pattern for safety
 */
function validateRegexPattern(pattern: string): { valid: boolean; error?: string } {
  if (!pattern || pattern.trim().length === 0) {
    return { valid: false, error: 'Pattern cannot be empty' };
  }

  if (pattern.length > 200) {
    return { valid: false, error: 'Pattern too long (max 200 characters)' };
  }

  // Check for dangerous nested quantifiers that can cause ReDoS
  const dangerousPatterns = [
    /(\*|\+|\{)\s*(\*|\+|\{)/, // Nested quantifiers like ++, **, *+, etc.
    /(\(.*\*.*\))\s*[\*\+]/, // Quantified groups with quantifiers inside
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: 'Pattern contains nested quantifiers (ReDoS risk)' };
    }
  }

  // Try to compile the regex
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Invalid regex: ${(e as Error).message}` };
  }
}

/**
 * Test regex with timeout protection to prevent ReDoS attacks
 */
async function testRegexSafe(pattern: string, text: string, timeoutMs: number = 100): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Regex execution timeout - possible ReDoS attack'));
    }, timeoutMs);

    try {
      const regex = new RegExp(pattern, 'i');
      const result = regex.test(text);
      clearTimeout(timeout);
      resolve(result);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// In-memory cache for classification rules (TTL: 60 seconds)
const ruleCache = new Map<string, { rules: any[], fetchedAt: number }>();
const RULE_CACHE_TTL_MS = 60000;

/**
 * Invalidate rule cache for an organization
 */
export function invalidateRuleCache(orgId: string): void {
  ruleCache.delete(orgId);
  console.log(`[Email Classifier] Rule cache invalidated for org ${orgId}`);
}

/**
 * Fetch user-defined classification rules from agent_memories with caching
 */
async function fetchClassificationRules(orgId: string): Promise<any[]> {
  // Check cache first
  const cached = ruleCache.get(orgId);
  if (cached && (Date.now() - cached.fetchedAt) < RULE_CACHE_TTL_MS) {
    console.log(`[Email Classifier] Using cached rules for org ${orgId} (${cached.rules.length} rules)`);
    return cached.rules;
  }

  try {
    const supabase = await createClient();

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', orgId)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) {
      console.error(`[Email Classifier] User ${orgId} has no tenant_id assigned`);
      return [];
    }

    const { data: rules, error } = await supabase
      .from('agent_memories')
      .select('content, key')
      .eq('tenant_id', tenantId)
      .eq('scope', 'email_classification')
      .gte('importance', 0.8) // Only high-importance rules
      .order('importance', { ascending: false })
      .limit(20); // Limit to prevent prompt bloat

    if (error) {
      console.error('[Email Classifier] Database error fetching classification rules:', {
        orgId,
        error: error.message,
        code: error.code,
      });
      // Return stale cache if available, otherwise empty array
      return cached?.rules || [];
    }

    const ruleList = rules?.map(r => ({ ...r.content, _key: r.key })) || [];

    // Validate each rule has required fields
    const validRules = ruleList.filter(rule => {
      const isValid =
        rule.pattern_type &&
        rule.pattern_value &&
        rule.correct_category &&
        rule.enabled !== false; // Skip disabled rules

      if (!isValid) {
        console.warn('[Email Classifier] Skipping invalid or disabled rule:', {
          key: rule._key,
          pattern_type: rule.pattern_type,
          pattern_value: rule.pattern_value,
        });
      }
      return isValid;
    });

    console.log(`[Email Classifier] Loaded ${validRules.length}/${ruleList.length} valid classification rules for org ${orgId}`);

    // Update cache
    ruleCache.set(orgId, {
      rules: validRules,
      fetchedAt: Date.now(),
    });

    return validRules;
  } catch (error) {
    console.error('[Email Classifier] Unexpected error fetching classification rules:', {
      orgId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // TODO: Send to error tracking (Sentry, etc.)

    // Return stale cache if available
    return cached?.rules || [];
  }
}

/**
 * Check if email matches any user-defined classification rules
 */
async function checkClassificationRules(
  email: GmailMessage,
  rules: any[],
  orgId: string
): Promise<{
  matched: boolean;
  rule?: any;
  category?: EmailCategory;
  confidence?: number;
}> {
  for (const rule of rules) {
    // Skip disabled rules
    if (rule.enabled === false) {
      continue;
    }

    let matches = false;

    try {
      switch (rule.pattern_type) {
        case 'sender_email':
          // Guard against missing email
          if (!email.from?.email || !rule.pattern_value) break;
          matches = email.from.email.toLowerCase() === rule.pattern_value.toLowerCase();
          break;

        case 'sender_domain':
          // Guard against missing email or domain
          if (!email.from?.email || !rule.pattern_value) break;
          const domain = email.from.email.split('@')[1]?.toLowerCase();
          if (!domain) break;
          matches = domain === rule.pattern_value.toLowerCase();
          break;

        case 'subject_contains':
          // Guard against missing subject
          if (!email.subject || !rule.pattern_value) break;
          matches = email.subject.toLowerCase().includes(rule.pattern_value.toLowerCase());
          break;

        case 'subject_regex':
          // Guard against missing subject
          if (!email.subject || !rule.pattern_value) break;

          try {
            // Use safe regex test with timeout
            matches = await testRegexSafe(rule.pattern_value, email.subject, 100);
          } catch (error) {
            console.warn(`[Email Classifier] Regex rule failed (timeout or error):`, {
              key: rule._key,
              pattern: rule.pattern_value,
              error: error instanceof Error ? error.message : String(error),
            });
            // TODO: Mark rule as problematic or disable it
            matches = false;
          }
          break;

        default:
          console.warn(`[Email Classifier] Unknown pattern type: ${rule.pattern_type}`);
          break;
      }
    } catch (error) {
      console.error(`[Email Classifier] Error checking rule:`, {
        key: rule._key,
        pattern_type: rule.pattern_type,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (matches) {
      console.log(`[Email Classifier] Rule matched: ${rule.pattern_type} = "${rule.pattern_value}" → ${rule.correct_category}`, {
        emailId: email.id,
        ruleKey: rule._key,
      });

      // Update rule match statistics (async, don't await)
      updateRuleMatchStats(orgId, rule._key, email.id).catch(err =>
        console.warn('[Email Classifier] Failed to update rule stats:', err)
      );

      return {
        matched: true,
        rule,
        category: rule.correct_category as EmailCategory,
        confidence: rule.confidence_override || 0.99,
      };
    }
  }

  return { matched: false };
}

/**
 * Update rule match statistics (called async, don't await)
 */
async function updateRuleMatchStats(orgId: string, ruleKey: string, emailId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', orgId)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) return;

    // Get current rule
    const { data: memory } = await supabase
      .from('agent_memories')
      .select('content')
      .eq('tenant_id', tenantId)
      .eq('key', ruleKey)
      .single();

    if (!memory) return;

    const rule = memory.content;
    const updatedContent = {
      ...rule,
      match_count: (rule.match_count || 0) + 1,
      last_matched_at: new Date().toISOString(),
      last_matched_email_id: emailId,
    };

    await supabase
      .from('agent_memories')
      .update({
        content: updatedContent,
        last_used_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('key', ruleKey);

    console.log(`[Email Classifier] Updated rule stats for ${ruleKey}: ${updatedContent.match_count} matches`);
  } catch (error) {
    // Silent fail - stats update is not critical
    console.debug('[Email Classifier] Failed to update rule match stats:', error);
  }
}

/**
 * Classifies an email using Claude Sonnet 4.5 with user-defined rules
 * Based on Lindy.ai classification rules + learned preferences
 */
export async function classifyEmail(
  email: GmailMessage,
  context?: {
    orgId?: string; // Required for fetching classification rules
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

    // Fetch user-defined classification rules (with caching)
    const rules = context?.orgId ? await fetchClassificationRules(context.orgId) : [];
    console.log(`[Email Classifier] Loaded ${rules.length} classification rules`);

    // Check if email matches any user-defined rules (fast path)
    const ruleMatch = context?.orgId
      ? await checkClassificationRules(email, rules, context.orgId)
      : { matched: false };

    if (ruleMatch.matched && ruleMatch.category) {
      console.log(`[Email Classifier] Email matched rule - returning ${ruleMatch.category} with confidence ${ruleMatch.confidence}`);
      return {
        category: ruleMatch.category,
        confidence: ruleMatch.confidence || 0.99,
        intent: ruleMatch.rule.reason || 'Matched user-defined classification rule',
        entities: {},
        shouldEscalate: false,
        reasoning: `User-defined rule: ${ruleMatch.rule.pattern_type} = "${ruleMatch.rule.pattern_value}" → ${ruleMatch.category}. Reason: ${sanitizeForPrompt(ruleMatch.rule.reason, 200)}`,
      };
    }

    // No rule match - use AI classification with rules as context
    const prompt = buildClassificationPrompt(email, context, rules);

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
 * Builds the classification prompt for Claude with user-defined rules
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
  },
  userRules?: any[]
): string {
  // Sanitize email content to prevent prompt injection
  const sanitizedSubject = sanitizeSubject(email.subject);
  const sanitizedSnippet = sanitizeForAI(email.snippet || '');
  const sanitizedBody = email.bodyText
    ? sanitizeForAI(sanitizeEmailBody(email.bodyText).substring(0, 2000))
    : '';

  // Build user-defined rules section (with sanitization to prevent prompt injection)
  let rulesSection = '';
  if (userRules && userRules.length > 0) {
    rulesSection = `
USER-DEFINED CLASSIFICATION RULES (HIGH PRIORITY - Check these first!):
${userRules
  .map(
    (rule, idx) =>
      `${idx + 1}. ${rule.pattern_type} matching "${sanitizeForPrompt(rule.pattern_value, 100)}" → ${rule.correct_category}
   Reason: ${sanitizeForPrompt(rule.reason, 300)}`
  )
  .join('\n')}

⚠️ IMPORTANT: If this email matches any of the above rules, use that category with high confidence (0.99).
`;
  }

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
${rulesSection}
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
