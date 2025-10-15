# 🤖 Agent Chat + RAG Setup Guide

## ✅ What Was Just Implemented

I've added **conversational AI** and **knowledge base search** to your Account Manager Agent!

### New Capabilities:

1. **💬 Chat with Agent** - Natural language conversation
2. **🧠 Agent Memory** - Remembers conversations
3. **🔍 RAG Search** - Semantic search over clients, activities, notes
4. **🛠️ Tool Calling** - Agent can search, create cards, check goals
5. **📚 Knowledge Base** - Index and search all your data

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Apply Database Migration

Run this in **Supabase SQL Editor**:

Open the file: `supabase/migrations/20251015120000_add_chat_and_rag.sql`

Copy all contents and run it. This creates:
- `embeddings_index` table with pgvector
- `chat_messages` table
- Search function with cosine similarity
- RLS policies

### Step 2: Index Your Data

To populate the knowledge base, call the indexing API:

```bash
# Get your auth token from browser DevTools
# Application > Local Storage > sb-access-token

TOKEN="your-token"

curl -X POST http://localhost:9002/api/rag/index-all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Or visit: http://localhost:9002/agent

And in browser console:
```javascript
fetch('/api/rag/index-all', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
  },
}).then(r => r.json()).then(console.log);
```

This will:
- Index all your clients (~2 clients)
- Index recent activities (~500 records)
- Generate embeddings for semantic search
- Takes ~30-60 seconds

### Step 3: Test the Chat!

1. Go to http://localhost:9002/agent
2. Click "Agent Control Panel"
3. Click the **"Chat"** tab (new!)
4. Start chatting!

---

## 💬 Example Conversations

### Ask About Goals

**You:** "What are my current goals?"

**Agent:** 
```
Let me check your goals... [uses getGoals tool]

You have 3 active goals:

📊 Revenue: $1,250 / $100,000 (1.3% complete)
   - Status: 98.8% behind schedule ⚠️
   - Days remaining: 17
   - Gap: $98,750

📊 Revenue: $1,250 / $30,000 (4.2% complete)
   - Status: 95.8% behind schedule ⚠️  
   - Days remaining: 17
   - Gap: $28,750

📊 Order Volume: 2 / 60 (3.3% complete)
   - Status: 96.7% behind schedule ⚠️
   - Days remaining: 17
   - Gap: 58 orders

You're significantly behind on all goals. I recommend approving the high-priority 
action cards I've created to accelerate progress.
```

### Search for Clients

**You:** "Tell me about ifund Cities"

**Agent:**
```
Searching for ifund Cities... [uses searchClients + searchKnowledge tools]

iFund Cities:
- RFM Score: 43% (high-value client)
- Last Contact: 999 days ago (urgent re-engagement needed!)
- Recent Orders: 1 order in system
- Status: Dormant but historically valuable

Based on the knowledge base:
- Previous appraisal work completed successfully
- No recent activity or communication
- High priority for re-engagement

I've already created an email card for re-engagement. Would you like me to draft 
a different approach?
```

### Create an Action

**You:** "Draft a thank you email to Acme for their recent order"

**Agent:**
```
Creating email draft for Acme Real Estate... [uses createCard tool]

✓ Done! I've created a card titled "Thank you for recent order - Acme Real Estate"

The email includes:
- Subject: "Thank You for Your Business - Order APR-2025-1001"
- Appreciation for their order
- Quality assurance messaging
- Invitation to discuss future needs
- Request for referrals

The card is in the "Suggested" column on your Kanban board. Review and approve 
when ready!

Would you like me to adjust anything in the draft?
```

### Search Knowledge Base

**You:** "Find any mentions of volume pricing"

**Agent:**
```
Searching knowledge base... [uses searchKnowledge tool]

Found 2 relevant items:

1. Email to iFund Cities (95% match)
   "Volume pricing packages for multiple orders..."
   
2. Deal: Acme Q4 Package (87% match)
   "Volume-based pricing with 15% discount on standard rates..."

Both mentions relate to proposed volume packages. Would you like me to create a 
standardized volume pricing proposal?
```

### Get Pending Actions

**You:** "What needs my attention?"

**Agent:**
```
Checking pending items... [uses getPendingCards tool]

You have 7 pending action cards:

Suggested (6):
1. 📞 Schedule strategy call with Acme (High)
2. 💰 Create Q4 bulk order opportunity for Acme (High, $15k)
3. 💰 iFund Cities Reactivation Opportunity (High)
4. ✓ Research Acme Real Estate's market activity (Medium)
5. ✓ Research iFund Cities market activity (Medium)
6. 💰 Create deal opportunity for ifund Cities (High)

Approved (1):
7. ✓ Research ifund Cities (High) - Ready to execute

Recommendation: Approve and execute the research tasks first to gather intel, 
then send the emails with informed context.

Would you like me to execute any of these now?
```

---

## 🛠️ Available Tools (Agent Can Use)

The agent has access to these functions:

1. **searchClients** - Find clients by name/email
2. **getGoals** - Check goal progress and gaps
3. **createCard** - Create action cards via conversation
4. **searchKnowledge** - Semantic search over all data (RAG)
5. **getClientActivity** - View recent interactions with a client
6. **getPendingCards** - See what needs review
7. **getRunHistory** - View agent performance

**The agent decides which tools to use based on your question!**

---

## 📊 RAG (Knowledge Base) Details

### What Gets Indexed:

**Clients:**
- Company name, contacts, phone, email
- Special requirements
- Payment terms
- Order history

**Activities:**
- Subject, description, outcome
- Client and contact info
- Type (email, call, meeting, note)
- Dates and status

### How It Works:

1. Content → OpenAI embedding (1536 dimensions)
2. Stored in `embeddings_index` with pgvector
3. Query → embedding → cosine similarity search
4. Top 3-5 most similar results returned
5. Agent uses context to inform response

### Search Quality:

- **Semantic:** Finds meaning, not just keywords
- **Fast:** pgvector optimized for speed
- **Relevant:** Only returns 70%+ similarity matches
- **Contextual:** Results tied to your organization

---

## 🎯 Usage Tips

### Best Practices:

**Ask Natural Questions:**
- ✅ "What clients need follow-up?"
- ✅ "How can I close the revenue gap?"
- ✅ "Draft an email to Acme about volume pricing"
- ❌ "clients" (too vague)
- ❌ "sql query" (not a question)

**Use Commands:**
- "Draft..." - Agent creates email card
- "Find..." - Agent searches knowledge base
- "Create..." - Agent creates task/deal/card
- "Check..." - Agent looks up current data
- "What..." - Agent analyzes and explains

**Reference Specifics:**
- "Draft email to Acme about their recent order APR-2025-1001"
- "Find all mentions of iFund Cities in the last 6 months"
- "Create a call task for next Tuesday with John at Acme"

---

## 🔧 Maintenance

### Re-index Data (Weekly or After Major Changes):

```bash
curl -X POST http://localhost:9002/api/rag/index-all \
  -H "Authorization: Bearer $TOKEN"
```

### Check Index Status:

```bash
curl http://localhost:9002/api/rag/index \
  -H "Authorization: Bearer $TOKEN"
```

### Clear Chat History:

```sql
DELETE FROM chat_messages 
WHERE org_id = 'your-user-id' 
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## 📈 What This Enables

### Conversational Workflow:

**Instead of:**
1. Click "Start Agent Cycle"
2. Wait
3. Review cards
4. Approve manually

**Now:**
- "Draft an email to Acme thanking them for their order" → Card created
- "What's the status of iFund Cities?" → Instant answer with context
- "Help me close the revenue gap" → Strategic recommendations
- "Find our last conversation about volume pricing" → RAG search

### Faster Decisions:

- Ask questions → Get answers instantly
- Request actions → Cards created on-demand
- Search history → Find anything in seconds
- Get explanations → Understand agent reasoning

---

## 🎊 You Now Have:

✅ **Autonomous Agent** (Phase 1)
- Runs every 2 hours
- Creates intelligent action cards
- Sends emails via Resend

✅ **Conversational Interface** (New!)
- Chat with natural language
- Ask questions, give commands
- Agent uses tools automatically

✅ **Knowledge Base** (RAG)
- Semantic search over all data
- Find relevant context instantly
- Agent cites sources

✅ **Agent Memory**
- Remembers conversations
- Builds context over time
- Improves suggestions

---

## 🚀 Test It Now!

1. **Apply the migration** (Step 1)
2. **Index your data** (Step 2)
3. **Go to /agent** and click "Agent Control Panel"
4. **Click "Chat" tab**
5. **Ask:** "What are my goals?"

Watch the agent:
- Call the getGoals tool
- Analyze your data  
- Provide detailed answer
- Suggest next steps

**This is the future of AI-powered account management!** 🤖✨

---

## 📝 Next Steps After Testing:

1. Train the agent with more conversations
2. Index additional data sources (orders, documents)
3. Add email threads to knowledge base
4. Configure auto-indexing triggers
5. Deploy to production

---

**Everything is implemented and ready to test!**

Apply the migration, index your data, and start chatting with your AI account manager! 🎉

