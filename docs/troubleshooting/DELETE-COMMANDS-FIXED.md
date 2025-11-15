---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# 🗑️ Delete Commands - FIXED AND ENHANCED!

## ✅ Delete Now Works with Smart Matching!

I've fixed and enhanced the delete command system so you can delete cards in multiple ways!

---

## 🎯 How to Delete Cards

### By Priority:
```
"Delete all low priority cards"
→ Deletes all cards with priority = low

"Delete medium priority cards"
→ Deletes all medium priority

"Delete low priority tasks"
→ Deletes only low priority tasks
```

### By Type:
```
"Delete email cards"
→ Deletes all email cards

"Delete research tasks"
→ Deletes all research cards

"Delete deal cards"
→ Deletes all deal cards

"Delete call cards"
→ Deletes all call/meeting cards
```

### By Client:
```
"Delete cards for iFund"
→ Deletes all iFund-related cards

"Delete Acme cards"
→ Deletes all Acme-related cards
```

### By Title/Description:
```
"Delete the Q4 portfolio card"
→ Matches title containing "Q4 portfolio"

"Delete reactivation cards"
→ Matches titles with "reactivation"
```

### By Specific ID:
```
"Delete card abc-123-def-456"
→ Deletes specific card by UUID
```

### Combined Criteria:
```
"Delete all low priority email cards"
→ Must be BOTH low priority AND email type

"Delete research cards for iFund"
→ Must be BOTH research type AND for iFund client
```

---

## 💡 What Happens

**You ask:** "Delete all low priority cards"

**System:**
1. Loads all Kanban cards
2. Filters for priority = 'low'
3. Deletes each matched card from database
4. Counts how many deleted

**Agent responds:**
```
✅ Deleted 5 card(s):
   - Research Acme Real Estate's recent market activity (Acme Real Estate)
   - Create potential deal opportunity for ifund Cities (ifund Cities)
   - Schedule follow-up call with contacts (Acme Real Estate)
   - Review service feedback (ifund Cities)
   - Analyze competitor pricing (General)
```

**Then refresh /agent page** → Cards are gone! ✓

---

## 🧪 Test It Right Now!

**Open chat and try:**

### Test 1: Delete by Priority
```
"Delete all low priority cards"
```

**Expected:** Agent lists and deletes all low-priority cards

### Test 2: Delete by Type
```
"Delete deal cards"
```

**Expected:** Deletes all deal-type cards

### Test 3: Delete by Client
```
"Delete iFund cards"
```

**Expected:** Deletes all cards related to iFund Cities

### Test 4: See Results
```
"What cards are left?"
```

**Expected:** Agent shows remaining cards on Kanban

---

## 📊 Matching Logic

**The system matches cards when:**

1. **Priority matches:**
   - Message contains "low priority" + card.priority === 'low'
   - Message contains "high priority" + card.priority === 'high'

2. **Type matches:**
   - Message contains "email" + card.type === 'send_email'
   - Message contains "research" + card.type === 'research'
   - Message contains "task" + card.type === 'create_task'
   - Message contains "deal" + card.type === 'create_deal'

3. **Client matches:**
   - Message contains client name (case-insensitive)
   - "iFund" matches "ifund Cities"
   - "Acme" matches "Acme Real Estate"

4. **Title matches:**
   - Message words appear in card title
   - Partial matching works
   - "Q4" matches any title with "Q4"

5. **Explicit ID:**
   - Full UUID provided
   - Or "card #123" format

**Multiple criteria = AND logic** (must match all)

---

## ⚠️ Safety Features

### Confirmation in Response:
Agent always lists what it deleted:
```
✅ Deleted 3 card(s):
   - [Card 1 title and client]
   - [Card 2 title and client]
   - [Card 3 title and client]
```

### No Match = No Action:
```
⚠️ No matching cards found to delete. 
Try: "Delete card [ID]" or be more specific.
```

### Undo Option:
If you delete by mistake:
- Cards are gone from Kanban
- BUT still in database (soft delete could be added)
- Agent can recreate similar cards in next run

---

## 💡 Best Practices

### Be Specific:
**Good:**
- "Delete all low priority email cards"
- "Delete research tasks for iFund"
- "Delete the Q4 portfolio deal card"

**Less Ideal:**
- "Delete cards" (which ones?)
- "Delete it" (what is "it"?)
- "Remove" (remove what?)

### Check First:
**Safe workflow:**
1. Ask: "What cards are on the board?"
2. Review the list
3. Then: "Delete all low priority cards"
4. Confirm deleted list
5. Refresh /agent to verify

### Use Priority for Cleanup:
**Smart approach:**
```
"Delete all low priority cards"
→ Cleans up less important items

"Delete medium priority research cards"  
→ More targeted cleanup

Keep high priority cards!
```

---

## 🎯 Other Commands (Also Enhanced)

### Approve Cards:
```
"Approve all high priority cards"
→ Approves all high-priority items

"Approve the research card"
→ Matches and approves research cards

"Approve cards for Acme"
→ Approves all Acme-related cards
```

### Execute Cards:
```
"Execute approved cards"
→ Lists approved cards, guides to "Start Agent Cycle"
```

---

## ✅ What's Fixed

**Before:**
- Delete only worked with exact card ID
- Couldn't delete by description
- Limited matching

**Now:**
- ✅ Delete by priority (low, medium, high)
- ✅ Delete by type (email, research, task, deal, call)
- ✅ Delete by client (iFund, Acme)
- ✅ Delete by title keywords
- ✅ Delete by explicit ID
- ✅ Smart matching with multiple criteria
- ✅ Confirmation of what was deleted

---

## 🎊 READY TO TEST!

**Open chat and say:**

```
"Delete all low priority cards"
```

**Then:**
```
"What cards are left on the board?"
```

**Agent will:**
1. Delete the low-priority cards
2. Confirm what was deleted
3. Show you remaining cards

**Refresh /agent page** → Low priority cards are gone! ✓

---

**The delete command now works intelligently with smart matching!** 🗑️✨

Try it! 🚀

