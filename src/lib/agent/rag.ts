import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';

export interface RAGResult {
  id: string;
  source: string;
  sourceId: string | null;
  title: string;
  content: string;
  metadata: any;
  similarity: number;
}

/**
 * Search the knowledge base using semantic similarity
 */
export async function searchRAG(
  orgId: string,
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<RAGResult[]> {
  try {
    const supabase = await createClient();

    // Generate embedding for the query
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: query,
    });

    // Search using pgvector cosine similarity
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: JSON.stringify(embedding), // pgvector expects array as JSON
      match_threshold: threshold,
      match_count: limit,
      filter_org_id: orgId,
    });

    if (error) {
      console.error('RAG search error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      source: row.source,
      sourceId: row.source_id,
      title: row.title,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
  } catch (error) {
    console.error('RAG search failed:', error);
    return [];
  }
}

/**
 * Index content into the RAG system
 */
export async function indexContent(
  orgId: string,
  source: string,
  sourceId: string | null,
  title: string,
  content: string,
  metadata: any = {}
): Promise<void> {
  try {
    const supabase = await createClient();

    // Generate embedding
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: content,
    });

    // Insert or update into embeddings table
    const record: any = {
      org_id: orgId,
      source,
      title,
      content,
      embedding: JSON.stringify(embedding), // Store as JSON for pgvector
      metadata,
    };
    
    if (sourceId) {
      record.source_id = sourceId;
    }

    const { error } = await supabase
      .from('embeddings_index')
      .upsert(record);

    if (error) {
      console.error('Failed to index content:', error);
      throw error;
    }
  } catch (error) {
    console.error('Content indexing failed:', error);
    throw error;
  }
}

/**
 * Index all clients for RAG
 */
export async function indexClients(orgId: string): Promise<number> {
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      contacts:contacts(*),
      orders:orders(*)
    `)
    .eq('is_active', true);

  if (error || !clients) {
    console.error('Failed to fetch clients:', error);
    return 0;
  }

  let indexed = 0;
  for (const client of clients) {
    const content = `
Client: ${client.company_name}
Primary Contact: ${client.primary_contact}
Email: ${client.email}
Phone: ${client.phone}
Address: ${client.address}
Payment Terms: ${client.payment_terms} days
Special Requirements: ${client.special_requirements || 'None'}
Active Orders: ${client.orders?.length || 0}
Contacts: ${client.contacts?.map((c: any) => `${c.first_name} ${c.last_name} (${c.email || 'no email'})`).join(', ')}
    `.trim();

    await indexContent(
      orgId,
      'client_data',
      client.id,
      `Client: ${client.company_name}`,
      content,
      {
        clientId: client.id,
        companyName: client.company_name,
        isActive: client.is_active,
      }
    );

    indexed++;
  }

  return indexed;
}

/**
 * Index all activities for RAG
 */
export async function indexActivities(orgId: string): Promise<number> {
  const supabase = await createClient();

  const { data: activities, error } = await supabase
    .from('activities')
    .select(`
      *,
      client:clients(company_name),
      contact:contacts(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(500); // Index recent 500 activities

  if (error || !activities) {
    console.error('Failed to fetch activities:', error);
    return 0;
  }

  let indexed = 0;
  for (const activity of activities) {
    const clientName = activity.client?.company_name || 'Unknown';
    const contactName = activity.contact 
      ? `${activity.contact.first_name} ${activity.contact.last_name}`
      : 'Unknown';

    const content = `
Activity: ${activity.subject}
Type: ${activity.activity_type}
Client: ${clientName}
Contact: ${contactName}
Description: ${activity.description || ''}
Outcome: ${activity.outcome || 'N/A'}
Date: ${new Date(activity.created_at).toLocaleDateString()}
Status: ${activity.status}
    `.trim();

    await indexContent(
      orgId,
      'activity',
      activity.id,
      activity.subject,
      content,
      {
        activityType: activity.activity_type,
        clientId: activity.client_id,
        outcome: activity.outcome,
        date: activity.created_at,
      }
    );

    indexed++;
  }

  return indexed;
}

/**
 * Index chat conversations into RAG
 */
export async function indexChatConversations(orgId: string, minMessages: number = 4): Promise<number> {
  const supabase = await createClient();

  // Get recent chat sessions (group by date)
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error || !messages || messages.length < minMessages) {
    return 0;
  }

  // Group messages by conversation (within 1 hour of each other)
  const conversations: any[] = [];
  let currentConvo: any[] = [];
  let lastTimestamp: Date | null = null;

  for (const msg of messages) {
    const msgTime = new Date(msg.created_at);
    
    if (!lastTimestamp || (msgTime.getTime() - lastTimestamp.getTime()) > 3600000) {
      // New conversation (1 hour gap)
      if (currentConvo.length >= 2) {
        conversations.push([...currentConvo]);
      }
      currentConvo = [msg];
    } else {
      currentConvo.push(msg);
    }
    
    lastTimestamp = msgTime;
  }
  
  // Add last conversation
  if (currentConvo.length >= 2) {
    conversations.push(currentConvo);
  }

  // Index each conversation
  let indexed = 0;
  for (const convo of conversations) {
    const firstMsg = convo[0];
    const lastMsg = convo[convo.length - 1];
    const date = new Date(firstMsg.created_at).toLocaleDateString();
    
    // Create conversation summary
    const content = convo.map((m: any) => 
      `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`
    ).join('\n\n');
    
    const title = `Conversation on ${date}`;
    const firstUserMsg = convo.find((m: any) => m.role === 'user')?.content || 'Chat';
    
    await indexContent(
      orgId,
      'chat',
      firstMsg.id,
      `${title}: ${firstUserMsg.substring(0, 100)}`,
      content,
      {
        date: firstMsg.created_at,
        message_count: convo.length,
        first_message: firstUserMsg.substring(0, 200),
      }
    );
    
    indexed++;
  }

  return indexed;
}

/**
 * Build RAG context for chat prompt
 */
export function buildRAGContext(results: RAGResult[]): string {
  if (results.length === 0) {
    return 'No relevant context found in knowledge base.';
  }

  return `
## Relevant Context from Knowledge Base

${results.map((r, i) => `
### [${i + 1}] ${r.title} (${r.source}, ${(r.similarity * 100).toFixed(0)}% match)
${r.content}
`).join('\n')}

Use this context to inform your response. Cite sources when relevant.
  `.trim();
}

