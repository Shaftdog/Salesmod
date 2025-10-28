import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { simpleAgentTools } from '@/lib/agent/tools-simple';

export const maxDuration = 60;

/**
 * POST /api/agent/chat-test
 * Test endpoint with minimal tools
 */
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const systemPrompt = `You are an AI Account Manager assistant.

When users ask you to create a card, use the createCard tool to actually create it in the database.

For example:
- User: "Create an email card for iFund Cities about Q4 orders"
- You: Call createCard tool with appropriate parameters

Be helpful and use the tool when appropriate.`;

    console.log('[Chat Test] Starting with simple tools...');

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      tools: simpleAgentTools,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Convert to text stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
              controller.enqueue(new TextEncoder().encode(part.textDelta));
            } else if (part.type === 'tool-call') {
              console.log('[Chat Test] Tool call:', part.toolName, part.args);
            } else if (part.type === 'tool-result') {
              console.log('[Chat Test] Tool result:', part.toolName, part.result);
            }
          }
          controller.close();
        } catch (error) {
          console.error('[Chat Test] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('[Chat Test] Error:', error);
    return Response.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}


