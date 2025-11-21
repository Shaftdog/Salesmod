# Duplicate Card Creation Analysis - Agent System

## Executive Summary

The agent system is creating duplicate cards in the "suggested" column due to **broken exclusion logic in the job planner's `getTargetContacts` function**. The Supabase `.not('id', 'in', string)` syntax is not working correctly, allowing already-processed contacts to be selected again and creating duplicate cards.

---

## Complete Card Creation Flow

The system has **5 different paths** for card creation:

### Path 1: Planner → Orchestrator (Main Agent Loop)
**File**: `src/lib/agent/orchestrator.ts` (lines 315-407)
```
generatePlan() → createKanbanCards() → kanban_cards.insert()
```
- Planner generates up to 10 proposed actions
- Orchestrator directly inserts cards into database
- State: `'suggested'`
- **Deduplication**: NONE - cards are inserted without checking for existing cards

### Path 2: Job Tasks → Orchestrator (Batch Email Campaigns)
**File**: `src/lib/agent/orchestrator.ts` (lines 573-871)
```
processActiveJobs() → expandTaskToCards() → kanban_cards.insert()
```
- Job planner creates tasks for each batch
- Tasks are expanded to cards (one per contact)
- State: Depends on job settings (`'suggested'`, `'in_review'`, or `'approved'`)
- **Deduplication**: Uses `getTargetContacts()` exclusion logic (BROKEN - see below)

### Path 3: Email Processing
**File**: `src/lib/agent/email-to-card.ts` (lines 29-150)
```
createCardFromEmail() → kanban_cards.insert()
```
- Triggered by Gmail integration
- Creates card for each classified email
- Stores `gmail_message_id` to prevent re-processing same email
- **Deduplication**: By `gmail_message_id` (working correctly)

### Path 4: Chat Interface (User/LLM Direct Card Creation)
**File**: `src/lib/agent/tools.ts` (lines 496-600)
```
User/LLM → createCard tool → kanban_cards.insert()
```
- User or LLM calls `createCard` tool via chat interface
- Inserts card with state `'suggested'`
- **Deduplication**: NONE

### Path 5: Tool Executor (API-based Tool Calls)
**File**: `src/lib/agent/anthropic-tool-executor.ts` (lines 654-731)
```
LLM tool call → executeAnthropicTool('createCard') → kanban_cards.insert()
```
- Called by LLM when using tools
- Inserts card with state `'suggested'`
- Recent debug logging added (commit dcfe622)
- **Deduplication**: NONE

---

## The Root Cause: Broken Exclusion Logic in Job Planner

### Location
**File**: `src/lib/agent/job-planner.ts`

#### Issue 1: Client Exclusion (Lines 562-577)
```typescript
if (excludedClientIds.length > 0) {
  clientQuery = clientQuery.not('id', 'in', `(${excludedClientIds.join(',')})`);
}
```

#### Issue 2: Contact Exclusion (Lines 659-674)
```typescript
if (excludedContactIds.length > 0) {
  query = query.not('id', 'in', `(${excludedContactIds.join(',')})`);
}
```

### The Problem

The syntax `.not('id', 'in', string)` is **incorrect** for Supabase.

**Correct syntax** (used elsewhere in codebase):
```typescript
// From src/lib/marketing/audience-builder.ts line 49
query = query.not('primary_role_code', 'in', filter.excludeRoleCodes);
// Pass ARRAY directly, not a string
```

**Current broken syntax**:
```typescript
query = query.not('id', 'in', `(${excludedContactIds.join(',')})`);
// Produces: (id NOT IN (uuid-1,uuid-2,...))
// This string format is not properly parsed by Supabase
```

### Consequence

When the `NOT IN` filter fails to apply:
1. `getTargetContacts()` returns contacts that already have cards
2. Those contacts are used to generate duplicate email cards
3. Both the original AND duplicate cards are created in `'suggested'` state
4. User sees duplicate cards in the Kanban board

### Example Scenario

**Batch 1, Job "Email AMCs":**
- getTargetContacts finds 5 contacts: [A, B, C, D, E]
- 5 cards created successfully
- Task marked as 'done'

**Batch 2, Job "Email AMCs":** (e.g., next run within same work block)
- getTargetContacts query tries to exclude contacts with existing cards
- `.not('id', 'in', '(uuid-a,uuid-b,uuid-c,uuid-d,uuid-e)')` FAILS to apply
- getTargetContacts returns ALL 5 contacts again
- 5 MORE duplicate cards created
- Both batches of 5 cards are in 'suggested' state

---

## Missing Deduplication Checks

### At Creation Time (Paths 1 & 4)
```typescript
// orchestrator.ts createKanbanCards - NO CHECK
const { data: card, error } = await supabase
  .from('kanban_cards')
  .insert({
    org_id: orgId,
    client_id: action.clientId,
    type: action.type,
    title: action.title,
    // ... no check for existing card with same title/client/type
  })
```

**What's missing**:
- No check for existing card with same `client_id`, `type`, and `title`
- No check for similar content
- No job_id tracking to prevent re-processing same job

### In Job Planner (Path 2)
The only deduplication is in `getTargetContacts()`:
```typescript
if (input.job_id) {
  const { data: existingCards } = await supabase
    .from('kanban_cards')
    .select('contact_id')
    .eq('job_id', input.job_id)
    .not('contact_id', 'is', null);
  
  // BROKEN SYNTAX HERE:
  query = query.not('id', 'in', `(${excludedContactIds.join(',')})`);
}
```

**The issue**: Even if the syntax were correct, this only works if:
- Job cards have `job_id` set ✓ (they do, see line 336, 397, 457)
- But the NOT IN filter FAILS due to syntax error ✗

---

## Exact Flow Where Duplicates Occur

### When Duplicates Are Most Likely

1. **Active jobs with multiple batches**
   - Job status: 'running'
   - Multiple batches of contacts to process
   - Each batch creates email cards

2. **Work block runs within same day/hour**
   - Job tasks stay 'pending' if not marked 'done'
   - Orchestrator re-runs and processes same job
   - getTargetContacts returns same contacts again

3. **Planner generates same action twice**
   - Rare, but possible if context changes mid-run
   - Planner suggests "email client X" twice
   - Two separate cards created instead of one

### Most Common Scenario: Job Task Re-execution

```
Time 1 (09:00):
  runWorkBlock() 
    processActiveJobs()
      Job "Email All Contacts"
        planNextBatch() → batch 1 created
        expandTaskToCards(batch_1) → 10 cards created
        Mark batch_1 as 'done'

Time 2 (09:15): New work block run
  runWorkBlock() 
    processActiveJobs()
      Job "Email All Contacts"
        Get currentBatch = 1 (still 1, batch 2 not started)
        Get pendingTasks in batch 1 → EMPTY (marked as done)
        planNextBatch() → batch 2 created
        expandTaskToCards(batch_2) → NEW 10 cards (different contacts, OK)

BUT if a task gets stuck in 'pending' state:

Time 2 (09:15): New work block run
  runWorkBlock()
    processActiveJobs()
      Job "Email All Contacts"
        Get currentBatch = 1
        Get pendingTasks in batch 1 → FOUND (still 'pending'!)
        expandTaskToCards() → getTargetContacts()
          Tries to exclude 10 already-processed contacts
          .not('id', 'in', '(...)') FAILS
          Returns all 10 contacts AGAIN
          Creates 10 DUPLICATE cards
```

---

## Data Model Issues

### kanban_cards Table
```sql
CREATE TABLE kanban_cards (
  id UUID,
  org_id UUID,
  job_id UUID,        -- Links to jobs.id
  task_id BIGINT,     -- Links to job_tasks.id
  type VARCHAR,       -- send_email, create_task, etc
  title VARCHAR,
  state VARCHAR,      -- 'suggested', 'in_review', 'approved', 'done', etc
  created_at TIMESTAMP,
  -- NO UNIQUE CONSTRAINT PREVENTING DUPLICATES
  -- NO DEDUPLICATION LOGIC
)
```

**What's missing**:
```sql
-- Missing unique constraint:
UNIQUE(job_id, task_id, contact_id)

-- Missing index for faster lookups:
CREATE INDEX idx_kanban_cards_job_contact 
ON kanban_cards(job_id, contact_id);
```

---

## Debug Evidence from Recent Changes

### Commit dcfe622: "Add debug logging to createCard tool executor"
- Added logging for userId, parameters, and database errors
- Logging shows successful inserts even when duplicates occur
- No validation to prevent duplicates at tool level

### What the logs would show:
```
[Tool Executor] createCard called with userId: org-123
[Tool Executor] createCard params: { type: 'send_email', clientId: 'c-456', title: 'Email John Doe' }
[Tool Executor] Inserting card with org_id: org-123
[Tool Executor] Card created successfully: card-id-789

[Tool Executor] createCard called with userId: org-123  ← SECOND TIME
[Tool Executor] createCard params: { type: 'send_email', clientId: 'c-456', title: 'Email John Doe' }  ← SAME PARAMS
[Tool Executor] Inserting card with org_id: org-123
[Tool Executor] Card created successfully: card-id-790  ← DIFFERENT ID = DUPLICATE
```

---

## Recommended Fixes

### Priority 1: Fix Job Planner Exclusion Syntax (CRITICAL)

**File**: `src/lib/agent/job-planner.ts`

**Line 574** (Client exclusion):
```typescript
// BEFORE (broken):
clientQuery = clientQuery.not('id', 'in', `(${excludedClientIds.join(',')})`);

// AFTER (correct):
clientQuery = clientQuery.not('id', 'in', excludedClientIds);
```

**Line 671** (Contact exclusion):
```typescript
// BEFORE (broken):
query = query.not('id', 'in', `(${excludedContactIds.join(',')})`);

// AFTER (correct):
query = query.not('id', 'in', excludedContactIds);
```

### Priority 2: Add Explicit Deduplication Before Card Insertion

**File**: `src/lib/agent/orchestrator.ts` - `createKanbanCards` function

```typescript
// Add deduplication check before insert
for (const action of actions) {
  // ... build actionPayload ...
  
  // Check for existing card with same client/type/title
  const { data: existingCard } = await supabase
    .from('kanban_cards')
    .select('id')
    .eq('org_id', orgId)
    .eq('client_id', action.clientId || null)
    .eq('type', action.type)
    .eq('title', action.title)
    .in('state', ['suggested', 'in_review', 'approved'])
    .limit(1);
  
  if (existingCard && existingCard.length > 0) {
    console.log(`Skipping duplicate card: ${action.title} for client ${action.clientId}`);
    continue; // Skip this action
  }
  
  // Only then insert
  const { data: card, error } = await supabase
    .from('kanban_cards')
    .insert({...})
}
```

### Priority 3: Add Database Constraints

```sql
-- Add unique constraint (in migration)
ALTER TABLE kanban_cards
ADD CONSTRAINT unique_job_task_contact 
UNIQUE(job_id, task_id, contact_id)
WHERE task_id IS NOT NULL;

-- Add index for exclusion queries
CREATE INDEX CONCURRENTLY idx_kanban_job_contact
ON kanban_cards(job_id, contact_id)
WHERE contact_id IS NOT NULL;
```

### Priority 4: Improve Card State Management

```typescript
// In orchestrator.ts - mark task as done BEFORE or after, with atomic operation
try {
  const { cards } = await expandTaskToCards(task, job);
  
  // Insert cards
  const { data: insertedCards } = await supabase
    .from('kanban_cards')
    .insert(cards.map(card => ({ ...card, org_id: orgId, run_id: runId })))
    .select('id');
  
  // ATOMIC: Only mark task as done if cards inserted successfully
  if (insertedCards && insertedCards.length > 0) {
    await supabase
      .from('job_tasks')
      .update({ status: 'done', output: {...} })
      .eq('id', task.id);
  }
} catch (error) {
  // Mark as error so it's not retried with same duplicates
  await supabase
    .from('job_tasks')
    .update({ status: 'error', error_message: error.message })
    .eq('id', task.id);
}
```

---

## Testing the Fix

### To verify the fix works:

1. **Create a test job** with batch_size=3 and multiple contacts
2. **Run one work block** - should create 3 cards in 'suggested'
3. **Run same work block again** - should NOT create duplicates
4. **Check logs** for exclusion messages:
   ```
   [getTargetContacts] Excluding 3 contacts that already have cards from this job
   ```

5. **Verify card count** stays at 3, not 6

### SQL query to detect duplicates:
```sql
SELECT 
  job_id,
  contact_id,
  type,
  COUNT(*) as duplicate_count
FROM kanban_cards
WHERE job_id IS NOT NULL
GROUP BY job_id, contact_id, type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

---

## Summary Table

| Issue | Location | Impact | Severity | Fix |
|-------|----------|--------|----------|-----|
| Broken `.not()` syntax | job-planner.ts:574,671 | Contacts not excluded, duplicates created | CRITICAL | Change to pass array, not string |
| No creation-time deduplication | orchestrator.ts:createKanbanCards | Same action creates multiple cards | HIGH | Add check before insert |
| No task atomic ops | orchestrator.ts:processActiveJobs | Task status mismatch causes re-processing | MEDIUM | Use transactions |
| Missing DB constraints | kanban_cards schema | Duplicates not prevented at DB level | MEDIUM | Add UNIQUE constraint |
| No index for lookups | kanban_cards schema | Slow exclusion queries | LOW | Add covering index |

---

## Files to Modify

1. **CRITICAL**: `src/lib/agent/job-planner.ts` (lines 574, 671)
2. **HIGH**: `src/lib/agent/orchestrator.ts` (lines 315-407)
3. **MEDIUM**: Database schema/migrations
4. **LOW**: Add monitoring/logging

