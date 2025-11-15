---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Research System Fix - Complete Analysis

## Root Cause Identified ✅

The research system **IS working** - but the AI planner was creating the **wrong card type**.

### What Happened:

1. **You saw this card**: "Research APPLIED VALUATION SERVICES INC - Find Primary Contact"
2. **Card type was**: `create_task` (creates a manual task for you)
3. **What you expected**: `research` (automated web research + AI analysis)

### The Confusion:

- Card **title** said "Research..."
- Card **type** was `create_task` (not `research`)
- When executed, it just created a task in your task list
- No web search, no AI summary, no research results saved

### Why the AI Chose Wrong:

The planner prompt said:
- `research`: for "market activity, portfolio changes, expansion plans"
- `create_task`: for "actions requiring human completion"

The AI interpreted "find primary contact" as needing human work, so it created a task instead of using automated research.

## Fix Applied ✅

Updated `src/lib/agent/planner.ts` (lines 227-238) to be more explicit:

```diff
- **research**: Gather intelligence about a client (market activity, portfolio changes, expansion plans)
+ **research**: AUTOMATED research about a client using web search and AI analysis.
+   Use this to gather intelligence, find contact info, understand business context,
+   market activity, expansion plans, etc. This executes automatically and saves
+   results to the client's activity feed.

+ - For research needs (finding contacts, understanding business, market intel):
+   Use **research** - it executes automatically via web search and AI
```

## Required: Verify Vercel Environment Variables

For research to work fully on production, you need **TWO API keys**:

### 1. TAVILY_API_KEY ✅ (You confirmed this is set)
- Used for web search
- Fetches company information from the web

### 2. ANTHROPIC_API_KEY ❓ (Please verify)
- Used for AI summarization of research findings
- Required to generate the research report
- **Check if this is set in Vercel dashboard**

### How to Check:

1. Go to: https://vercel.com/[your-project]/settings/environment-variables
2. Look for `ANTHROPIC_API_KEY`
3. If missing, add it:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (your Anthropic API key)
   - Get a key from: https://console.anthropic.com/settings/keys

## How Research Works (When Card Type is Correct)

When you execute a **`research` type card**, here's what happens:

1. **Internal Data Gathering** (src/lib/research/internal-search.ts)
   - Fetches all orders for this client
   - Gets all contacts
   - Calculates engagement metrics
   - Prepares client profile

2. **Web Search** (src/lib/research/web-search.ts)
   - Uses TAVILY_API_KEY
   - Searches: "[Company Name] company information business"
   - Returns top 5 web results with snippets

3. **AI Summarization** (src/lib/research/summarizer.ts)
   - Uses ANTHROPIC_API_KEY
   - Combines internal data + web results
   - Generates comprehensive report with sections:
     - Company Overview
     - Our Relationship History
     - Current Status & Recent Activity
     - Engagement Opportunities
     - Recommended Next Actions
     - Risk Factors & Considerations

4. **Save Results**
   - Saves to `activities` table (type: 'note')
   - Subject: "Research Complete: [Company Name]"
   - Description: Full research report
   - Also saves to `agent_memories` for future reference

5. **Card Marked Complete**
   - State changes to `done`
   - `executed_at` timestamp set
   - Research results visible in client activity feed

## What Happens if ANTHROPIC_API_KEY is Missing?

If ANTHROPIC_API_KEY is not set, the research will:
1. ✅ Still gather internal data
2. ✅ Still perform web search (if TAVILY_API_KEY is set)
3. ❌ AI summarization fails
4. ✅ Falls back to basic summary with bullet points
5. ✅ Still saves to activities (but with less insight)

The fallback summary looks like:
```
# Research Summary: [Company Name]

## Our Relationship
- Total Orders: X
- Total Revenue: $X
- Last Order: [date]
- Last Contact: X days ago

## Status
⚠️ Needs re-engagement (if >30 days)

## Recommended Actions
1. Re-engagement outreach
2. Follow up on active deals
3. Review recent order patterns

Web research unavailable. AI summarization failed: [error message]
```

## Testing the Fix

### Option 1: Delete the Old Task Card, Create New Research Card

1. Delete the card "Research APPLIED VALUATION SERVICES INC - Find Primary Contact"
2. Run the agent again
3. It should now create a proper `research` type card
4. Approve and execute it
5. Check the client's activity feed for research results

### Option 2: Manually Create a Research Card

You can manually trigger research through the agent chat interface by asking:
- "Research APPLIED VALUATION SERVICES INC"
- "Find contact information for MoFin Lending"

### Option 3: Test Locally First

1. Make sure ANTHROPIC_API_KEY is set in `.env.local` ✅ (already confirmed)
2. Make sure TAVILY_API_KEY is set in `.env.local` ✅ (already confirmed)
3. Create a research card through the UI
4. Execute it locally
5. Check if research results appear in activities

## Next Steps

1. ✅ **Fix applied**: Planner now knows to use `research` cards for automated research
2. ❓ **Verify**: Check ANTHROPIC_API_KEY is set on Vercel
3. 🚀 **Deploy**: Commit and push the planner fix
4. 🧪 **Test**: Create a new research card and verify it works

## Commit the Fix

```bash
git add src/lib/agent/planner.ts
git commit -m "fix: Improve planner guidance for research vs task cards

Updated planner prompt to clearly indicate that 'research' card type
should be used for automated research including finding contact info,
not just market analysis. This ensures the AI creates research cards
instead of manual task cards for intelligence gathering.

Fixes issue where research cards showed as executed but didn't actually
perform web search and AI analysis."
git push
```

## Summary

- ✅ **Root cause identified**: AI was creating `create_task` cards instead of `research` cards
- ✅ **Planner fix applied**: Updated planner prompt to be more explicit about research automation (commit: 402adb9)
- ✅ **RAG indexing fix applied**: Changed source from 'research' to 'note' to match DB constraint (commit: 09b3bde)
- ✅ **Verified working**: ANTHROPIC_API_KEY confirmed set on Vercel (7,138 char AI summary generated)
- ✅ **Verified working**: TAVILY_API_KEY confirmed set on Vercel (5 web results found)
- ✅ **Research executing**: Card executed successfully, saved to activities table
- ✅ **Deployed to production**: Both fixes pushed and deployed to Vercel

## Test Results ✅

Production logs from successful research execution:

```
[Execute] Executing card: Research MoFin Lending - Find Contact and Assess Opportunity (research)
[Research] Starting research for client f9b1d5eb-e8a4-4b17-b475-d994cd398094
[Research] Gathered internal data: 1 orders, 300 revenue
[Research] Found 5 web results
[Research] Generated summary (7138 chars)
[Research] Saved to activities: a47d7cb9-c5b8-4b78-9429-884d55eb6643
[Research] Saved insights to agent_memories
[Execute] ✓ Research MoFin Lending - Find Contact and Assess Opportunity: Success
```

Everything working as expected! Research results are now visible in the client's activity feed.
