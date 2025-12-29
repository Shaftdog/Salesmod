import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { anthropicTools } from '@/lib/agent/anthropic-tool-registry';
import { executeAnthropicTool } from '@/lib/agent/anthropic-tool-executor';
import { CompanyKnowledge } from '@/lib/agent/context-builder';

export const maxDuration = 60;

/**
 * Build company knowledge section for the system prompt
 */
function buildCompanyKnowledgeSection(company: CompanyKnowledge): string {
  const services = company.services.map(s => `  - ${s.name}: ${s.description}`).join('\n');
  const areas = company.serviceAreas.join(', ');
  const team = company.team?.map(t => `  - ${t.name} (${t.role})`).join('\n') || 'Not specified';
  const specializations = company.specializations?.join(', ') || 'Full-service appraisal';

  return `
## YOUR COMPANY - ${company.name}
${company.tagline || ''}

**Contact Information:**
- Address: ${company.address}
- Phone: ${company.phone}
- Email: ${company.email || 'Not specified'}
- Website: ${company.website}

**About Us:**
${company.description}

**Our Services:**
${services}

**Service Areas:**
${areas}

**Our Team:**
${team}

**Specializations:**
${specializations}

**Business Hours:**
${company.businessHours || 'Monday-Friday, 9am-5pm EST'}

IMPORTANT: When clients ask about "you", "your company", "us", or "we" - they mean ${company.name}.
You represent this company and should answer questions about our services, pricing inquiries, and capabilities accordingly.
`;
}

export async function POST(request: NextRequest) {
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = profile?.tenant_id;

    // Fetch company knowledge for this tenant
    let companyKnowledge: CompanyKnowledge | null = null;
    if (tenantId) {
      const { data: companyData } = await supabase
        .from('agent_memories')
        .select('content')
        .eq('tenant_id', tenantId)
        .eq('scope', 'company_knowledge')
        .eq('key', 'company_profile')
        .single();

      companyKnowledge = companyData?.content || null;
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Get current date for the agent in Eastern Time (New York)
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

    // Build company-specific intro or use default
    const companyIntro = companyKnowledge
      ? `You are an AI Account Manager assistant for ${companyKnowledge.name}. You help manage client relationships, track goals, and coordinate outreach.`
      : `You are an AI Account Manager assistant for a property appraisal management company. You help manage client relationships, track goals, and coordinate outreach.`;

    const companySection = companyKnowledge
      ? buildCompanyKnowledgeSection(companyKnowledge)
      : '';

    const systemPrompt = `${companyIntro}

## Current Date & Time (Eastern Time - New York)
${currentDate.toISOString()}
Date: ${estDate}
Time: ${estTime}

Your capabilities:

**Data Access:**
- Search for clients and their information (searchClients)
- Search for individual contacts by name, email, or title (searchContacts)
- Get client activity history (getClientActivity)
- Get ALL current Kanban cards to see what exists (getAllCards)
- Get pending action cards that need review (getPendingCards)

**Card Management:**
- Create action cards (emails, tasks, calls, deals) (createCard)
- Update existing cards - change state, priority, title (updateCard)
- Delete cards by ID, priority, type, or title match (deleteCard)

**Contact Management:**
- Create new contacts for clients (createContact)
- Delete contacts from the system (deleteContact)

**Database Creation:**
- Create new clients/customers (createClient)
- Create new properties (createProperty)
- Create new appraisal orders (createOrder)

**Database Deletion:**
- Delete clients, properties, orders, contacts, tasks, opportunities (various delete tools)

**Code & Development:**
- Read files from the codebase (readFile)
- Write new files or overwrite existing ones (writeFile)
- Edit files by replacing specific text (editFile)
- List files matching patterns (listFiles)
- Search for code patterns across the codebase (searchCode)
- Run shell commands, tests, and npm scripts (runCommand)

**Activity Logging:**
- Log completed activities (calls, emails, meetings, notes) (createActivity)

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

Remember: You're helping achieve business goals. Be strategic and data-driven.
${companySection}`;

    console.log('[Direct API] Starting conversation with', messages.length, 'messages');

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    console.log('[Direct API] Initial response:', response.stop_reason);

    // Handle tool calls (agentic loop)
    let iterations = 0;
    const maxIterations = 5;

    while (response.stop_reason === 'tool_use' && iterations < maxIterations) {
      iterations++;
      console.log(`[Direct API] Tool iteration ${iterations}`);

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        console.log(`[Direct API] Calling tool: ${toolUse.name}`);
        const result = await executeAnthropicTool(toolUse.name, toolUse.input, user.id);
        console.log(`[Direct API] Tool result:`, JSON.stringify(result).substring(0, 200));

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue conversation with tool results
      anthropicMessages.push({
        role: 'assistant',
        content: response.content,
      });

      anthropicMessages.push({
        role: 'user',
        content: toolResults,
      });

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools,
      });

      console.log(`[Direct API] Iteration ${iterations} response:`, response.stop_reason);
    }

    // Extract final text response
    const textContent = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    console.log('[Direct API] Final response:', textContent.substring(0, 100));

    return Response.json({
      role: 'assistant',
      content: textContent,
    });
  } catch (error: any) {
    console.error('[Direct API] Error:', error);
    return Response.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}
