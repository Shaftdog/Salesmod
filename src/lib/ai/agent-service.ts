/**
 * AI Agent Service Layer
 * 
 * Handles all AI interactions including prompt generation,
 * API calls, token management, and error handling.
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type DraftType = 'email' | 'note' | 'internal_memo' | 'follow_up'
export type SuggestionType = 'follow_up' | 'deal_action' | 'task_create' | 'status_check' | 'upsell'

export interface ClientContext {
  client: {
    name: string
    company?: string
    email?: string
    tags?: string[]
  }
  engagement: {
    lastContactDate: string | null
    daysSinceLastContact: number | null
    totalActivitiesLast30Days: number
  }
  recentActivities: Array<{
    type: string
    subject: string
    date: string
    notes?: string
  }>
  deals: {
    total: number
    totalValue: number
    stalled: Array<{
      title: string
      stage: string
      value: number
      daysSinceUpdate: number
    }>
  }
  tasks: {
    total: number
    overdue: number
    upcoming: number
  }
  insights: {
    needsFollowUp: boolean
    hasStalledDeals: boolean
    hasOverdueTasks: boolean
    isHighValue: boolean
  }
}

export interface GenerateDraftOptions {
  draftType: DraftType
  context: ClientContext
  contextHints?: string
  tone?: 'professional' | 'friendly' | 'formal'
}

export interface DraftResult {
  subject?: string
  content: string
  reasoning: string
  tokensUsed: number
}

export interface SuggestionResult {
  type: SuggestionType
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  reasoning: string
  actionData: Record<string, any>
}

/**
 * Prompt Templates
 */
const PROMPT_TEMPLATES = {
  followUpEmail: (context: ClientContext, hints?: string) => `
You are a professional account manager drafting a follow-up email to a client.

CLIENT INFORMATION:
- Name: ${context.client.name}
- Company: ${context.client.company || 'N/A'}
- Tags: ${context.client.tags?.join(', ') || 'None'}

ENGAGEMENT HISTORY:
- Last contact: ${context.engagement.lastContactDate ? new Date(context.engagement.lastContactDate).toLocaleDateString() : 'No recent contact'}
- Days since last contact: ${context.engagement.daysSinceLastContact || 'Unknown'}
- Activities in last 30 days: ${context.engagement.totalActivitiesLast30Days}

RECENT INTERACTIONS:
${context.recentActivities.slice(0, 3).map(a => `- ${a.type}: ${a.subject} (${new Date(a.date).toLocaleDateString()})`).join('\n')}

ACTIVE DEALS:
- Total active deals: ${context.deals.total}
- Total value: $${context.deals.totalValue.toLocaleString()}
${context.deals.stalled.length > 0 ? `- Stalled deals: ${context.deals.stalled.map(d => d.title).join(', ')}` : ''}

TASKS:
- Pending: ${context.tasks.total}
- Overdue: ${context.tasks.overdue}

${hints ? `ADDITIONAL CONTEXT:\n${hints}\n` : ''}

INSTRUCTIONS:
Write a professional but warm follow-up email that:
1. References recent interactions naturally
2. Provides value (not just checking in)
3. Has a clear call-to-action
4. Is concise (100-150 words)
5. Maintains a ${hints?.includes('formal') ? 'formal' : 'friendly professional'} tone

Format your response as JSON:
{
  "subject": "Email subject line",
  "content": "Email body",
  "reasoning": "Brief explanation of your approach"
}
`,

  checkInNote: (context: ClientContext, hints?: string) => `
You are an account manager writing an internal note about a client check-in.

CLIENT: ${context.client.name} (${context.client.company || 'Individual'})

CURRENT SITUATION:
- Last contact: ${context.engagement.daysSinceLastContact || 'Unknown'} days ago
- Active deals: ${context.deals.total} (${context.deals.stalled.length} stalled)
- Pending tasks: ${context.tasks.total} (${context.tasks.overdue} overdue)

${hints ? `CONTEXT: ${hints}\n` : ''}

Write a brief internal note (50-100 words) summarizing:
1. Current relationship status
2. Any concerns or opportunities
3. Recommended next steps

Format as JSON:
{
  "content": "Note content",
  "reasoning": "Key factors considered"
}
`,

  dealProgressEmail: (context: ClientContext, hints?: string) => `
You are an account manager providing an update on deal progress.

CLIENT: ${context.client.name}
ACTIVE DEALS: ${context.deals.total}
TOTAL PIPELINE VALUE: $${context.deals.totalValue.toLocaleString()}

${context.deals.stalled.length > 0 ? `STALLED DEALS:\n${context.deals.stalled.map(d => `- ${d.title}: ${d.stage} (${d.daysSinceUpdate} days no update)`).join('\n')}` : ''}

${hints || 'Write an update on deal progress.'}

Draft an email (100-150 words) that:
1. Provides a clear status update
2. Addresses any delays or concerns
3. Outlines next steps
4. Maintains optimism and professionalism

Format as JSON:
{
  "subject": "Subject line",
  "content": "Email body",
  "reasoning": "Strategy behind this communication"
}
`,
}

/**
 * Generate AI draft communication
 */
export async function generateDraft(options: GenerateDraftOptions): Promise<DraftResult> {
  try {
    // Select appropriate prompt template
    let systemPrompt = ''
    let userPrompt = ''

    switch (options.draftType) {
      case 'follow_up':
      case 'email':
        userPrompt = PROMPT_TEMPLATES.followUpEmail(options.context, options.contextHints)
        systemPrompt = 'You are an expert account manager specializing in client relationships and communication.'
        break
      case 'note':
      case 'internal_memo':
        userPrompt = PROMPT_TEMPLATES.checkInNote(options.context, options.contextHints)
        systemPrompt = 'You are an account manager documenting client interactions and strategies.'
        break
      default:
        throw new Error(`Unsupported draft type: ${options.draftType}`)
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(response)
    
    return {
      subject: parsed.subject || undefined,
      content: parsed.content,
      reasoning: parsed.reasoning || 'Generated based on client context',
      tokensUsed: completion.usage?.total_tokens || 0,
    }

  } catch (error) {
    console.error('Error generating AI draft:', error)
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is missing or invalid. Please check your environment variables.')
      }
      if (error.message.includes('rate_limit')) {
        throw new Error('AI service rate limit exceeded. Please try again in a moment.')
      }
    }
    
    throw new Error('Failed to generate draft. Please try again.')
  }
}

/**
 * Analyze client context and generate suggestions
 */
export async function generateSuggestions(context: ClientContext): Promise<SuggestionResult[]> {
  try {
    const prompt = `
Analyze this client data and suggest proactive actions:

CLIENT: ${context.client.name} (${context.client.company || 'Individual'})
LAST CONTACT: ${context.engagement.daysSinceLastContact || 'Unknown'} days ago
ACTIVE DEALS: ${context.deals.total} (Value: $${context.deals.totalValue.toLocaleString()})
STALLED DEALS: ${context.deals.stalled.length}
PENDING TASKS: ${context.tasks.total} (${context.tasks.overdue} overdue)

INSIGHTS:
- Needs follow-up: ${context.insights.needsFollowUp ? 'YES' : 'No'}
- Has stalled deals: ${context.insights.hasStalledDeals ? 'YES' : 'No'}
- Has overdue tasks: ${context.insights.hasOverdueTasks ? 'YES' : 'No'}
- High value client: ${context.insights.isHighValue ? 'YES' : 'No'}

RECENT ACTIVITY:
${context.recentActivities.slice(0, 3).map(a => `- ${a.type}: ${a.subject}`).join('\n')}

Based on this data, suggest 2-4 proactive actions. Consider:
1. Communication gaps (no contact >7 days)
2. Stalled deals (no progress >14 days)
3. Overdue tasks
4. Upsell opportunities for high-value clients

For each suggestion, provide:
- type: 'follow_up' | 'deal_action' | 'task_create' | 'status_check' | 'upsell'
- priority: 'low' | 'medium' | 'high'
- title: Brief action title
- description: What to do (1-2 sentences)
- reasoning: Why this suggestion (1-2 sentences)
- actionData: Relevant data for executing the action

Respond with JSON array:
[{
  "type": "follow_up",
  "priority": "high",
  "title": "...",
  "description": "...",
  "reasoning": "...",
  "actionData": {}
}]
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI assistant helping account managers prioritize their work. Suggest only the most impactful actions.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(response)
    
    // Handle both array and object with suggestions array
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || []
    
    return suggestions.filter((s: any) => 
      s.type && s.priority && s.title && s.description && s.reasoning
    )

  } catch (error) {
    console.error('Error generating suggestions:', error)
    
    // Return empty array on error rather than throwing
    // This allows the app to continue functioning
    return []
  }
}

/**
 * Estimate token cost for a context
 */
export function estimateTokens(context: ClientContext): number {
  // Rough estimation: 1 token ≈ 4 characters
  const contextStr = JSON.stringify(context)
  return Math.ceil(contextStr.length / 4)
}

/**
 * Check if AI service is available
 */
export async function checkAIServiceHealth(): Promise<{ available: boolean; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { 
        available: false, 
        error: 'OpenAI API key not configured' 
      }
    }

    // Simple test call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    })

    return { available: true }
  } catch (error) {
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

