# Account Manager Agent - Testing Guide

## Pre-Testing Checklist

Before running tests, ensure:

- [ ] Database migration has been applied
- [ ] You have at least 1 active goal in the database
- [ ] You have at least 3-5 active clients with contacts
- [ ] ANTHROPIC_API_KEY is set in environment
- [ ] Agent settings have been initialized for your user

## Unit Testing Scenarios

### Test 1: Context Builder

**Purpose:** Verify context building works correctly

```typescript
// Run in development console or create a test file
import { buildContext } from '@/lib/agent/context-builder';

const context = await buildContext('your-user-uuid');

// Verify:
console.log('Goals:', context.goals.length); // Should have at least 1
console.log('Clients:', context.clients.length); // Should have 3-5
console.log('Signals:', context.signals); // Should show recent activity
console.log('Top Client Priority:', context.clients[0].priorityScore); // Should be > 0
```

**Expected Results:**
- Context includes your active goals
- Clients are ranked by priority
- Signals reflect recent activity
- No errors thrown

### Test 2: Plan Generation

**Purpose:** Verify AI planner generates valid actions

```typescript
import { buildContext } from '@/lib/agent/context-builder';
import { generatePlan, validatePlan } from '@/lib/agent/planner';

const context = await buildContext('your-user-uuid');
const plan = await generatePlan(context);

console.log('Actions proposed:', plan.actions.length); // Should be 3-7
console.log('Summary:', plan.summary);
console.log('Goal alignment:', plan.goalAlignment);

// Validate
const validation = validatePlan(plan, context);
console.log('Valid:', validation.valid); // Should be true
console.log('Errors:', validation.errors); // Should be []
console.log('Warnings:', validation.warnings); // May have some
```

**Expected Results:**
- 3-7 actions proposed
- All actions have client_id, title, rationale
- Email actions have complete drafts
- Validation passes

### Test 3: Orchestrator

**Purpose:** Test full work cycle

```typescript
import { runWorkBlock } from '@/lib/agent/orchestrator';

const run = await runWorkBlock('your-user-uuid', 'review');

console.log('Run ID:', run.id);
console.log('Status:', run.status); // Should be 'completed'
console.log('Planned actions:', run.planned_actions); // Should match cards created
console.log('Errors:', run.errors); // Should be []

// Check database
// SELECT * FROM kanban_cards WHERE run_id = 'run.id';
```

**Expected Results:**
- Run completes successfully
- Cards created in database
- No errors in run record
- Reflection created

## Integration Testing

### Test 4: API Endpoints

#### Test: POST /api/agent/run

```bash
# Get your auth token from browser DevTools
TOKEN="your-supabase-jwt-token"

curl -X POST http://localhost:9002/api/agent/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "review"}'
```

**Expected Response:**
```json
{
  "success": true,
  "run": {
    "id": "uuid",
    "status": "completed",
    "planned_actions": 5
  }
}
```

#### Test: GET /api/agent/run

```bash
curl -X GET "http://localhost:9002/api/agent/run?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "runs": [
    {
      "id": "uuid",
      "started_at": "2024-10-15T10:00:00Z",
      "status": "completed",
      "planned_actions": 5
    }
  ]
}
```

#### Test: POST /api/agent/execute-card

```bash
# First get a card ID from the database
# SELECT id FROM kanban_cards WHERE state = 'approved' LIMIT 1;

CARD_ID="your-card-uuid"

curl -X POST http://localhost:9002/api/agent/execute-card \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cardId\": \"$CARD_ID\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "message": "Email sent successfully"
  }
}
```

### Test 5: Email Sending (Simulated)

**Purpose:** Verify email send flow

```bash
curl -X POST http://localhost:9002/api/email/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test</p>",
    "replyTo": "manager@myroihome.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "messageId": "sim_1234567890_abcdef"
}
```

**Verify:**
```sql
SELECT * FROM activities 
WHERE activity_type = 'email' 
  AND outcome = 'sent'
ORDER BY created_at DESC 
LIMIT 1;
```

### Test 6: React Hooks

**Purpose:** Verify UI data fetching

Create a test component:

```typescript
// src/app/test-agent-hooks/page.tsx
'use client';

import { useAgentRuns, useKanbanCards, useAgentStats } from '@/hooks/use-agent';

export default function TestAgentHooks() {
  const { data: runs, isLoading: runsLoading } = useAgentRuns(5);
  const { data: cards, isLoading: cardsLoading } = useKanbanCards();
  const { data: stats, isLoading: statsLoading } = useAgentStats(30);

  return (
    <div className="p-8 space-y-4">
      <h1>Agent Hooks Test</h1>
      
      <div>
        <h2>Recent Runs</h2>
        {runsLoading ? 'Loading...' : `${runs?.length || 0} runs`}
        <pre>{JSON.stringify(runs, null, 2)}</pre>
      </div>

      <div>
        <h2>Kanban Cards</h2>
        {cardsLoading ? 'Loading...' : `${cards?.length || 0} cards`}
        <pre>{JSON.stringify(cards, null, 2)}</pre>
      </div>

      <div>
        <h2>Stats</h2>
        {statsLoading ? 'Loading...' : 'Loaded'}
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>
    </div>
  );
}
```

Navigate to `/test-agent-hooks` and verify all data loads correctly.

## UI Testing

### Test 7: Agent Page

1. Navigate to `/agent`
2. Verify:
   - [ ] Page loads without errors
   - [ ] Stats cards show correct data
   - [ ] Kanban board displays with columns
   - [ ] "Agent Control Panel" button works

### Test 8: Agent Control Panel

1. Click "Agent Control Panel"
2. Verify:
   - [ ] Panel opens from right
   - [ ] Status shows correctly
   - [ ] "Start Agent Cycle" button is enabled
   - [ ] Stats display correctly
   - [ ] Upcoming actions list shows cards

3. Click "Start Agent Cycle"
4. Verify:
   - [ ] Button shows loading state
   - [ ] Toast notification appears
   - [ ] New cards appear on board
   - [ ] Status updates

### Test 9: Kanban Board

1. Verify columns display:
   - [ ] Suggested
   - [ ] In Review
   - [ ] Approved
   - [ ] Executing
   - [ ] Done
   - [ ] Blocked

2. Test card interaction:
   - [ ] Click a card to select it
   - [ ] Drag card to different column
   - [ ] Verify state updates in database

3. Test card details:
   - [ ] Card shows client name
   - [ ] Priority badge displays
   - [ ] Rationale is visible
   - [ ] Type icon shows correctly

### Test 10: Email Draft Sheet

1. Click an email card
2. Verify sheet opens with:
   - [ ] Subject line
   - [ ] Email body (HTML rendered)
   - [ ] Rationale explanation
   - [ ] Client/contact info
   - [ ] Priority badge

3. Test actions:
   - [ ] "Reject" button works
   - [ ] "Approve" button works
   - [ ] "Approve & Send" button works
   - [ ] Loading states show
   - [ ] Toast notifications appear
   - [ ] Sheet closes after action

## End-to-End Testing

### Test 11: Complete Agent Cycle

**Scenario:** Full automated workflow

1. **Setup:**
   ```sql
   -- Ensure agent is enabled
   UPDATE agent_settings SET enabled = true;
   
   -- Create a test goal
   INSERT INTO goals (metric_type, target_value, period_type, period_start, period_end, created_by, is_active)
   VALUES ('revenue', 100000, 'monthly', '2024-10-01', '2024-10-31', 'your-uuid', true);
   
   -- Ensure you have active clients
   SELECT count(*) FROM clients WHERE is_active = true;
   ```

2. **Trigger Run:**
   - Navigate to `/agent`
   - Open Agent Control Panel
   - Click "Start Agent Cycle"

3. **Verify Work Cycle:**
   ```sql
   -- Check run was created
   SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 1;
   
   -- Check cards were created
   SELECT type, state, count(*) 
   FROM kanban_cards 
   WHERE run_id = (SELECT id FROM agent_runs ORDER BY started_at DESC LIMIT 1)
   GROUP BY type, state;
   
   -- Check reflection was created
   SELECT * FROM agent_reflections ORDER BY created_at DESC LIMIT 1;
   ```

4. **Review & Approve:**
   - View cards on Kanban board
   - Click an email card
   - Review the draft
   - Click "Approve & Send"

5. **Verify Execution:**
   ```sql
   -- Check card state changed to 'done'
   SELECT id, state, executed_at FROM kanban_cards WHERE id = 'card-uuid';
   
   -- Check activity was logged
   SELECT * FROM activities WHERE activity_type = 'email' ORDER BY created_at DESC LIMIT 1;
   
   -- Check run stats updated
   SELECT sent FROM agent_runs ORDER BY started_at DESC LIMIT 1;
   ```

6. **Expected Results:**
   - ✅ Run completes in < 60 seconds
   - ✅ 3-7 cards created
   - ✅ Reflection saved
   - ✅ Approved cards execute
   - ✅ Activity logged
   - ✅ Stats updated

### Test 12: Error Handling

**Test suppressed email:**

```sql
-- Add a suppression
INSERT INTO email_suppressions (org_id, contact_id, email, reason)
VALUES ('your-uuid', 'contact-uuid', 'blocked@example.com', 'bounce');
```

Then try to execute a card for that contact:
- [ ] Execution should fail
- [ ] Card should move to 'blocked'
- [ ] Error message should mention suppression

**Test daily limit:**

```sql
-- Set low daily limit
UPDATE agent_settings SET daily_send_limit = 0 WHERE org_id = 'your-uuid';
```

Try to send an email:
- [ ] Should fail with 429 error
- [ ] Should mention daily limit reached

**Test invalid card:**

Try to execute a card that doesn't exist:
```bash
curl -X POST http://localhost:9002/api/agent/execute-card \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cardId": "00000000-0000-0000-0000-000000000000"}'
```

- [ ] Should return 404
- [ ] Error message should say "Card not found"

## Performance Testing

### Test 13: Load Testing

**Purpose:** Verify agent handles multiple clients

1. Create test data:
   ```sql
   -- Add 50 test clients (if you don't have enough)
   -- Add activities for each
   -- Add goals with pressure
   ```

2. Run agent cycle
3. Measure:
   - [ ] Completion time < 60s
   - [ ] No timeout errors
   - [ ] All clients ranked
   - [ ] Reasonable number of actions proposed

### Test 14: Concurrent Runs

**Purpose:** Verify idempotency

1. Trigger two runs simultaneously:
   ```bash
   curl -X POST http://localhost:9002/api/agent/run & 
   curl -X POST http://localhost:9002/api/agent/run &
   ```

2. Verify:
   - [ ] Only one run executes
   - [ ] Second request returns existing run
   - [ ] No duplicate cards created

## Regression Testing

After any changes, run through:

1. [ ] Context builder still works
2. [ ] Planner generates valid actions
3. [ ] Executor handles all card types
4. [ ] UI components render
5. [ ] API endpoints respond
6. [ ] Database queries execute
7. [ ] No console errors
8. [ ] No linter errors

## Success Criteria

Phase 1 is ready for production when:

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ E2E workflow completes successfully
- ✅ UI is responsive and error-free
- ✅ Agent generates reasonable suggestions
- ✅ Email sending works (simulated or real)
- ✅ Error handling is robust
- ✅ Performance is acceptable (<60s per run)
- ✅ No data leaks between users (RLS working)
- ✅ Documentation is complete

## Known Limitations (Phase 1)

- Email sending is simulated (Resend not required)
- No inbound email processing
- No Slack integration
- No web research
- No auto mode
- No RAG/knowledge base
- Manual testing required (no automated test suite)

These will be addressed in Phase 2.


