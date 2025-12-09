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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return Response.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Get recent chat memory
    const { data: memories } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
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

    // Build system prompt with current date in Eastern Time (New York)
    const currentDate = new Date();
    const estDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York'
    });
    const estTime = currentDate.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });

    const systemPrompt = `You are an AI Account Manager assistant for a property appraisal management company. You help manage client relationships, track goals, and coordinate outreach.

## Current Date & Time (Eastern Time - New York)
${currentDate.toISOString()}
Date: ${estDate}
Time: ${estTime}

Your capabilities:

**Data Access:**
- Search for clients and their information (searchClients)
- Search for individual contacts by name, email, or title (searchContacts)
- Get client activity history (getClientActivity)
- Check goal progress and performance (getGoals)
- Get pending actions that need review (getPendingCards)
- Get ALL current Kanban cards to see what exists (getAllCards) - USE THIS to verify card existence
- Search the knowledge base for past interactions and context (searchKnowledge)

**Card Management:**
- Create action cards (emails, tasks, calls, deals) (createCard)
- Update existing cards - change state, priority, title (updateCard)
- Delete cards by ID, priority, type, or title match (deleteCard)

**Case Management:**
- Create support cases for issues and requests (createCase)
- Update case status, priority, or resolution (updateCase)
- Delete cases when no longer needed (deleteCase)

**Activity Logging:**
- Log completed activities (calls, emails, meetings, notes) (createActivity)

**Contact Management:**
- Create new contacts for clients (createContact)
- Delete contacts from the system (deleteContact)

**Database Creation:**
- Create new clients/customers (createClient)
- Create new contacts for clients (createContact)
- Create new properties (createProperty)
- Create new appraisal orders (createOrder)

**Code & Development:**
- Read files from the codebase (readFile)
- Write new files or overwrite existing ones (writeFile)
- Edit files by replacing specific text (editFile)
- List files matching patterns (listFiles)
- Search for code patterns across the codebase (searchCode)
- Run shell commands, tests, and npm scripts (runCommand)

**Research & Web:**
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
- ALWAYS use tools to get accurate, up-to-date information - NEVER assume or hallucinate data
- When user asks about cards, ALWAYS use getAllCards or getPendingCards to check current state
- When asked about contacts, use searchContacts to find individual people
- When asked about clients/companies, use searchClients to find organizations
- When creating cards, provide clear rationales
- When deleting/updating cards, ALWAYS fetch current cards first with getAllCards
- Reference specific data points when available
- Suggest next steps proactively
- If you use RAG context, cite the source

**CRITICAL - Tool Response Validation:**
- ALWAYS check the 'success' field in tool responses before claiming an action succeeded
- If success === false, inform the user the action FAILED and explain the error
- After creating a card, VERIFY it exists by checking the returned card.id
- NEVER tell the user you created something if the tool returned success: false or error: "..."
- If a tool fails, explain WHY it failed (e.g., "The email address was invalid" or "The card couldn't be created")
- Example: If createCard returns {success: false, error: "Email must include a valid to address"}, tell the user "I couldn't create the card because the email address was invalid"

**Contact Creation Workflow:**
- To add a contact: FIRST use searchClients to get the client UUID, THEN use createContact with that UUID
- NEVER create cards for adding contacts - use the createContact tool directly
- If the client doesn't exist, inform the user (don't create placeholder cards)

CRITICAL: Never claim to "check" something without actually using a tool. If you need current data, use the appropriate tool first.

Remember: You're helping achieve business goals. Be strategic and data-driven.`;

    // Stream response with tools
    // NOTE: This endpoint is deprecated - use /api/agent/chat-direct instead
    // The direct Anthropic SDK endpoint has better tool calling support
    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
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

    // Use AI SDK's built-in text stream response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    console.error('[Chat API] Error stack:', error.stack);
    return Response.json(
      { error: error.message || 'Chat failed', details: error.toString() },
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

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  if (!profile?.tenant_id) {
    console.error('saveConversationMemory: User has no tenant_id assigned');
    return;
  }

  // Create a summary key based on timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const key = `chat_${timestamp}_${messages.length}`;

  // Store last few messages as memory
  const recentMessages = messages.slice(-4); // Last 4 messages

  await supabase
    .from('agent_memories')
    .upsert({
      org_id: orgId,
      tenant_id: profile.tenant_id,
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

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  if (!profile?.tenant_id) {
    console.error('saveChatMessages: User has no tenant_id assigned');
    return;
  }

  // Only save the last message (to avoid duplicates)
  const lastMessage = messages[messages.length - 1];

  if (lastMessage) {
    await supabase.from('chat_messages').insert({
      org_id: orgId,
      tenant_id: profile.tenant_id,
      role: lastMessage.role,
      content: lastMessage.content,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

