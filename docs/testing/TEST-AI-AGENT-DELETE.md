---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# 🧪 AI Agent Delete & Management - Testing Guide

## ✅ What Was Added

The AI Agent Chat can now:
1. **Delete cards** - By ID, priority, type, title, or client
2. **Update cards** - Change state, priority, title, rationale
3. **Create cases** - Track support issues
4. **Update cases** - Manage case lifecycle
5. **Delete cases** - Remove unnecessary cases
6. **Log activities** - Record calls, meetings, emails
7. **Delete contacts** - Remove contacts from system

---

## 🎯 Quick Tests

### Test 1: Delete Cards by Priority
**Say to AI:**
```
"Delete all low priority cards"
```

**Expected:**
- AI uses `deleteCard` tool with `priority: 'low'`
- Returns count and list of deleted cards
- Cards disappear from /agent Kanban board

---

### Test 2: Delete Cards by Type
**Say to AI:**
```
"Remove all research cards"
```

**Expected:**
- AI uses `deleteCard` tool with `type: 'research'`
- Shows which research cards were deleted

---

### Test 3: Update Card State
**Say to AI:**
```
"Mark card [ID] as completed"
```
or
```
"Approve the email card for Acme"
```

**Expected:**
- AI uses `updateCard` tool
- Card state changes to 'completed' or 'approved'

---

### Test 4: Create a Case
**Say to AI:**
```
"Create a support case about invoice discrepancy with iFund"
```

**Expected:**
- AI uses `createCase` tool with proper details
- Returns case number (e.g., CASE-0001)
- Case appears in /cases page

---

### Test 5: Update a Case
**Say to AI:**
```
"Close case CASE-0042 with resolution: Fixed invoice error"
```

**Expected:**
- AI uses `updateCase` tool
- Case status becomes 'closed'
- Resolution notes are saved

---

### Test 6: Log an Activity
**Say to AI:**
```
"Log that I called John Smith about order ORD-123 and discussed pricing"
```

**Expected:**
- AI uses `createActivity` tool
- Activity appears in timeline/activities

---

### Test 7: Delete a Contact
**Say to AI:**
```
"Delete the contact for outdated@example.com"
```

**Expected:**
- AI searches for contact first
- Uses `deleteContact` tool
- Contact is removed

---

### Test 8: Batch Delete
**Say to AI:**
```
"Delete all low priority email cards"
```

**Expected:**
- AI combines filters (priority='low' AND type='send_email')
- Deletes only cards matching both criteria

---

## 🔍 How to Verify

### For Cards:
1. Go to `/agent` page
2. Check Kanban board - deleted cards should be gone
3. Updated cards should show new state/priority

### For Cases:
1. Go to `/cases` page
2. New cases should appear with case numbers
3. Updated cases should show new status
4. Deleted cases should be removed

### For Activities:
1. Check client timeline or activities page
2. New logged activities should appear with proper details

### For Contacts:
1. Go to `/contacts` page
2. Deleted contacts should be removed

---

## 💡 Natural Language Examples

The AI understands variations:

**Delete Commands:**
- "Delete all low priority cards"
- "Remove research cards"
- "Get rid of the email cards"
- "Delete cards for Acme Real Estate"

**Update Commands:**
- "Mark that card as done"
- "Approve the email to iFund"
- "Change priority to high"
- "Set card XYZ to completed"

**Create Commands:**
- "Create a billing case about..."
- "Log a call with..."
- "Record that I met with..."
- "Track a support issue for..."

---

## 🐛 Troubleshooting

### If delete doesn't work:
1. Check browser console for errors
2. Verify authentication is working
3. Make sure cards exist that match criteria
4. Check that RLS policies allow deletion

### If AI doesn't use the tool:
1. Check system prompt includes new capabilities ✓
2. Verify `agentTools` exported correctly ✓
3. Make sure request is clear (imperative, not question)

### If "Not authenticated" error:
1. Refresh the page
2. Log out and log back in
3. Check Supabase session

---

## 📊 Expected Tool Calls

When testing, you should see in console:

```javascript
// Delete cards
{
  tool: 'deleteCard',
  params: { priority: 'low' },
  result: {
    success: true,
    deletedCount: 5,
    deletedCards: [...]
  }
}

// Update card
{
  tool: 'updateCard',
  params: { cardId: '...', state: 'completed' },
  result: {
    success: true,
    card: { id, title, state: 'completed' }
  }
}

// Create case
{
  tool: 'createCase',
  params: { subject: '...', caseType: 'support', ... },
  result: {
    success: true,
    case: { id, caseNumber: 'CASE-0001', ... }
  }
}
```

---

## ✨ Success Criteria

✅ AI can delete cards by multiple criteria
✅ AI can update card properties
✅ AI can create and manage cases
✅ AI can log activities with context
✅ AI can remove contacts
✅ All operations properly authenticated
✅ Changes persist in database
✅ UI updates reflect changes

---

## 🚀 Ready to Test!

Open the AI Agent Chat at `/agent` and start giving commands!

Try:
1. "Delete all low priority cards"
2. "Create a support case about delayed appraisal"
3. "Log a call with John about Q4 pricing"
4. "Mark card XYZ as completed"

**The AI Agent is now a full-featured CRM assistant!** 🎉



