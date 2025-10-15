import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

/**
 * POST /api/agent/chat-simple
 * Simple chat without tools (for testing)
 */
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get goals for context
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    // Get clients for context
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name, primary_contact, email')
      .eq('is_active', true);

    // Build system prompt with inline data
    const systemPrompt = `You are an AI Account Manager assistant for a property appraisal management company.

Current context:
- User: ${user.email}
- Active goals: ${goals?.length || 0}
- Active clients: ${clients?.length || 0}

Goals:
${goals?.map((g: any) => `- ${g.metric_type}: Target ${g.target_value}, Period: ${g.period_type}`).join('\n') || 'No active goals'}

Clients:
${clients?.map((c: any) => `- ${c.company_name} (${c.email || 'no email'})`).join('\n') || 'No active clients'}

You help manage client relationships and achieve business goals. Be helpful, concise, and action-oriented.`;

    // Stream response WITHOUT tools for now
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}

