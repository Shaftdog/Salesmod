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
      model: anthropic('claude-3-5-sonnet-20241022'),
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

  // Format top clients
  const topClients = clients.slice(0, 15);
  const clientsText = topClients.map(c => {
    const primaryContact = c.contacts.find((ct: any) => ct.isPrimary) || c.contacts[0];
    return `
**${c.client.companyName}** (ID: ${c.client.id})
- Primary Contact: ${primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName} <${primaryContact.email}>` : 'None'}
- Last Contact: ${c.lastContactDays} days ago
- Recent Orders: ${c.recentOrders.length}
- Engagement Score: ${(c.engagementScore * 100).toFixed(0)}%
- RFM Score: ${(c.rfmScore * 100).toFixed(0)}%
- Priority Score: ${c.priorityScore.toFixed(1)}
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

  // Format relevant memories
  const memoriesText = memories.slice(0, 10).map(m =>
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

## Relevant Memories & Context
${memoriesText || 'No relevant memories'}

## Your Task
Analyze the current situation and propose 3-7 high-impact actions to achieve the goals. Focus on:

1. **Goal-Driven**: Prioritize actions that directly move the needle on behind-schedule goals
2. **High-Value Clients**: Target clients with high RFM scores and recent engagement
3. **Re-engagement**: Reach out to previously active clients who haven't been contacted recently (>10 days)
4. **Nurture Pipeline**: Follow up on deals in progress, propose new opportunities
5. **Smart Timing**: Avoid clients contacted in the last 3-5 days
6. **Personalization**: Use client context to craft relevant, specific messages
7. **Case Management**: Address high-priority or urgent support cases that need attention
8. **Service Recovery**: Follow up with clients who have open complaints or quality concerns

## Action Types Available
- **send_email**: Reach out via email (follow-ups, check-ins, proposals)
- **research**: Gather intelligence about a client (market activity, portfolio changes, expansion plans)
- **create_task**: Create a task for any action requiring human completion (calls, meetings, preparation, analysis, etc.)
- **follow_up**: Follow up on a previous interaction or order
- **create_deal**: Create a new deal opportunity in the pipeline

## Important Notes
- For calls or meetings: Use **create_task** to request the user schedule and conduct them
- Only use actions that can be fully executed automatically (emails, research, deals)
- Tasks are for actions that require human involvement

## Email Best Practices
- Keep subject lines clear and actionable
- Body should be professional, concise, personalized
- Include clear CTA (call-to-action)
- Reference recent context when available (orders, previous conversations)
- Use HTML formatting: <p>, <strong>, <ul>, <li> tags

## Priority Guidelines
- **High**: Direct goal impact, VIP clients, urgent timing
- **Medium**: Good opportunities, regular clients, standard follow-ups
- **Low**: Exploratory, lower-value clients, nice-to-have

Generate a plan with specific, actionable items. Each action should include:
- Clear rationale tied to goals and client context
- For emails: complete draft with subject and body
- For tasks: specific description and due date

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
        errors.push(`Action ${index + 1}: Email action must include emailDraft`);
      } else {
        if (!action.emailDraft.subject || action.emailDraft.subject.length < 5) {
          errors.push(`Action ${index + 1}: Email subject is required and must be at least 5 characters`);
        }
        if (!action.emailDraft.body || action.emailDraft.body.length < 20) {
          errors.push(`Action ${index + 1}: Email body is required and must be at least 20 characters`);
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


