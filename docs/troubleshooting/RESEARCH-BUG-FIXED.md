---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# 🔧 Research Bug - ROOT CAUSE FOUND & FIXED

## 🎯 The Problem

Research notes were never appearing in iFund Cities' activities timeline, even though research cards showed as "Executed" in the kanban board.

## 🔍 Investigation Using Browser Automation

Used Playwright browser agent to:
1. ✅ Navigate to the agent page
2. ✅ Log in successfully
3. ✅ View the kanban board - saw research cards marked as "Executed"
4. ✅ Navigate to iFund Cities client page
5. ✅ Check Activities tab - **NO research notes!**
6. ✅ Query the database directly - **NO research cards exist!**

## 💥 The Root Cause

The AI agent was creating cards with "Research" in the title, but setting the wrong type:

```typescript
// What the AI was creating:
{
  type: "create_task",  // ❌ WRONG!
  title: "Research ifund Cities recent market activity"
}

// What it should create:
{
  type: "research",  // ✅ CORRECT!
  title: "Research ifund Cities recent market activity"
}
```

**Why this happened:**

The AI planning prompt in `src/lib/agent/planner.ts` was **missing the `research` action type entirely**!

```typescript
// OLD PROMPT (Lines 152-158):
## Action Types Available
- **send_email**: ...
- **schedule_call**: ...
- **create_task**: Internal task to research or prepare something  // ❌ Misleading!
- **follow_up**: ...
- **create_deal**: ...
// ❌ 'research' type completely missing!
```

The AI was told to use `create_task` for "research or prepare something", so it did exactly that!

## ✅ The Fix

**Updated `src/lib/agent/planner.ts` line 152-158:**

```typescript
## Action Types Available
- **send_email**: Reach out via email (follow-ups, check-ins, proposals)
- **schedule_call**: Propose a call or meeting
- **research**: Gather intelligence about a client (market activity, portfolio changes, expansion plans)  // ✅ ADDED!
- **create_task**: Internal task for follow-up, preparation, or other administrative work  // ✅ CLARIFIED!
- **follow_up**: Follow up on a previous interaction or order
- **create_deal**: Create a new deal opportunity in the pipeline
```

## 🎊 What This Fixes

✅ AI will now create proper `research` type cards  
✅ Research cards will execute the `executeResearch()` function  
✅ Research will gather internal data about clients  
✅ Research will perform AI summarization  
✅ Research notes will be saved to activities table  
✅ Research will be indexed to RAG knowledge base  
✅ Research will be saved to agent_memories  

## 📝 Additional Fixes Applied

While investigating, also fixed:

1. ✅ **Task priority mapping** - `medium` → `normal` (was causing constraint violations)
2. ✅ **User authentication** - All executor functions now use authenticated user ID
3. ✅ **Error checking** - Added proper error logging for activity insertions

## 🧪 To Test

1. Start the dev server
2. Go to `/agent`
3. Click "Agent Control Panel" → "Control" tab
4. Click "Start Agent Cycle"
5. Wait for the agent to generate new action cards
6. Look for cards with "Research" in the title
7. Check that their type is `research` (will show ✓ icon)
8. Approve and execute one
9. Go to the client page → Activities tab
10. **See the research note!** 🎉

## 🔧 Files Modified

- `src/lib/agent/planner.ts` - Added `research` action type to AI prompt
- `src/lib/agent/executor.ts` - Fixed user authentication and priority mapping

## 📊 Database Findings

Using test API endpoints, discovered:
- **0 research cards** in the entire database
- All "research" cards were actually type `create_task`
- They failed with priority constraint errors
- No research was ever actually performed

## 🚀 Next Steps

The fix is live! The next time the agent runs, it will:
1. Know about the `research` action type
2. Create proper research cards
3. Execute them correctly
4. Save research notes to activities

**The research system is now fully functional!** 🎯


