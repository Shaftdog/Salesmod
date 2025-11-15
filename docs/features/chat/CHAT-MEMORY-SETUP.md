---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# 🧠 Intelligent Chat Memory Management

## Overview

Your chat system now has **3-tier memory preservation**:

1. **Recent Chat** (30 days) - Full conversation history
2. **Important Memories** (Forever) - Summarized context in agent_memories
3. **Searchable Knowledge** (Forever) - Chat conversations indexed in RAG

This ensures the agent can reference important conversations even after raw chat is deleted!

---

## 🎯 How It Works

### Tier 1: Raw Chat Messages (30 days)
**Storage:** `chat_messages` table  
**Retention:** 30 days (configurable)  
**Purpose:** Recent conversation history  
**Auto-cleanup:** Yes (after expiry)

### Tier 2: Conversation Summaries (Forever)
**Storage:** `agent_memories` table (scope='chat')  
**Retention:** Permanent  
**Purpose:** Preserve important decisions and context  
**Auto-cleanup:** No

### Tier 3: Searchable Chat (Forever)
**Storage:** `embeddings_index` (RAG)  
**Retention:** Permanent  
**Purpose:** Semantic search over past conversations  
**Auto-cleanup:** No

---

## 📊 Example Flow

### Day 1: You Chat with Agent
```
You: "I want to focus on closing the revenue gap with existing clients"
Agent: "Great strategy! Let's prioritize Acme and iFund..."
[More back and forth discussion]
```

**Stored in:**
- ✅ chat_messages (full detail)
- ⏳ Will be summarized tomorrow
- ⏳ Will be indexed into RAG

### Day 2: Automatic Preservation
**System runs cleanup:**
1. Groups yesterday's messages into conversations
2. Summarizes to agent_memories:
   ```json
   {
     "summary": "User decided to focus on existing clients...",
     "decisions": ["Prioritize Acme", "Re-engage iFund"],
     "topics": ["revenue gap", "client strategy"]
   }
   ```
3. Indexes into RAG with embeddings
4. Raw messages still in chat_messages (27 days left)

### Day 31: Raw Messages Deleted
**What happens:**
- ❌ Raw chat_messages deleted (to keep DB fast)
- ✅ Summary still in agent_memories
- ✅ Conversation still searchable in RAG

**Agent can still:**
- Remember: "Last month you decided to prioritize existing clients"
- Search: "revenue gap strategy" → finds the conversation
- Reference: "You mentioned focusing on Acme..."

---

## 🚀 Setup (5 Minutes)

### Step 1: Apply Migration

In **Supabase SQL Editor**, run:
**File:** `supabase/migrations/20251015130000_chat_cleanup_and_memory.sql`

This adds:
- `expires_at` column to chat_messages
- `cleanup_expired_chats()` function
- `preserve_chat_context()` function
- `chat_retention_days` to agent_settings
- Automatic expiry trigger

### Step 2: Set Retention Period (Optional)

Default is 30 days. To change:

```sql
-- Keep chat for 60 days instead
UPDATE agent_settings 
SET chat_retention_days = 60 
WHERE org_id = 'your-user-id';
```

### Step 3: Schedule Cleanup (Production)

For production, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/agent/run",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/agent/chat/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs cleanup daily at 2am.

---

## 🔧 Manual Operations

### Index Current Chats into RAG

```javascript
// In browser console
fetch('/api/rag/index-all', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

### Check Cleanup Status

```javascript
fetch('/api/agent/chat/cleanup')
  .then(r => r.json())
  .then(status => {
    console.log('Total messages:', status.total_messages);
    console.log('Expired:', status.expired_messages);
    console.log('Active:', status.active_messages);
  });
```

### Run Cleanup Manually

```javascript
fetch('/api/agent/chat/cleanup', { method: 'POST' })
  .then(r => r.json())
  .then(result => {
    console.log('Cleaned:', result.cleaned);
    console.log('Indexed:', result.indexed);
    console.log('Preserved:', result.preserved);
  });
```

### Query Preserved Memories

```sql
SELECT * FROM agent_memories 
WHERE scope = 'chat' 
  AND org_id = 'your-user-id'
ORDER BY last_used_at DESC;
```

### Search Old Conversations via RAG

In chat, ask:
```
"Find our previous conversation about revenue strategy"
"What did we discuss about iFund last week?"
"Search for mentions of Q4 goals in our chats"
```

The RAG will find it even if the raw messages are deleted!

---

## 💡 Best Practices

### What Gets Preserved:

**High-Value Conversations:**
- Strategic decisions ("Let's prioritize Acme")
- Goal discussions ("Focus on revenue gap")  
- Client insights ("iFund responds better to volume deals")
- Action plans ("Create email, then call")

**Auto-Preserved:**
- All conversations summarized daily
- Indexed into RAG for search
- Stored in agent_memories

### What Gets Deleted:

**Low-Value Messages:**
- "hi"
- "thanks"
- "ok"
- Test messages

**When:**
- After 30 days (configurable)
- Only raw messages deleted
- Summaries and RAG entries preserved

---

## 🎯 Benefits

### Database Performance:
- ✅ Old messages auto-deleted
- ✅ Queries stay fast
- ✅ Storage costs controlled

### Agent Intelligence:
- ✅ Still remembers important context
- ✅ Can search old conversations
- ✅ References past decisions
- ✅ Builds on previous discussions

### User Experience:
- ✅ Recent chat history (30 days full detail)
- ✅ Long-term memory (summaries forever)
- ✅ Searchable past (RAG forever)
- ✅ No manual cleanup needed

---

## 📊 Storage Estimates

**With 30-day retention:**

Daily chat: ~20 messages  
Monthly: ~600 messages  
Stored at any time: ~600 messages (30 days)

**After 1 year:**
- Raw messages: ~600 (always last 30 days)
- Memories: ~12 summaries (monthly)
- RAG entries: ~12 conversation indexes

**Result:** Database stays small and fast!

---

## 🔍 How Agent Uses This

### Example Conversation (3 months later):

**You:** "What did we decide about client prioritization?"

**Agent:**
1. Searches agent_memories (scope='chat')
2. Finds: "Conversation summary from 3 months ago"
3. Reads: "User decided to focus on existing clients first"
4. Also searches RAG: "client prioritization"
5. Finds: Full conversation about the decision
6. Responds: "Three months ago, you decided to prioritize existing clients like Acme over new prospecting. Would you like to continue that strategy?"

**Even though the raw chat is deleted, the agent still knows!**

---

## ⚙️ Configuration

### Adjust Retention Period:

```sql
-- Keep for 60 days
UPDATE agent_settings SET chat_retention_days = 60;

-- Keep for 7 days (aggressive cleanup)
UPDATE agent_settings SET chat_retention_days = 7;

-- Keep forever (not recommended)
UPDATE chat_messages SET expires_at = NULL;
```

### Disable Auto-Expiry:

```sql
-- Remove expiry from existing messages
UPDATE chat_messages 
SET expires_at = NULL 
WHERE org_id = 'your-user-id';

-- Disable trigger
DROP TRIGGER IF EXISTS chat_message_expiry ON chat_messages;
```

---

## 📝 Summary

**Your chat system now:**
- ✅ Keeps recent history (30 days full detail)
- ✅ Summarizes important context (forever)
- ✅ Indexes conversations (RAG searchable forever)
- ✅ Auto-cleans old messages (keeps DB fast)
- ✅ Agent still remembers important stuff

**Best of both worlds:**
- Recent detail + Long-term memory
- Fast database + Preserved knowledge
- Auto-cleanup + Smart retention

---

## 🎊 Next Steps

1. **Apply the migration** (`20251015130000_chat_cleanup_and_memory.sql`)
2. **Test cleanup:** `POST /api/agent/chat/cleanup`
3. **Index current chats:** Already done in `/api/rag/index-all`
4. **Deploy cron:** Add cleanup to vercel.json

---

**Your agent will now intelligently manage chat history while preserving important context forever!** 🧠✨

Read: `CHAT-MEMORY-SETUP.md` for complete details!

