import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { searchWeb } from '@/lib/research/web-search';
import { parseCommand, isCommand } from '@/lib/chat/command-parser';

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

    // Get contacts for context (using service role to bypass RLS)
    const serviceClient = createServiceRoleClient();

    // Get all contacts with assigned clients
    const { data: contacts, error: contactsError } = await serviceClient
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        title,
        is_primary,
        client_id,
        client:clients!contacts_client_id_fkey(id, company_name)
      `)
      .not('client_id', 'is', null)  // Only get contacts with assigned clients
      .order('client_id', { ascending: true })
      .order('is_primary', { ascending: false })
      .order('last_name', { ascending: true })
      .limit(1000);  // Increase to ensure we get all contacts

    if (contactsError) {
      console.error('[Chat] Error fetching contacts:', contactsError);
    } else {
      console.log(`[Chat] Loaded ${contacts?.length || 0} contacts`);
      if (contacts && contacts.length > 0) {
        console.log('[Chat] Sample contact:', JSON.stringify(contacts[0], null, 2));

        // Check for iFund Cities contacts specifically
        const ifundContacts = contacts.filter((c: any) =>
          c.client?.company_name?.toLowerCase().includes('fund')
        );
        console.log(`[Chat] iFund Cities contacts found: ${ifundContacts.length}`);
        if (ifundContacts.length > 0) {
          console.log('[Chat] iFund sample:', ifundContacts[0]?.first_name, ifundContacts[0]?.last_name);
        }
      }
    }

    // Get all properties for context (Supabase default max is 1000, so we need to handle pagination)
    let allProperties: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data: propertiesPage, error: propertiesError } = await serviceClient
        .from('properties')
        .select(`
          id,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          property_type,
          org_id,
          county
        `)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (propertiesError) {
        console.error('[Chat] Error fetching properties:', propertiesError);
        break;
      }

      if (!propertiesPage || propertiesPage.length === 0) break;

      allProperties = allProperties.concat(propertiesPage);

      if (propertiesPage.length < pageSize) break; // Last page
      page++;
    }

    const properties = allProperties;
    const propertiesError = null;

    // Add client names to properties using org_id
    if (properties && properties.length > 0) {
      const orgIds = [...new Set(properties.map(p => p.org_id).filter(Boolean))];
      const { data: propertyClients } = await serviceClient
        .from('clients')
        .select('id, company_name')
        .in('id', orgIds);

      const clientMap = new Map(propertyClients?.map(c => [c.id, c.company_name]));

      properties.forEach((p: any) => {
        p.client = { company_name: clientMap.get(p.org_id) || 'Unknown Client' };
      });
    }

    if (propertiesError) {
      console.error('[Chat] Error fetching properties:', propertiesError);
    } else {
      console.log(`[Chat] Loaded ${properties?.length || 0} properties`);
    }

    // Get orders for context (up to 3000 most recent)
    const { data: orders, error: ordersError } = await serviceClient
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        ordered_date,
        due_date,
        completed_date,
        fee_amount,
        total_amount,
        property_address,
        property_city,
        property_state,
        property_zip,
        property_type,
        client_id,
        order_type,
        scope_of_work,
        borrower_name
      `)
      .order('ordered_date', { ascending: false })
      .limit(3000);

    // Add client names to orders
    if (orders && orders.length > 0) {
      const clientIds = [...new Set(orders.map(o => o.client_id).filter(Boolean))];
      const { data: orderClients } = await serviceClient
        .from('clients')
        .select('id, company_name')
        .in('id', clientIds);

      const clientMap = new Map(orderClients?.map(c => [c.id, c.company_name]));

      orders.forEach((o: any) => {
        o.client = { company_name: clientMap.get(o.client_id) || 'Unknown Client' };
      });
    }

    if (ordersError) {
      console.error('[Chat] Error fetching orders:', ordersError);
    } else {
      console.log(`[Chat] Loaded ${orders?.length || 0} orders`);
    }

    // Get cases for context
    const { data: cases, error: casesError } = await serviceClient
      .from('cases')
      .select(`
        id,
        case_number,
        subject,
        description,
        case_type,
        status,
        priority,
        client_id,
        contact_id,
        order_id,
        assigned_to,
        resolution,
        resolved_at,
        closed_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    // Add related data to cases
    if (cases && cases.length > 0) {
      const clientIds = [...new Set(cases.map(c => c.client_id).filter(Boolean))];
      const contactIds = [...new Set(cases.map(c => c.contact_id).filter(Boolean))];
      const orderIds = [...new Set(cases.map(c => c.order_id).filter(Boolean))];

      const { data: caseClients } = await serviceClient
        .from('clients')
        .select('id, company_name')
        .in('id', clientIds);

      const { data: caseContacts } = await serviceClient
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', contactIds);

      const { data: caseOrders } = await serviceClient
        .from('orders')
        .select('id, order_number')
        .in('id', orderIds);

      const clientMap = new Map(caseClients?.map(c => [c.id, c.company_name]));
      const contactMap = new Map(caseContacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]));
      const orderMap = new Map(caseOrders?.map(o => [o.id, o.order_number]));

      cases.forEach((c: any) => {
        c.client = { company_name: clientMap.get(c.client_id) || null };
        c.contact = { name: contactMap.get(c.contact_id) || null };
        c.order = { order_number: orderMap.get(c.order_id) || null };
      });
    }

    if (casesError) {
      console.error('[Chat] Error fetching cases:', casesError);
    } else {
      console.log(`[Chat] Loaded ${cases?.length || 0} cases`);
    }

    // Get current Kanban cards
    const { data: kanbanCards } = await supabase
      .from('kanban_cards')
      .select(`
        id,
        type,
        title,
        state,
        priority,
        rationale,
        created_at,
        client:clients(company_name)
      `)
      .eq('org_id', user.id)
      .in('state', ['suggested', 'in_review', 'approved'])
      .order('created_at', { ascending: false })
      .limit(20);

    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // Check for commands
    let commandResult = '';
    if (isCommand(lastMessage)) {
      const command = parseCommand(lastMessage);
      console.log('[Chat] Command detected:', command);
      console.log('[Chat] Available cards for command:', kanbanCards?.length || 0);
      
      // Execute command
      try {
        if (command.action === 'create') {
          // Get client ID from name
          let clientId = null;
          if (command.clientName) {
            const { data: matchedClient } = await supabase
              .from('clients')
              .select('id, company_name')
              .ilike('company_name', `%${command.clientName}%`)
              .limit(1)
              .single();
            clientId = matchedClient?.id;
          }

          if (!clientId) {
            commandResult = `\n\n⚠️ Could not find client "${command.clientName}". Available clients: ${clients?.map(c => c.company_name).join(', ')}`;
          } else {
            // Create the card
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:9002'}/api/agent/card/manage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create',
                cardData: {
                  clientId,
                  type: command.cardType,
                  title: `${command.topic || lastMessage.substring(0, 60)}`,
                  rationale: `Created via chat: ${lastMessage}`,
                  priority: command.priority || 'medium',
                  actionPayload: {},
                },
              }),
            });
            
            const result = await response.json();
            if (result.success) {
              commandResult = `\n\n✅ Created ${result.card.type} card for ${command.clientName}!\n   Title: "${result.card.title}"\n   Priority: ${result.card.priority}\n   Status: Suggested (go to /agent to review)`;
            }
          }
        } else if (command.action === 'delete') {
          // Delete card(s) - smart matching
          const msg = lastMessage.toLowerCase();
          const cardsToDelete = kanbanCards?.filter((card: any) => {
            // Match by explicit ID
            if (command.cardId && card.id.includes(command.cardId)) return true;
            
            // Match by priority
            if (msg.includes('low priority') && card.priority === 'low') return true;
            if (msg.includes('medium priority') && card.priority === 'medium') return true;
            if (msg.includes('high priority') && card.priority === 'high') return true;
            
            // Match by type
            if (msg.includes('email') && card.type === 'send_email') return true;
            if (msg.includes('research') && card.type === 'research') return true;
            if (msg.includes('task') && card.type === 'create_task') return true;
            if (msg.includes('deal') && card.type === 'create_deal') return true;
            if (msg.includes('call') && card.type === 'schedule_call') return true;
            
            // Match by client name
            const client = Array.isArray(card.client) ? card.client[0] : card.client;
            const clientName = client?.company_name?.toLowerCase();
            if (clientName && msg.includes(clientName)) return true;
            
            // Match by title (partial)
            if (card.title.toLowerCase().includes(msg.replace('delete', '').trim())) return true;
            
            return false;
          }) || [];

          console.log('[Chat] Delete - Cards to delete:', cardsToDelete.length, 'from', kanbanCards?.length || 0, 'total');
          console.log('[Chat] Delete - Matched cards:', cardsToDelete.map(c => `${c.title} (${c.priority})`));
          
          if (cardsToDelete.length === 0) {
            // Show what cards ARE available to help user
            const availableCards = kanbanCards?.slice(0, 5).map((c: any) => 
              `   - ${c.title} (${c.priority} priority, ${c.type})`
            ).join('\n') || 'No cards available';
            
            commandResult = `\n\n⚠️ No matching cards found to delete.\nTotal cards available: ${kanbanCards?.length || 0}\n\nFirst few cards:\n${availableCards}\n\nTry being more specific, like:\n- "Delete low priority email cards"\n- "Delete cards for iFund"\n- Or use a specific card ID`;
          } else {
            // Delete directly using Supabase client (fixes auth issue)
            let deleted = 0;
            let errors = [];
            
            for (const card of cardsToDelete) {
              console.log(`[Chat] Deleting card: ${card.id} - ${card.title}`);
              
              try {
                const { error: deleteError } = await supabase
                  .from('kanban_cards')
                  .delete()
                  .eq('id', card.id)
                  .eq('org_id', user.id);
                
                if (deleteError) {
                  errors.push(deleteError.message);
                  console.error(`[Chat] Delete failed for ${card.id}:`, deleteError.message);
                } else {
                  deleted++;
                  console.log(`[Chat] ✓ Deleted: ${card.title}`);
                }
              } catch (deleteError: any) {
                errors.push(deleteError.message);
                console.error(`[Chat] Delete exception for ${card.id}:`, deleteError);
              }
            }
            
            const getClientName = (c: any) => {
              const client = Array.isArray(c.client) ? c.client[0] : c.client;
              return client?.company_name || 'Unknown';
            };
            commandResult = `\n\n✅ Deleted ${deleted} of ${cardsToDelete.length} card(s):\n${cardsToDelete.slice(0, deleted).map(c => `   - ${c.title} (${getClientName(c)})`).join('\n')}${errors.length > 0 ? `\n\n❌ ${errors.length} failed: ${errors.slice(0, 2).join(', ')}` : ''}\n\nRefresh the /agent page to see updated board.`;
          }
        } else if (command.action === 'approve') {
          // Approve card(s)
          const cardsToApprove = kanbanCards?.filter((card: any) => {
            if (command.cardId && card.id.includes(command.cardId)) return true;
            const msg = lastMessage.toLowerCase();
            if (msg.includes('all') && msg.includes('high')) return card.priority === 'high';
            if (msg.includes(card.title.toLowerCase())) return true;
            return false;
          }) || [];

          if (cardsToApprove.length === 0) {
            commandResult = `\n\n⚠️ No matching cards found to approve.`;
          } else {
            let approved = 0;
            for (const card of cardsToApprove) {
              const { error } = await supabase
                .from('kanban_cards')
                .update({ state: 'approved' })
                .eq('id', card.id)
                .eq('org_id', user.id);
              
              if (!error) approved++;
            }
            const getClientName = (c: any) => {
              const client = Array.isArray(c.client) ? c.client[0] : c.client;
              return client?.company_name || 'Unknown';
            };
            commandResult = `\n\n✅ Approved ${approved} card(s):\n${cardsToApprove.map(c => `   - ${c.title} (${getClientName(c)})`).join('\n')}\n\nClick "Start Agent Cycle" to execute them!`;
          }
        } else if (command.action === 'execute') {
          // Execute approved cards
          const approvedCards = kanbanCards?.filter((card: any) => card.state === 'approved') || [];
          
          if (approvedCards.length === 0) {
            commandResult = `\n\n⚠️ No approved cards to execute. Approve cards first, then execute.`;
          } else {
            commandResult = `\n\n⏳ Executing ${approvedCards.length} approved card(s)...\n\nThis will happen when you click "Start Agent Cycle" or I'll trigger it now via API.`;
            // Note: Actual execution should happen via agent run
          }
        }
      } catch (error: any) {
        console.error('[Chat] Command execution failed:', error);
        commandResult = `\n\n❌ Command failed: ${error.message}`;
      }
    }
    
    // Check if user is asking for web search
    const needsWebSearch = 
      lastMessage.toLowerCase().includes('search') ||
      lastMessage.toLowerCase().includes('find information') ||
      lastMessage.toLowerCase().includes('look up') ||
      (lastMessage.toLowerCase().includes('what is') && lastMessage.includes('?'));

    let webSearchResults = '';
    
    // If user seems to want web search, try it
    if (needsWebSearch && !isCommand(lastMessage) && (process.env.TAVILY_API_KEY || process.env.BRAVE_SEARCH_API_KEY)) {
      try {
        console.log('[Chat] User query suggests web search needed:', lastMessage);
        const results = await searchWeb(lastMessage, 3);
        if (results.length > 0) {
          webSearchResults = `\n\n## Web Search Results\n\nI searched the internet for: "${lastMessage}"\n\n${results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.url}`).join('\n\n')}`;
          console.log(`[Chat] Found ${results.length} web results`);
        }
      } catch (error) {
        console.error('[Chat] Web search failed:', error);
      }
    }

    // Build system prompt with inline data
    const systemPrompt = `You are an AI Account Manager assistant for a property appraisal management company.

Current context:
- User: ${user.email}
- Active goals: ${goals?.length || 0}
- Active clients: ${clients?.length || 0}
- Total contacts: ${contacts?.length || 0}
- Total properties: ${properties?.length || 0}
- Total orders: ${orders?.length || 0}
- Total cases: ${cases?.length || 0}

Goals:
${goals?.map((g: any) => `- ${g.metric_type}: Target ${g.target_value}, Period: ${g.period_type}`).join('\n') || 'No active goals'}

Clients:
${clients?.map((c: any) => `- ${c.company_name} (${c.email || 'no email'})`).join('\n') || 'No active clients'}

Contacts (${contacts?.length || 0} total):
${contacts?.map((c: any) => {
  const clientName = c.client?.company_name || 'Unknown Client';
  return `- ${c.first_name} ${c.last_name} (${c.email || 'no email'}) - ${c.title || 'No title'} at ${clientName}${c.phone ? ` | ${c.phone}` : ''}`;
}).join('\n') || 'No contacts'}

Properties (${properties?.length || 0} total):
${properties?.map((p: any) => {
  const clientName = p.client?.company_name || 'Unknown Client';
  const address = [p.address_line1, p.address_line2].filter(Boolean).join(' ');
  return `- ${address}, ${p.city}, ${p.state} ${p.postal_code || ''} (${p.property_type || 'Unknown type'}) - Client: ${clientName}`;
}).join('\n') || 'No properties'}

Orders (${orders?.length || 0} total):
${orders?.map((o: any) => {
  const clientName = o.client?.company_name || 'Unknown Client';
  const propertyAddr = o.property_address ? `${o.property_address}, ${o.property_city}, ${o.property_state}` : 'No property';
  const orderDate = o.ordered_date ? new Date(o.ordered_date).toLocaleDateString() : 'No date';
  const dueDate = o.due_date ? new Date(o.due_date).toLocaleDateString() : 'No due date';
  return `- Order #${o.order_number} - ${clientName} - ${propertyAddr} - Status: ${o.status} - Ordered: ${orderDate} - Due: ${dueDate} - Fee: $${o.fee_amount || 0} - Type: ${o.order_type || 'N/A'}`;
}).join('\n') || 'No orders'}

Cases (${cases?.length || 0} total):
${cases?.map((c: any) => {
  const clientName = c.client?.company_name || 'No client';
  const contactName = c.contact?.name || 'No contact';
  const orderNumber = c.order?.order_number || 'No order';
  const createdDate = c.created_at ? new Date(c.created_at).toLocaleDateString() : 'No date';
  const resolvedDate = c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : 'Not resolved';
  return `- Case #${c.case_number} - ${c.subject} - Type: ${c.case_type} - Status: ${c.status} - Priority: ${c.priority} - Client: ${clientName} - Contact: ${contactName} - Order: ${orderNumber} - Created: ${createdDate} - Resolved: ${resolvedDate}`;
}).join('\n') || 'No cases'}

Current Kanban Cards (${kanbanCards?.length || 0}):
${kanbanCards?.map((card: any) => {
  const clientData = Array.isArray(card.client) ? card.client[0] : card.client;
  const client = clientData?.company_name || 'Unknown';
  return `- [${card.state.toUpperCase()}] ${card.type} - "${card.title}" for ${client} (${card.priority} priority)
    ID: ${card.id}
    Rationale: ${card.rationale.substring(0, 100)}...`;
}).join('\n') || 'No pending cards'}

${commandResult}${webSearchResults}

Capabilities:
- You CAN search the internet! Tavily web search is integrated.
- When users ask you to search or look up information, I will automatically search for you.
- You'll see the results in the context above.
- Reference the web search results when answering.

What you CAN do:
- Answer questions about goals, clients, and business
- **SEE all contacts** - You have access to all ${contacts?.length || 0} contacts listed above with their names, emails, phone numbers, and titles
- **Search contacts** - Filter contacts by name, email, company, or title using the data above
- **SEE all properties** - You have access to ${properties?.length || 0} properties listed above with addresses, cities, states, and property types
- **Search properties** - Filter properties by address, city, state, property type, or client using the data above
- **SEE all orders** - You have access to ${orders?.length || 0} orders listed above with order numbers, dates, statuses, clients, and properties
- **Search orders** - Filter orders by client, status, date, property, or order number using the data above
- **SEE all cases** - You have access to ${cases?.length || 0} cases listed above with case numbers, subjects, types, statuses, priorities, clients, contacts, and orders
- **Search cases** - Filter cases by client, status, priority, type, contact, or related order using the data above
- **Calculate metrics** - Count orders by client, status, date range, etc.
- Search the internet for information (Tavily)
- Provide strategic advice and recommendations
- Reference past conversations and data
- **SEE all Kanban cards** - You can see what's on the board above!
- **CREATE action cards** - Via chat commands!
- **Edit/Update cards** - Change priority, details, etc.
- **Delete cards** - Remove unwanted cards
- **Approve cards** - Move to approved state
- **Execute cards** - Run approved actions
- **Reference existing cards** - When users ask "what's pending?" or "what cards do we have?"

When users ask about contacts:
- You HAVE access to contact information - it's listed above in the "Contacts" section
- Show them the relevant contacts from the list above
- Include their name, email, phone, title, and which client they work for
- Be helpful and reference the actual contact data you can see

When users ask about properties:
- You HAVE access to property information - it's listed above in the "Properties" section
- Show them the relevant properties from the list above
- Include the address, city, state, property type, and which client owns it
- Be helpful and reference the actual property data you can see

When users ask about orders:
- You HAVE access to order information - it's listed above in the "Orders" section
- Show them the relevant orders from the list above
- Include order number, client, property address, status, dates, and fees
- You can count orders by client, calculate totals, analyze status distribution, etc.
- Be helpful and reference the actual order data you can see

When users ask about cases:
- You HAVE access to case information - it's listed above in the "Cases" section
- Show them the relevant cases from the list above
- Include case number, subject, type, status, priority, client, contact, and related order
- You can count cases by client, status, priority, type, etc.
- You can analyze case resolution times, identify trends, track support issues
- Be helpful and reference the actual case data you can see

How to use commands:
- "Create an email card for Acme about Q4 package"
- "Create a research task for iFund"
- "Delete card #5"
- "Edit card #3 to high priority"
- "Approve the research card"
- "Execute approved cards"

When you execute a command, you'll see the result above (marked with ✅ or ❌).
Reference the command result in your response to confirm what happened.

You help manage client relationships and achieve business goals. Be helpful, concise, and action-oriented. When you can't do something directly, guide users to the right place in the UI.`;

    // Stream response WITHOUT tools for now
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
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

