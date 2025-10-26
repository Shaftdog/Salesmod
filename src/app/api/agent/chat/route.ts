import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { searchRAG, buildRAGContext } from '@/lib/agent/rag';
import { agentTools } from '@/lib/agent/tools';

export const maxDuration = 60;

/**
 * POST /api/agent/chat
 * Chat with the AI agent (streaming with tools)
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

    // Get recent chat memory
    const { data: memories } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('org_id', user.id)
      .eq('scope', 'chat')
      .order('last_used_at', { ascending: false })
      .limit(5);

    const memoriesContext = memories && memories.length > 0
      ? `\n## Recent Conversation Context\n${memories.map(m => `- ${m.key}: ${JSON.stringify(m.content).substring(0, 200)}`).join('\n')}`
      : '';

    // Get RAG context if user's message might benefit from it
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    let ragContext = '';

    // Only search RAG for questions or requests for information
    if (
      lastUserMessage.includes('?') ||
      lastUserMessage.toLowerCase().includes('what') ||
      lastUserMessage.toLowerCase().includes('who') ||
      lastUserMessage.toLowerCase().includes('when') ||
      lastUserMessage.toLowerCase().includes('find') ||
      lastUserMessage.toLowerCase().includes('search')
    ) {
      const ragResults = await searchRAG(user.id, lastUserMessage, 3, 0.7);
      if (ragResults.length > 0) {
        ragContext = '\n' + buildRAGContext(ragResults);
      }
    }

    // Build system prompt
    const systemPrompt = `You are an AI Account Manager assistant for a property appraisal management company. You help manage client relationships, track goals, and coordinate outreach.

Your capabilities:
- Search for clients and their information (searchClients)
- Search for individual contacts by name, email, or title (searchContacts)
- Get client activity history (getClientActivity)
- Check goal progress and performance (getGoals)
- Create action cards (emails, tasks, calls, deals) (createCard)
- Search the knowledge base for past interactions and context (searchKnowledge)
- Get pending actions that need review (getPendingCards)
- Search the web for company information (searchWeb)
- Computer Use capabilities for visual research (if enabled):
  - Execute visual browsing tasks (computerUseTask)
  - Research competitor pricing (researchCompetitorPricing)
  - Deep company research (deepCompanyResearch)
  - Check computer use status (checkComputerUseStatus)

Current context:
- User: ${user.email}
- Organization ID: ${user.id}

${memoriesContext}${ragContext}

Guidelines:
- Be helpful, concise, and action-oriented
- Use tools to get accurate, up-to-date information
- When asked about contacts, use searchContacts to find individual people
- When asked about clients/companies, use searchClients to find organizations
- When creating cards, provide clear rationales
- Reference specific data points when available
- Suggest next steps proactively
- If you use RAG context, cite the source

Remember: You're helping achieve business goals. Be strategic and data-driven.`;

    // Stream response with tools
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      tools: agentTools,
      temperature: 0.7,
    });

    // Save conversation to memory asynchronously (don't await)
    saveConversationMemory(user.id, messages, lastUserMessage).catch((err) => {
      console.error('Failed to save conversation memory:', err);
    });

    // Store chat messages
    saveChatMessages(user.id, messages).catch((err) => {
      console.error('Failed to save chat messages:', err);
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

/**
 * Save conversation summary to agent memories
 */
async function saveConversationMemory(
  orgId: string,
  messages: any[],
  lastMessage: string
): Promise<void> {
  const supabase = await createClient();

  // Create a summary key based on timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const key = `chat_${timestamp}_${messages.length}`;

  // Store last few messages as memory
  const recentMessages = messages.slice(-4); // Last 4 messages

  await supabase
    .from('agent_memories')
    .upsert({
      org_id: orgId,
      scope: 'chat',
      key,
      content: {
        messages: recentMessages,
        lastQuery: lastMessage,
        timestamp: new Date().toISOString(),
      },
      importance: 0.7,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      last_used_at: new Date().toISOString(),
    })
    .match({ org_id: orgId, scope: 'chat', key });
}

/**
 * Save individual chat messages to database
 */
async function saveChatMessages(orgId: string, messages: any[]): Promise<void> {
  const supabase = await createClient();

  // Only save the last message (to avoid duplicates)
  const lastMessage = messages[messages.length - 1];

  if (lastMessage) {
    await supabase.from('chat_messages').insert({
      org_id: orgId,
      role: lastMessage.role,
      content: lastMessage.content,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

