---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Agent Chat + Memory + RAG Implementation Plan

## Overview

Add conversational AI capabilities to the Account Manager Agent, enabling you to chat with it, give commands, and have it search a knowledge base (RAG) to inform its responses.

---

## 🎯 Features to Build

### 1. Chat Interface (Agent Panel)
- Text input at bottom of Agent Panel
- Message history display
- Streaming responses
- Quick action buttons ("Draft email", "Check goals", "Summarize client")

### 2. Chat Memory
- Store conversation history in `agent_memories` table
- Maintain context across sessions
- Reference previous conversations
- Auto-summarize long threads

### 3. RAG (Knowledge Base)
- Index emails, notes, client data into vectors
- Semantic search for relevant context
- Cite sources in responses
- Update index incrementally

### 4. Tool Calling
- Agent can execute functions via chat
- Tools: search clients, check goals, create cards, draft emails
- Conversational workflow ("Draft an email to Acme" → generates card)

---

## 📊 Database Changes

### New Table: `embeddings_index`

```sql
CREATE TABLE embeddings_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id),
  source TEXT NOT NULL CHECK (source IN ('email', 'note', 'client_data', 'activity', 'order')),
  source_id UUID, -- Reference to original record
  title TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embedding
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_org ON embeddings_index(org_id);
CREATE INDEX idx_embeddings_source ON embeddings_index(source, source_id);
-- For pgvector similarity search:
CREATE INDEX idx_embeddings_vector ON embeddings_index 
  USING ivfflat (embedding vector_cosine_ops);
```

### Extend `agent_memories` for Chat

Already exists, just use with `scope = 'chat'`:
```sql
INSERT INTO agent_memories (org_id, scope, key, content, importance)
VALUES (
  'user-id',
  'chat',
  'conversation_2025-10-15',
  '{"messages": [...], "summary": "..."}',
  0.8
);
```

---

## 🔧 Backend Implementation

### 1. Chat API Route

**`/api/agent/chat/route.ts`**

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { searchRAG } from '@/lib/agent/rag';
import { agentTools } from '@/lib/agent/tools';

export async function POST(request: Request) {
  const { messages } = await request.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get recent chat memory
  const { data: memories } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('org_id', user.id)
    .eq('scope', 'chat')
    .order('last_used_at', { ascending: false })
    .limit(10);

  // Get relevant context via RAG
  const lastMessage = messages[messages.length - 1].content;
  const ragResults = await searchRAG(user.id, lastMessage, 5);

  // Build system prompt with context
  const systemPrompt = buildAgentSystemPrompt(user.id, memories, ragResults);

  // Stream response with tools
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    messages,
    tools: agentTools,
    temperature: 0.7,
  });

  // Save conversation to memory (async)
  saveConversationMemory(user.id, messages).catch(console.error);

  return result.toDataStreamResponse();
}
```

### 2. RAG Search Function

**`/src/lib/agent/rag.ts`**

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { createClient } from '@/lib/supabase/server';

export async function searchRAG(
  orgId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ content: string; source: string; metadata: any }>> {
  const supabase = await createClient();

  // Generate embedding for the query
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-ada-002'),
    value: query,
  });

  // Search for similar content using pgvector
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
    filter_org_id: orgId,
  });

  if (error) {
    console.error('RAG search failed:', error);
    return [];
  }

  return data || [];
}

export async function indexContent(
  orgId: string,
  source: string,
  sourceId: string,
  title: string,
  content: string,
  metadata: any = {}
) {
  const supabase = await createClient();

  // Generate embedding
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-ada-002'),
    value: content,
  });

  // Store in database
  await supabase
    .from('embeddings_index')
    .upsert({
      org_id: orgId,
      source,
      source_id: sourceId,
      title,
      content,
      embedding,
      metadata,
    })
    .eq('source', source)
    .eq('source_id', sourceId);
}
```

### 3. Agent Tools

**`/src/lib/agent/tools.ts`**

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const agentTools = {
  searchClients: tool({
    description: 'Search for clients by name or other criteria',
    parameters: z.object({
      query: z.string().describe('Search query'),
    }),
    execute: async ({ query }) => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('clients')
        .select('*')
        .ilike('company_name', `%${query}%`)
        .limit(5);
      return data || [];
    },
  }),

  getGoals: tool({
    description: 'Get current goals and progress',
    parameters: z.object({}),
    execute: async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true);
      return data || [];
    },
  }),

  createActionCard: tool({
    description: 'Create a new action card on the Kanban board',
    parameters: z.object({
      type: z.enum(['send_email', 'create_task', 'schedule_call', 'create_deal']),
      clientId: z.string(),
      title: z.string(),
      rationale: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      emailDraft: z.object({
        to: z.string(),
        subject: z.string(),
        body: z.string(),
      }).optional(),
    }),
    execute: async (params) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: user!.id,
          client_id: params.clientId,
          type: params.type,
          title: params.title,
          rationale: params.rationale,
          priority: params.priority,
          state: 'suggested',
          action_payload: params.emailDraft || {},
        })
        .select()
        .single();
        
      return data;
    },
  }),

  searchKnowledge: tool({
    description: 'Search the knowledge base (RAG) for relevant information',
    parameters: z.object({
      query: z.string().describe('What to search for'),
    }),
    execute: async ({ query }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const results = await searchRAG(user!.id, query, 5);
      return results;
    },
  }),
};
```

### 4. pgvector Search Function (SQL)

```sql
-- Function to search embeddings using cosine similarity
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_org_id UUID
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.source,
    e.title,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings_index e
  WHERE e.org_id = filter_org_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 🎨 UI Components

### 1. Update Agent Panel with Chat

**`src/components/agent/agent-panel.tsx`** - Add chat section:

```typescript
// Add to existing AgentPanel component

const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const { append, isLoading } = useChat({
  api: '/api/agent/chat',
});

return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="sm:max-w-md">
      {/* Existing status, stats, etc */}
      
      {/* NEW: Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Chat with Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 mb-4">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  append({ role: 'user', content: input });
                  setInput('');
                }
              }}
              placeholder="Ask the agent anything..."
            />
            <Button 
              onClick={() => {
                append({ role: 'user', content: input });
                setInput('');
              }}
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => setInput('What are my goals?')}>
              Check Goals
            </Button>
            <Button size="sm" variant="outline" onClick={() => setInput('Draft email to Acme')}>
              Draft Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => setInput('Summarize recent activity')}>
              Summarize
            </Button>
          </div>
        </CardContent>
      </Card>
    </SheetContent>
  </Sheet>
);
```

### 2. Chat Hook

**`src/hooks/use-agent-chat.ts`**

```typescript
import { useChat as useAIChat } from 'ai/react';

export function useAgentChat() {
  return useAIChat({
    api: '/api/agent/chat',
    initialMessages: [],
    onFinish: (message) => {
      // Save to memory after each exchange
      console.log('Conversation saved to memory');
    },
  });
}
```

---

## 🔍 RAG Implementation Steps

### Step 1: Install pgvector

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Create Embeddings Table

Run the SQL from above to create `embeddings_index` table.

### Step 3: Index Existing Data

**`/api/rag/index/route.ts`**

```typescript
export async function POST(request: Request) {
  const { source, items } = await request.json();
  
  for (const item of items) {
    await indexContent(
      user.id,
      source,
      item.id,
      item.title,
      item.content,
      item.metadata
    );
  }
  
  return Response.json({ indexed: items.length });
}
```

**Index your existing data:**
```typescript
// Index all client notes
const clients = await getClients();
for (const client of clients) {
  await indexContent(
    orgId,
    'client_data',
    client.id,
    client.company_name,
    `Client: ${client.company_name}. Contact: ${client.primary_contact}. ${client.special_requirements || ''}`,
    { clientId: client.id }
  );
}

// Index activities/notes
const activities = await getActivities();
for (const activity of activities) {
  await indexContent(
    orgId,
    'activity',
    activity.id,
    activity.subject,
    `${activity.subject}. ${activity.description}. Outcome: ${activity.outcome}`,
    { clientId: activity.client_id, type: activity.activity_type }
  );
}
```

### Step 4: Search Endpoint

**`/api/rag/search/route.ts`**

```typescript
export async function POST(request: Request) {
  const { query, limit = 5 } = await request.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const results = await searchRAG(user!.id, query, limit);
  
  return Response.json({ results });
}
```

---

## 💬 Example Chat Interactions

### Example 1: Ask About Clients

**You:** "What's the status of ifund Cities?"

**Agent:** 
```
Let me check... [searches RAG + database]

iFund Cities:
- Last contact: 999 days ago (urgent re-engagement needed!)
- RFM Score: 43% (high value client)  
- Recent orders: 1 order in system
- Current status: I've proposed a re-engagement email (in Approved column)
- Recommendation: Approve the email draft to reconnect

Would you like me to draft a different approach, or shall we send the proposed email?
```

### Example 2: Draft Custom Email

**You:** "Draft a thank you email to Acme for their recent order"

**Agent:**
```
I'll create that for you...

[Creates Kanban card with email draft]

Done! I've created a card titled "Thank you email to Acme Real Estate" in the Suggested column.

The email:
- Subject: "Thank You for Your Recent Appraisal Order"
- Includes: Appreciation, service quality assurance, future availability
- CTA: Referral request

Would you like me to adjust anything before you approve it?
```

### Example 3: Check Goals

**You:** "How are we tracking on goals?"

**Agent:**
```
Here's your current status:

📊 Revenue Goal: $1,250 / $100,000 (1.3% complete)
   - Status: 98.8% behind schedule ⚠️
   - Days left: 17
   - Gap: $98,750

📊 Order Volume: 2 / 60 orders (3.3% complete)
   - Status: 96.7% behind schedule ⚠️
   - Days left: 17
   - Gap: 58 orders

Recommendation: We need aggressive action. I've created 8 action cards focusing on:
- Re-engaging dormant clients (iFund)
- Volume deals with active clients (Acme - $15k)
- Strategic calls and research

Approve the high-priority cards to accelerate towards goal.
```

### Example 4: Command to Create Card

**You:** "Create a task to research new appraisal leads in the area"

**Agent:**
```
Creating task...

✓ Done! Created "Research new appraisal leads" task
- Priority: Medium
- Assigned to: You
- Due: Tomorrow
- Location: Suggested column on Kanban board

The task includes researching:
- Competing AMCs in the region
- Recent property transactions
- Potential lending partners

Anything else you'd like me to add?
```

---

## 🛠️ Implementation Tasks

### Week 1: Chat Interface
- [ ] Add chat UI to Agent Panel
- [ ] Create `/api/agent/chat` route
- [ ] Implement streaming responses
- [ ] Add chat memory storage
- [ ] Test basic conversation

### Week 2: Tool Calling
- [ ] Define agent tools (search, create cards, etc.)
- [ ] Implement tool execution
- [ ] Test conversational workflows
- [ ] Add quick action buttons

### Week 3: RAG System
- [ ] Install pgvector extension in Supabase
- [ ] Create embeddings_index table
- [ ] Implement embedding generation
- [ ] Create search function
- [ ] Index existing data (clients, activities, notes)
- [ ] Test semantic search
- [ ] Integrate RAG into chat responses

### Week 4: Polish
- [ ] Chat history persistence
- [ ] Message editing
- [ ] Context citations
- [ ] Export conversations
- [ ] Mobile-friendly chat UI

---

## 📦 New Dependencies Needed

```bash
npm install ai @ai-sdk/openai pgvector-node
```

Or using Vercel AI SDK (already installed):
```typescript
import { useChat } from 'ai/react'; // Already have this!
import { embed } from 'ai';
```

---

## 🎯 Acceptance Criteria

- [ ] Can chat with agent via text interface
- [ ] Agent maintains conversation context  
- [ ] Agent can search clients, goals, activities
- [ ] Agent can create cards via conversation
- [ ] Agent can search knowledge base (RAG)
- [ ] Agent cites sources in responses
- [ ] Chat history persists across sessions
- [ ] Commands work: "Draft email", "Check goals", "Search X"
- [ ] Quick actions provide shortcuts

---

## 🚀 Quick Start (After Implementation)

**Chat Examples to Try:**

```
"What clients haven't we contacted recently?"
→ Agent searches and lists dormant clients

"Draft a follow-up email to Acme"
→ Agent creates card with email draft

"Why did you propose that action?"
→ Agent explains rationale with data

"Search for any mentions of volume pricing"
→ RAG finds relevant notes and emails

"Create a task to call iFund Cities next week"
→ Agent creates scheduled task

"How can we close the revenue gap?"
→ Agent analyzes and proposes strategy
```

---

## 💡 Advanced Features (Future)

- **Voice chat** (WebRTC + speech-to-text)
- **Proactive suggestions** (agent messages you first)
- **Multi-turn workflows** (agent guides you through complex tasks)
- **Learning from feedback** (improve based on your responses)
- **Contextual awareness** (knows what page you're on)
- **Slack integration** (chat via Slack DM)

---

## 🎊 Why This is Powerful

Current system: Agent → Creates cards → You review  
**With Chat:** You ↔️ Agent conversation → Collaborative planning → Better decisions

**Benefits:**
- 🗣️ **Natural interaction** - Just ask questions
- 🧠 **Contextual responses** - Agent remembers  
- 🔍 **Knowledge search** - Find anything instantly
- ⚡ **Faster workflow** - Create cards via conversation
- 🎯 **Better decisions** - Agent explains reasoning
- 📚 **Institutional memory** - Never forget client details

---

## 📋 Estimated Effort

**Chat Interface:** 2-3 days  
**Tool Calling:** 2-3 days  
**RAG System:** 3-5 days  
**Polish & Testing:** 2-3 days  

**Total:** 2-3 weeks for complete chat + RAG system

---

**Want me to start implementing this?** 

I can begin with the chat interface first (simpler), then add RAG in a second phase. This would give you conversational capabilities immediately, with knowledge base search added later.

Let me know and I'll start building! 🚀

