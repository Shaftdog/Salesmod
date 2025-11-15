---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# ✅ AI Agent Delete & Management Tools - COMPLETE!

## 🎯 Overview

The AI Agent Chat now has **comprehensive delete and management capabilities** for all major entities in the system!

---

## 🗑️ New Tools Added

### **Card Management**
1. ✅ **deleteCard** - Delete cards by ID, priority, type, title match, or client
2. ✅ **updateCard** - Update card state, priority, title, or rationale

### **Case Management**
3. ✅ **createCase** - Create support cases with full details
4. ✅ **updateCase** - Update case status, priority, resolution, or assignment
5. ✅ **deleteCase** - Delete cases by ID or case number

### **Activity Logging**
6. ✅ **createActivity** - Log calls, emails, meetings, notes with full context

### **Contact Management**
7. ✅ **deleteContact** - Remove contacts from the system

---

## 💬 How to Use - Example Commands

### Delete Cards
```
"Delete all low priority cards"
→ AI uses deleteCard tool with priority='low'

"Delete the research cards"
→ AI uses deleteCard tool with type='research'

"Delete cards for Acme Real Estate"
→ AI searches for client, uses deleteCard with clientId

"Remove card abc-123-def"
→ AI uses deleteCard with cardId
```

### Update Cards
```
"Mark card xyz as completed"
→ AI uses updateCard with state='completed'

"Change the priority of that card to high"
→ AI uses updateCard with priority='high'

"Approve the email card"
→ AI uses updateCard with state='approved'
```

### Manage Cases
```
"Create a support case about billing issue with iFund"
→ AI uses createCase with proper details

"Close case CASE-0042 with resolution notes"
→ AI uses updateCase with status='closed' and resolution

"Delete case CASE-0010"
→ AI uses deleteCase
```

### Log Activities
```
"Log a call with John Smith about order ORD-123"
→ AI uses createActivity with type='call'

"Record that I met with Acme yesterday"
→ AI uses createActivity with type='meeting'

"Add a note about the pricing discussion"
→ AI uses createActivity with type='note'
```

### Manage Contacts
```
"Delete the contact for jane@oldclient.com"
→ AI searches, then uses deleteContact
```

---

## 🔧 Technical Details

### Tool Parameters

#### deleteCard
- `cardId` (optional) - Specific UUID
- `priority` (optional) - 'low', 'medium', 'high'
- `type` (optional) - 'send_email', 'create_task', etc.
- `titleMatch` (optional) - Text to match in title
- `clientId` (optional) - Client UUID

#### updateCard
- `cardId` (required) - Card UUID
- `state` (optional) - 'suggested', 'in_review', 'approved', 'rejected', 'completed'
- `priority` (optional) - 'low', 'medium', 'high'
- `title` (optional) - New title
- `rationale` (optional) - Updated rationale

#### createCase
- `subject` (required) - Brief title
- `description` (required) - Full description
- `caseType` (required) - 'support', 'billing', 'quality_concern', etc.
- `priority` (optional) - Defaults to 'normal'
- `clientId` (optional) - Related client
- `contactId` (optional) - Related contact
- `orderId` (optional) - Related order

#### updateCase
- `caseId` (required) - UUID or case number (e.g., CASE-0042)
- `status` (optional) - 'new', 'open', 'in_progress', 'resolved', 'closed', etc.
- `priority` (optional) - 'low', 'normal', 'high', 'urgent', 'critical'
- `resolution` (optional) - Resolution notes
- `assignTo` (optional) - User UUID

#### deleteCase
- `caseId` (required) - UUID or case number

#### createActivity
- `activityType` (required) - 'call', 'email', 'meeting', 'note', 'task'
- `subject` (required) - Brief subject
- `description` (optional) - Detailed notes
- `clientId` (optional) - Related client
- `contactId` (optional) - Related contact
- `orderId` (optional) - Related order
- `outcome` (optional) - Result/outcome
- `scheduledAt` (optional) - When it occurred (ISO date)

#### deleteContact
- `contactId` (required) - Contact UUID

---

## 🧠 AI Intelligence

The AI agent now can:

1. **Understand Natural Language**
   - "Delete those low priority ones" ✓
   - "Remove all research cards" ✓
   - "Mark that as done" ✓

2. **Smart Matching**
   - Finds cards by title keywords
   - Matches clients by name
   - Handles partial matches

3. **Batch Operations**
   - Can delete multiple cards at once
   - Filters by multiple criteria
   - Returns detailed results

4. **Safe Operations**
   - Validates before deleting
   - Returns info about what was deleted
   - Proper error handling

---

## 📊 Response Format

All tools return structured responses:

```typescript
// Delete operations
{
  success: true,
  deletedCount: 5,
  deletedCards: [
    { id, title, type, priority, client },
    ...
  ]
}

// Update operations
{
  success: true,
  card: { id, title, type, state, priority }
}

// Create operations
{
  success: true,
  case: { id, caseNumber, subject, status, priority }
}
```

---

## 🎬 Testing

### Test Delete
1. Open AI Agent Chat
2. Say: "Delete all low priority cards"
3. AI should use deleteCard tool and show results
4. Refresh /agent page - cards should be gone ✓

### Test Update
1. Say: "Mark card [ID] as completed"
2. AI should use updateCard tool
3. Check Kanban - state should update ✓

### Test Create Case
1. Say: "Create a billing case about invoice error"
2. AI should use createCase tool
3. Check /cases - new case should appear ✓

### Test Activity
1. Say: "Log that I called John about order 123"
2. AI should use createActivity tool
3. Check activities - entry should appear ✓

---

## 🔐 Security

- All operations require authentication
- RLS policies enforced on all operations
- Users can only delete/update their own org's data
- Proper error handling for unauthorized access

---

## 📝 File Changes

### Modified
- `/src/lib/agent/tools.ts` - Added 7 new tools:
  - `deleteCard` - Multi-criteria card deletion
  - `updateCard` - Card state/priority updates
  - `createCase` - Case creation with auto-numbering
  - `updateCase` - Case lifecycle management
  - `deleteCase` - Case deletion
  - `createActivity` - Activity logging
  - `deleteContact` - Contact removal

---

## ✨ What's Next?

The agent now has full CRUD capabilities for:
- ✅ Cards (Create, Read, Update, Delete)
- ✅ Cases (Create, Read, Update, Delete)
- ✅ Activities (Create, Read)
- ✅ Contacts (Read, Delete)
- ✅ Clients (Read)
- ✅ Goals (Read)
- ✅ Web Search
- ✅ Knowledge Base (RAG)
- ✅ Computer Use

**Your AI Agent is now a full-featured assistant!** 🚀

---

## 🎯 Quick Reference

| What You Want | Just Say |
|---------------|----------|
| Delete cards | "Delete all [low/medium/high] priority cards" |
| Delete by type | "Delete all [email/task/research] cards" |
| Delete by client | "Delete cards for [client name]" |
| Update card | "Mark [card] as [completed/approved]" |
| Change priority | "Set [card] priority to high" |
| Create case | "Create a [support/billing] case about [issue]" |
| Update case | "Close case CASE-XXX" or "Resolve case with notes..." |
| Log activity | "Log a [call/meeting/email] with [person] about [topic]" |
| Delete contact | "Remove contact [name/email]" |

---

## 🎉 SUCCESS!

**The AI Agent Chat can now delete and manage all major entities in your CRM!**

Try it out - ask the agent to clean up low priority cards, create cases, log activities, and more!



