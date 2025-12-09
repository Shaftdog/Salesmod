import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { AgentContext } from './context-builder';

// Schema for a single action plan
const ActionSchema = z.object({
  type: z.enum(['send_email', 'research', 'create_task', 'follow_up', 'create_deal']),
  clientId: z.string(),
  contactId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  title: z.string(),
  rationale: z.string().describe('Clear explanation of why this action is recommended'),
  emailDraft: z.object({
    to: z.string(), // Relaxed from .email() to allow any string
    subject: z.string().min(5),
    body: z.string().min(20).describe('HTML email body'),
    replyTo: z.string().optional(), // Relaxed from .email()
  }).optional(),
  taskDetails: z.object({
    description: z.string(),
    dueDate: z.string().optional(),
  }).optional(),
  dealDetails: z.object({
    title: z.string(),
    value: z.number().optional(),
    stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation']),
    description: z.string().optional(),
  }).optional(),
});

// Schema for the complete plan
const PlanSchema = z.object({
  actions: z.array(ActionSchema).min(0).max(10), // Allow 0-10 actions
  summary: z.string().describe('Brief summary of the proposed plan'),
  goalAlignment: z.string().describe('How these actions align with current goals'),
});

export type ProposedAction = z.infer<typeof ActionSchema>;
export type AgentPlan = z.infer<typeof PlanSchema>;

/**
 * Generate an action plan using LLM based on context
 */
export async function generatePlan(context: AgentContext): Promise<AgentPlan> {
  const prompt = buildPlanningPrompt(context);

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: PlanSchema,
      prompt,
      temperature: 0.5, // Reduced for more consistent output
    });

    console.log('AI Plan generated:', {
      actionsCount: object.actions.length,
      summary: object.summary,
    });

    return object;
  } catch (error: any) {
    console.error('AI plan generation failed:', error);
    console.error('Context clients count:', context.clients.length);
    console.error('Context goals count:', context.goals.length);
    
    // Return empty plan as fallback
    return {
      actions: [],
      summary: 'No actions generated due to AI error',
      goalAlignment: 'Unable to generate plan - check logs for details',
    };
  }
}

/**
 * Build the planning prompt for the LLM
 */
function buildPlanningPrompt(context: AgentContext): string {
  const {
    goals,
    clients,
    properties,
    cases,
    allOrders,
    signals,
    memories,
    currentTime,
  } = context;

  // Format goals section
  const goalsText = goals.map(g => {
    const status = g.progress >= 100 ? '✓ On track' : g.pressureScore > 0.5 ? '⚠ Behind schedule' : '→ In progress';
    return `- ${g.goal.metricType}: ${g.progress.toFixed(1)}% complete (Target: ${g.goal.targetValue}, Gap: ${g.gapToTarget.toFixed(0)}, ${g.daysRemaining} days left) ${status}`;
  }).join('\n');

  // Format top clients with recent activity details
  // Show up to 25 clients for more variety
  const topClients = clients.slice(0, 25);
  const clientsText = topClients.map(c => {
    const primaryContact = c.contacts.find((ct: any) => ct.isPrimary) || c.contacts[0];
    const hasContactsWithEmail = c.contacts.some((ct: any) => ct.email);
    const needsContactResearch = !hasContactsWithEmail;

    // Show recent activities to prevent duplicates
    const recentActivitySummary = c.recentActivities && c.recentActivities.length > 0
      ? c.recentActivities.slice(0, 5).map((a: any) => {
          const activityDate = new Date(a.createdAt);
          const hoursAgo = Math.floor((currentTime.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
          const timeAgo = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
          return `    • ${a.activityType}: ${a.subject || 'No subject'} (${timeAgo})`;
        }).join('\n')
      : '    • No recent activities';

    // Show contact status clearly
    const contactStatus = needsContactResearch
      ? '⚠️ NO CONTACTS WITH EMAIL - Use RESEARCH to find contacts first'
      : primaryContact
        ? `${primaryContact.firstName} ${primaryContact.lastName} <${primaryContact.email}>`
        : 'None';

    return `
**${c.client.companyName}** (ID: ${c.client.id})
- Primary Contact: ${contactStatus}
- Last Engagement: ${c.lastContactDays === 0 ? 'TODAY (DO NOT CONTACT)' : c.lastContactDays === 999 ? 'Never' : `${c.lastContactDays} days ago`}
- Total Contacts: ${c.contacts.length} (${c.contacts.filter((ct: any) => ct.email).length} with email)
- Recent Orders: ${c.recentOrders.length}
- Engagement Score: ${(c.engagementScore * 100).toFixed(0)}%
- RFM Score: ${(c.rfmScore * 100).toFixed(0)}%
- Priority Score: ${c.priorityScore.toFixed(1)}
- Recent Activities (AVOID DUPLICATING):
${recentActivitySummary}
`;
  }).join('\n');

  // Format signals
  const signalsText = `
Recent Activity (Last 7 Days):
- Email Opens: ${signals.emailOpens}
- Email Clicks: ${signals.emailClicks}
- Email Replies: ${signals.emailReplies}
- Meetings Booked: ${signals.meetingsBooked}
- Orders Created: ${signals.ordersCreated}
- Deals Advanced: ${signals.dealsAdvanced}
`;

  // Separate card feedback from other memories
  const cardFeedback = memories.filter(m => m.key.includes('rejection_') || m.key.includes('deletion_'));
  const otherMemories = memories.filter(m => !m.key.includes('rejection_') && !m.key.includes('deletion_'));

  // Format card rejection feedback
  const feedbackText = cardFeedback.length > 0
    ? cardFeedback.slice(0, 10).map(m => {
        const content = typeof m.content === 'object' ? m.content : {};
        return `- ${content.reason || 'Feedback'}: ${content.rule || 'No specific rule'} (Importance: ${(m.importance * 100).toFixed(0)}%)`;
      }).join('\n')
    : 'No previous rejection feedback';

  // Extract avoidance rules - sort by importance to keep most critical rules
  const avoidanceRules = cardFeedback
    .filter(m => typeof m.content === 'object' && m.content.rule)
    .sort((a, b) => (b.importance || 0) - (a.importance || 0)) // Most important first
    .map(m => `- ${m.content.rule}`)
    .slice(0, 50); // Future-proofed to handle up to 50 rules
  const avoidanceRulesText = avoidanceRules.length > 0
    ? avoidanceRules.join('\n')
    : 'No specific avoidance rules';

  // Format other relevant memories
  const memoriesText = otherMemories.slice(0, 10).map(m =>
    `- ${m.key}: ${JSON.stringify(m.content).substring(0, 100)}...`
  ).join('\n');

  // Format properties summary
  const propertiesSummary = `
Total Properties: ${properties.length}
Property Types: ${Array.from(new Set(properties.map((p: any) => p.property_type))).join(', ')}
Top Locations: ${Array.from(new Set(properties.slice(0, 50).map((p: any) => p.city))).slice(0, 10).join(', ')}
`;

  // Format cases summary
  const openCases = cases.filter((c: any) => ['new', 'open', 'in_progress'].includes(c.status));
  const highPriorityCases = cases.filter((c: any) => ['high', 'urgent', 'critical'].includes(c.priority));
  const casesSummary = `
Total Cases: ${cases.length}
Open Cases: ${openCases.length}
High Priority Cases: ${highPriorityCases.length}
Case Types: ${Array.from(new Set(cases.map((c: any) => c.case_type))).join(', ')}
${highPriorityCases.length > 0 ? `\n⚠️ High Priority Cases:\n${highPriorityCases.slice(0, 5).map((c: any) => `  - ${c.subject} (${c.priority}) - ${c.status}`).join('\n')}` : ''}
`;

  // Format order history summary
  const recentOrders = allOrders.slice(0, 100); // Last 100 orders
  const ordersByStatus = {
    completed: allOrders.filter(o => o.status === 'completed').length,
    new: allOrders.filter(o => o.status === 'new').length,
    in_progress: allOrders.filter(o => ['in_progress', 'assigned', 'scheduled'].includes(o.status || '')).length,
    in_review: allOrders.filter(o => ['in_review', 'revisions'].includes(o.status || '')).length,
  };
  const ordersSummary = `
Total Orders (Recent 3000): ${allOrders.length}
Status Breakdown: Completed: ${ordersByStatus.completed}, In Progress: ${ordersByStatus.in_progress}, In Review: ${ordersByStatus.in_review}, New: ${ordersByStatus.new}
Recent Activity: ${recentOrders.length} orders in latest batch
`;

  return `You are an AI Account Manager for a property appraisal management company. Your job is to proactively manage client relationships, drive revenue, and help achieve organizational goals.

## Current Date & Time
${currentTime.toISOString()}

## Organizational Goals
${goalsText}

## Top Priority Clients (ranked by urgency and opportunity)
${clientsText}

## Property Portfolio Overview
${propertiesSummary}

## Support Cases Overview
${casesSummary}

## Order History Overview
${ordersSummary}

## Recent Engagement Signals
${signalsText}

## Card Rejection Feedback (Learn from Past Mistakes)
${feedbackText}

## Avoidance Rules (MUST Follow)
${avoidanceRulesText}

## Other Relevant Memories & Context
${memoriesText || 'No other relevant memories'}

## Your Task
Analyze the current situation and propose 3-7 high-impact actions to achieve the goals. Focus on:

1. **NO DUPLICATES - CRITICAL**: Check each client's "Recent Activities" list above. If you see a recent activity (especially within the last 24 hours), DO NOT create another action of the same type for that client. For example, if you see "research: Research Complete" in the last 24h, DO NOT propose another research card for that client.
2. **Learn from Feedback**: Review the "Card Rejection Feedback" and "Avoidance Rules" sections above. Do NOT create cards that will be rejected for the same reasons.
3. **Goal-Driven**: Prioritize actions that directly move the needle on behind-schedule goals
4. **High-Value Clients**: Target clients with high RFM scores and recent engagement
5. **Re-engagement**: Reach out to previously active clients who haven't been contacted recently (>10 days)
6. **Nurture Pipeline**: Follow up on deals in progress, propose new opportunities
7. **Smart Timing**: STRICT RULE - If "Last Engagement" shows "TODAY" or "0 days ago", skip that client entirely. If less than 3 days, strongly prefer other clients.
8. **Personalization**: Use client context to craft relevant, specific messages
9. **Case Management**: Address high-priority or urgent support cases that need attention
10. **Service Recovery**: Follow up with clients who have open complaints or quality concerns
11. **Quality Over Quantity**: Better to create 3 excellent cards than 7 mediocre ones that will be rejected

## Action Types Available
- **send_email**: Reach out via email (follow-ups, check-ins, proposals). REQUIRES a contact with email address.
- **research**: AUTOMATED research about a client using web search and AI analysis. This will:
  - Search for company information and contacts
  - Extract contact details (name, email, title) from web results
  - AUTOMATICALLY CREATE new contacts in the database
  - Save research summary to activities
  Use this for clients marked "NO CONTACTS WITH EMAIL" or when you need to find more people at a company.
- **create_task**: Create a task for manual human actions (calls, meetings, in-person visits, physical mail, manual data entry)
- **follow_up**: Follow up on a previous interaction or order
- **create_deal**: Create a new deal opportunity in the pipeline

## CRITICAL: Contact Availability Rules
- **If client shows "NO CONTACTS WITH EMAIL"**: You MUST use **research** first to find contacts. DO NOT create send_email cards for these clients.
- **If client has contacts with email**: You can create send_email cards
- Research cards will automatically find and create contacts, then you can email them in the next run

## Important Notes
- For calls or meetings: Use **create_task** to request the user schedule and conduct them
- For finding contacts: Use **research** - it automatically finds and creates contacts from web search
- Only use **create_task** for actions that truly require human presence or manual work
- Spread actions across MANY different clients - don't focus on the same 3-5 clients repeatedly

## Email Best Practices
- Keep subject lines clear and actionable
- Body should be professional, concise, personalized
- Include clear CTA (call-to-action)
- Reference recent context when available (orders, previous conversations)
- Use CLEAR FORMATTING:
  * Separate paragraphs with double line breaks
  * For lists, use "1. ", "2. ", "3. " at the start of lines
  * Keep each list item on its own line
  * Structure: Opening paragraph, numbered list (if applicable), closing paragraph
  * Example format:
    "Opening text.
    
    1. First point
    2. Second point
    3. Third point
    
    Closing text."

## Priority Guidelines
- **High**: Direct goal impact, VIP clients, urgent timing
- **Medium**: Good opportunities, regular clients, standard follow-ups
- **Low**: Exploratory, lower-value clients, nice-to-have

## CRITICAL: Action Requirements
Generate a plan with specific, actionable items. Each action MUST include:
- **type**: The action type (send_email, create_task, etc.)
- **title**: Brief title for the action
- **rationale**: Clear explanation of WHY this action is recommended (separate from email content)
- **For send_email actions**: You MUST include the complete emailDraft object with:
  - **to**: Recipient email address
  - **subject**: Complete email subject line (at least 5 characters)
  - **body**: Complete HTML email body (at least 20 characters, use <p>, <strong>, <ul>, <li> tags)
  - **replyTo**: (optional) Reply-to address
- **For create_task actions**: Include taskDetails with description and optional dueDate
- **For create_deal actions**: Include dealDetails with title, stage, and optional value/description

IMPORTANT: For send_email actions, the rationale field should explain WHY you're sending the email (business reasoning), while the emailDraft.body contains the ACTUAL email message to send. These are separate fields!

Remember: You're in **Review Mode**, so all actions will be reviewed by a human before execution. Be thoughtful and strategic.`;
}

/**
 * Validate a plan against business rules
 */
export function validatePlan(plan: AgentPlan, context: AgentContext): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check action count
  if (plan.actions.length === 0) {
    warnings.push('Plan contains no actions - may be appropriate if no opportunities exist');
  }

  if (plan.actions.length > 10) {
    errors.push('Plan cannot contain more than 10 actions');
  }

  // Validate each action
  plan.actions.forEach((action, index) => {
    // Check client exists
    const client = context.clients.find(c => c.client.id === action.clientId);
    if (!client) {
      errors.push(`Action ${index + 1}: Client ${action.clientId} not found`);
      return;
    }

    // Check for recent contact (warning only)
    if (client.lastContactDays < 3) {
      warnings.push(`Action ${index + 1}: Client ${client.client.companyName} was contacted recently (${client.lastContactDays} days ago)`);
    }

    // Validate email actions
    if (action.type === 'send_email') {
      if (!action.emailDraft) {
        errors.push(`Action ${index + 1} "${action.title}": Email action MUST include emailDraft with subject and body. The rationale field should only contain WHY you're sending the email, not the email content itself.`);
        console.error('Missing emailDraft for send_email action:', {
          title: action.title,
          rationale: action.rationale,
        });
      } else {
        if (!action.emailDraft.subject || action.emailDraft.subject.length < 5) {
          errors.push(`Action ${index + 1} "${action.title}": Email subject is required and must be at least 5 characters`);
        }
        if (!action.emailDraft.body || action.emailDraft.body.length < 20) {
          errors.push(`Action ${index + 1} "${action.title}": Email body is required and must be at least 20 characters`);
        }
        // Check for contact email
        if (action.contactId) {
          const contact = client.contacts.find(c => c.id === action.contactId);
          if (!contact || !contact.email) {
            errors.push(`Action ${index + 1}: Contact has no email address`);
          }
        } else if (!client.client.email) {
          errors.push(`Action ${index + 1}: Client has no email address`);
        }
      }
    }

    // Validate task actions
    if (action.type === 'create_task' && !action.taskDetails) {
      errors.push(`Action ${index + 1}: Task action must include taskDetails`);
    }

    // Validate deal actions
    if (action.type === 'create_deal' && !action.dealDetails) {
      errors.push(`Action ${index + 1}: Deal action must include dealDetails`);
    }

    // Check rationale quality
    if (action.rationale.length < 20) {
      warnings.push(`Action ${index + 1}: Rationale seems too brief (${action.rationale.length} chars)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}


