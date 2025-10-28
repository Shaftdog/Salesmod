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

    console.log('[Chat] Checking message for commands:', lastMessage);
    console.log('[Chat] Is command?:', isCommand(lastMessage));

    // Check for commands
    let commandResult = '';
    if (isCommand(lastMessage)) {
      const command = parseCommand(lastMessage);
      console.log('[Chat] Command detected:', command);
      console.log('[Chat] Available cards for command:', kanbanCards?.length || 0);
      
      // Execute command
      try {
        if (command.action === 'create') {
          // Get client ID from name (optional)
          let clientId = null;
          let foundClientName = null;
          if (command.clientName) {
            // Remove spaces and special chars for fuzzy matching
            const cleanSearchName = command.clientName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Search through clients with fuzzy matching
            const potentialClients = clients?.filter(c => {
              const cleanClientName = c.company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanClientName.includes(cleanSearchName) || cleanSearchName.includes(cleanClientName);
            });

            if (potentialClients && potentialClients.length > 0) {
              clientId = potentialClients[0].id;
              foundClientName = potentialClients[0].company_name;
              console.log(`[Chat] Matched client: "${command.clientName}" → "${foundClientName}"`);
            } else {
              // Client name specified but not found
              commandResult = `\n\n⚠️ Could not find client "${command.clientName}". Available clients: ${clients?.map(c => c.company_name).join(', ')}\n\nTip: Omit the client name to create a general strategic card.`;
              console.log(`[Chat] Client not found: "${command.clientName}"`);
            }
          }

          // Allow cards without clients (for strategic/general tasks)
          if (!command.clientName || clientId) {
            // Create the card directly in database (avoid auth issues with fetch)
            try {
              const cardTitle = command.topic || lastMessage.substring(0, 60);

              const { data: newCard, error: createError } = await supabase
                .from('kanban_cards')
                .insert({
                  org_id: user.id,
                  client_id: clientId || null,
                  type: command.cardType,
                  title: cardTitle,
                  rationale: `Created via chat: ${lastMessage}`,
                  priority: command.priority || 'medium',
                  state: 'suggested',
                  action_payload: {},
                  created_by: user.id,
                })
                .select()
                .single();

              if (createError) {
                console.error('[Chat] Card creation error:', createError);
                commandResult = `\n\n❌ Failed to create card: ${createError.message}`;
              } else if (newCard) {
                const clientInfo = clientId ? `for ${foundClientName || command.clientName}` : '(general strategic card)';
                commandResult = `\n\n✅ Created ${newCard.type} card ${clientInfo}!\n   Title: "${newCard.title}"\n   Priority: ${newCard.priority}\n   Status: Suggested (go to /agent to review)`;
                console.log('[Chat] Card created successfully:', newCard.id);
              }
            } catch (err: any) {
              console.error('[Chat] Card creation exception:', err);
              commandResult = `\n\n❌ Failed to create card: ${err.message}`;
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
- You CAN create cards! When users ask you to create a card, the command parser will handle it automatically.
- You CAN search the internet using the searchWeb integration
- You have access to all data listed above (contacts, properties, orders, cases, goals)

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
- **CREATE action cards** - When users ask you to create a card, respond with a confirmation and the card will be created automatically
- **Search for information** - Use the data provided above to answer questions
- **Reference existing cards** - When users ask "what's pending?" or "what cards do we have?"

🎯 YOUR CORE MISSION:
You are an AUTONOMOUS account manager. Your job is to:
1. **ANALYZE** the business context (goals, clients, orders, recent activity)
2. **IDENTIFY** opportunities and actions that will help meet goals
3. **PROACTIVELY CREATE** action cards to drive business forward
4. **BE STRATEGIC** - think about what would help achieve goals

💡 PROACTIVE CARD CREATION:
You should ALWAYS analyze the current situation and suggest cards that would help, even if the user doesn't explicitly ask for them.

When you want to create a card, embed this tag in your response:
[CREATE_CARD: type=send_email, title=Follow up with iFund Cities, client=i Fund Cities LLC, priority=high, rationale=Need to discuss Q4 orders and increase revenue]

When you want to delete a card, use this tag:
[DELETE_CARD: bcf580af-7934-40c6-b620-aab9d7ca03ae]
or
[DELETE_CARD: id=bcf580af-7934-40c6-b620-aab9d7ca03ae]

Card types available:
- send_email: Outreach to clients
- create_task: Action items, calls, follow-ups
- research: Investigate opportunities, competitors, market
- create_deal: Track potential contracts
- follow_up: Check-ins with existing clients

Example autonomous responses:
"Looking at your goals and recent activity, I notice you're 25% behind your revenue target. Here are strategic actions: [CREATE_CARD: type=send_email, title=Q4 Upsell to iFund Cities, client=i Fund Cities LLC, priority=high, rationale=They have 45 active orders but no recent upsell discussion - opportunity to increase order value] [CREATE_CARD: type=create_task, title=Review Acme Real Estate pipeline, client=Acme Real Estate, priority=medium, rationale=Second largest client but only 12 orders this quarter - need to understand if there are barriers] [CREATE_CARD: type=research, title=Competitor pricing analysis, priority=medium, rationale=Market intelligence to inform Q4 pricing strategy]"

🚨 IMPORTANT: 
- Create cards proactively based on your analysis
- Don't wait for user to ask
- Be strategic and goal-driven
- Create multiple cards when you see multiple opportunities
- Always include clear rationales tied to business goals

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

Example user requests:
- "Create an email card for Acme about Q4 package" -> Respond that you'll create it
- "What are my active goals?" -> Use the goals data above
- "Who works at iFund?" -> Use the contacts data above
- "Search for information about competitor pricing" -> Tell user to search manually

When users ask you to create cards, respond with confirmation. The system will handle the creation.

You help manage client relationships and achieve business goals. Be helpful, concise, and action-oriented. When you can't do something directly, guide users to the right place in the UI.`;

    // Stream response WITHOUT tools (command parser will handle card creation)
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    // Collect the full response to parse for card creation tags
    let fullResponse = '';
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
          
          // After streaming completes, parse for [CREATE_CARD: ...] and [DELETE_CARD: ...] tags
          await parseAndCreateCards(fullResponse, user.id, clients || []);
          await parseAndDeleteCards(fullResponse, user.id);
        } catch (error) {
          console.error('[Chat] Stream error:', error);
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
    console.error('Chat API error:', error);
    return Response.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}

/**
 * Parse agent response for [CREATE_CARD: ...] tags and create those cards
 */
async function parseAndCreateCards(response: string, orgId: string, clients: any[]) {
  const cardPattern = /\[CREATE_CARD:\s*([^\]]+)\]/g;
  const matches = [...response.matchAll(cardPattern)];
  
  if (matches.length === 0) {
    return;
  }
  
  console.log(`[Chat] Found ${matches.length} card creation tags in agent response`);
  
  const supabase = await createClient();
  
  for (const match of matches) {
    try {
      const params = match[1];
      const parsed: any = {};
      
      // Parse key=value pairs
      const pairs = params.split(',').map(p => p.trim());
      for (const pair of pairs) {
        const [key, ...valueParts] = pair.split('=');
        const value = valueParts.join('=').trim();
        parsed[key.trim()] = value;
      }
      
      console.log('[Chat] Parsed card params:', parsed);
      
      // Find client ID if client name provided
      let clientId = null;
      if (parsed.client) {
        const cleanSearchName = parsed.client.toLowerCase().replace(/[^a-z0-9]/g, '');
        const potentialClients = clients?.filter(c => {
          const cleanClientName = c.company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanClientName.includes(cleanSearchName) || cleanSearchName.includes(cleanClientName);
        });
        
        if (potentialClients && potentialClients.length > 0) {
          clientId = potentialClients[0].id;
          console.log(`[Chat] Matched client: "${parsed.client}" → "${potentialClients[0].company_name}"`);
        }
      }
      
      // Create the card
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: orgId,
          client_id: clientId,
          type: parsed.type || 'create_task',
          title: parsed.title || 'Untitled',
          rationale: parsed.rationale || 'Agent suggested',
          priority: parsed.priority || 'medium',
          state: 'suggested',
          action_payload: {},
          created_by: orgId,
        })
        .select()
        .single();
      
      if (error) {
        console.error('[Chat] Auto-card creation error:', error);
      } else {
        console.log('[Chat] Auto-created card from agent response:', data.id, data.title);
      }
    } catch (err) {
      console.error('[Chat] Error parsing card tag:', err);
    }
  }
}

/**
 * Parse agent response for [DELETE_CARD: ...] tags and delete those cards
 */
async function parseAndDeleteCards(response: string, orgId: string) {
  // Match [DELETE_CARD: id] or [DELETE_CARD: id=uuid]
  const deletePattern = /\[DELETE_CARD:\s*([^\]]+)\]/g;
  const matches = [...response.matchAll(deletePattern)];
  
  if (matches.length === 0) {
    return;
  }
  
  console.log(`[Chat] Found ${matches.length} delete card tags in agent response`);
  
  const supabase = await createClient();
  
  for (const match of matches) {
    try {
      let cardId = match[1].trim();
      
      // Parse if it's in key=value format
      if (cardId.includes('=')) {
        const pairs = cardId.split(',').map(p => p.trim());
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key.trim() === 'id') {
            cardId = value.trim();
            break;
          }
        }
      }
      
      console.log(`[Chat] Attempting to delete card: ${cardId}`);
      
      // Get card info before deleting
      const { data: card } = await supabase
        .from('kanban_cards')
        .select('id, title, type, client:clients(company_name)')
        .eq('id', cardId)
        .eq('org_id', orgId)
        .single();
      
      if (!card) {
        console.error(`[Chat] Card not found: ${cardId}`);
        continue;
      }
      
      // Delete the card
      const { error: deleteError } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId)
        .eq('org_id', orgId);
      
      if (deleteError) {
        console.error('[Chat] Auto-delete error:', deleteError);
      } else {
        console.log(`[Chat] ✓ Auto-deleted card via tag: ${card.title} (${cardId})`);
      }
    } catch (err) {
      console.error('[Chat] Error parsing delete tag:', err);
    }
  }
}

