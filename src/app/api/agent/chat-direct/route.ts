import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

// Tool definitions for Anthropic SDK
const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'searchClients',
    description: 'Search for clients by name, email, or other criteria. Use this when you need to find a client UUID.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (company name, email, etc.)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'createContact',
    description: 'Create a new contact for a client. You MUST have the client UUID - use searchClients first if you only have a company name.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Client UUID to associate contact with',
        },
        firstName: {
          type: 'string',
          description: 'Contact first name',
        },
        lastName: {
          type: 'string',
          description: 'Contact last name',
        },
        email: {
          type: 'string',
          description: 'Contact email address',
        },
        phone: {
          type: 'string',
          description: 'Office phone number',
        },
        mobile: {
          type: 'string',
          description: 'Mobile phone number',
        },
        title: {
          type: 'string',
          description: 'Job title',
        },
        department: {
          type: 'string',
          description: 'Department',
        },
      },
      required: ['clientId', 'firstName', 'lastName'],
    },
  },
];

// Tool execution function
async function executeTool(
  toolName: string,
  toolInput: any,
  userId: string
): Promise<any> {
  const supabase = await createClient();

  console.log(`[Direct API] Executing tool: ${toolName}`, toolInput);

  switch (toolName) {
    case 'searchClients': {
      const { query } = toolInput;
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, primary_contact, email, phone, is_active')
        .or(`company_name.ilike.%${query}%,primary_contact.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        return { error: error.message };
      }

      return {
        clients: data || [],
        count: data?.length || 0,
      };
    }

    case 'createContact': {
      const { clientId, firstName, lastName, email, phone, mobile, title, department } = toolInput;

      // Verify client exists
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return { error: 'Client not found or access denied' };
      }

      // Create contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          mobile: mobile || null,
          title: title || null,
          department: department || null,
        })
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          mobile,
          title,
          department,
          client:clients!contacts_client_id_fkey(
            id,
            company_name
          )
        `)
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        contact: {
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          mobile: data.mobile,
          title: data.title,
          department: data.department,
          client: {
            id: (data.client as any)?.id,
            name: (data.client as any)?.company_name,
          },
        },
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
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

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `You are an AI assistant that helps manage contacts and clients.

Your capabilities:
- Search for clients by name or company
- Create new contacts for clients

When creating contacts:
1. ALWAYS search for the client first to get their UUID
2. Then create the contact with the client UUID
3. Confirm the contact was created successfully

Be helpful and thorough. Always execute tools when needed.`;

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
      tools,
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
        const result = await executeTool(toolUse.name, toolUse.input, user.id);
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
        tools,
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
