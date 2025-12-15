# Agent API Routes - tenant_id Migration

## Summary
Fixed all remaining `org_id` references in agent API routes to use `tenant_id` for proper multi-tenant isolation.

## Files Fixed (13 total)

### 1. src/app/api/agent/run/route.ts
- **Lines affected**: 33, 84, 123
- **Changes**:
  - Added tenant_id lookup in POST handler (agent settings query)
  - Added tenant_id lookup in GET handler (agent runs query)
  - Added tenant_id lookup in PATCH handler (stop agent query)
- **Pattern**: All queries changed from `.eq('org_id', user.id)` to `.eq('tenant_id', profile.tenant_id)`

### 2. src/app/api/agent/learning/rules/route.ts
- **Lines affected**: 35, 123, 151, 210, 259
- **Changes**:
  - GET: Fixed agent_memories query for fetching rules
  - PATCH: Fixed agent_memories queries for updating rules
  - DELETE: Fixed agent_memories query for deleting rules
  - POST: Fixed kanban_cards query for testing rules
- **Pattern**: All queries changed to use tenant_id with proper profile lookup

### 3. src/app/api/agent/card-review/route.ts
- **Line affected**: 38
- **Changes**:
  - Fixed agent_memories query for fetching rejection patterns
- **Pattern**: Added tenant_id lookup and changed query filter

### 4. src/app/api/agent/chat/route.ts
- **Line affected**: 32
- **Changes**:
  - Fixed agent_memories query for recent chat context
- **Pattern**: Added tenant_id lookup and changed query filter

### 5. src/app/api/agent/chat-simple/route.ts
- **Lines affected**: 249, 381, 421, 873, 888
- **Changes**:
  - Fixed kanban_cards query for current cards (line 249)
  - Fixed DELETE command handler card deletion (line 381)
  - Fixed APPROVE command handler card update (line 421)
  - Fixed parseAndDeleteCards function queries (lines 873, 888)
- **Pattern**: Single tenant_id lookup at top, reused throughout handlers

### 6. src/app/api/agent/chat/cleanup/route.ts
- **Lines affected**: 109, 116
- **Changes**:
  - GET: Fixed chat_messages queries for counting expired/total messages
- **Pattern**: Added tenant_id lookup and changed both count queries

### 7. src/app/api/agent/learning/dashboard/route.ts
- **Lines affected**: 28, 41
- **Changes**:
  - Fixed agent_memories query for feedback
  - Fixed kanban_cards query for success rate calculation
- **Pattern**: Added tenant_id lookup for both queries

### 8. src/app/api/agent/card/delete/route.ts
- **Lines affected**: 34, 46
- **Changes**:
  - Fixed kanban_cards query to fetch card before deletion
  - Fixed kanban_cards delete query
- **Pattern**: Added tenant_id lookup and changed both queries

### 9. src/app/api/agent/automation/execute/route.ts
- **Lines affected**: 120, 225, 263
- **Changes**:
  - Fixed consolidateRules function (line 120)
  - Fixed resolveConflict function (line 225)
  - Fixed deprecateRule function (line 263)
- **Pattern**: Each helper function now gets tenant_id from profile before queries

### 10. src/app/api/agent/execute-card/route.ts
- **Line affected**: 38
- **Changes**:
  - Fixed kanban_cards query to verify card ownership
- **Pattern**: Added tenant_id lookup and changed query filter

### 11. src/app/api/agent/automation/analyze/route.ts
- **Lines affected**: 28, 422, 441
- **Changes**:
  - Fixed agent_memories query in main handler (line 28)
  - Updated helper function parameters to use tenantId instead of orgId
  - Fixed checkRuleTriggers function (line 422)
  - Fixed calculateEffectiveness function (line 441)
- **Pattern**: Changed all helper functions from orgId to tenantId parameter

### 12. src/app/api/agent/gmail/poll/route.ts
- **Line affected**: 146
- **Changes**:
  - GET: Fixed gmail_sync_state query
- **Pattern**: Added tenant_id lookup and changed query filter

### 13. src/app/api/agent/card/manage/route.ts
- **Lines affected**: 74, 94, 112, 132
- **Changes**:
  - UPDATE: Fixed kanban_cards update query (line 74)
  - DELETE: Fixed kanban_cards delete query (line 94)
  - APPROVE: Fixed kanban_cards update query (line 112)
  - REJECT: Fixed kanban_cards update query (line 132)
- **Pattern**: File already had tenant_id lookup, just changed query filters

## Migration Pattern Applied

### Standard Pattern:
```typescript
// 1. Get user authentication
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Get user's tenant_id for multi-tenant isolation
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', user.id)
  .single();

if (!profile?.tenant_id) {
  return NextResponse.json(
    { error: 'User has no tenant_id assigned' },
    { status: 403 }
  );
}

// 3. Use tenant_id in queries
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('tenant_id', profile.tenant_id) // Changed from .eq('org_id', user.id)
```

## Important Notes

1. **INSERT statements preserved**: All INSERT statements still include `org_id` for backwards compatibility
2. **Query filters updated**: All SELECT, UPDATE, and DELETE queries now filter by `tenant_id`
3. **Single lookup per request**: Each handler performs the tenant_id lookup once and reuses it
4. **Helper functions**: Functions that accept orgId parameter were updated to accept tenantId
5. **Error handling**: Added proper error responses when tenant_id is missing

## Testing Checklist

- [ ] Agent runs (start, stop, list)
- [ ] Learning rules (get, create, update, delete, test)
- [ ] Card review chat interface
- [ ] Main chat interface
- [ ] Chat-simple interface with commands
- [ ] Chat cleanup
- [ ] Learning dashboard metrics
- [ ] Card deletion
- [ ] Automation execute (rules, conflicts, deprecation)
- [ ] Card execution
- [ ] Automation analysis
- [ ] Gmail polling
- [ ] Card management (create, update, delete, approve, reject)

## Related Files

See also:
- `TENANT_ID_MIGRATION_REPORT.md` - Original migration for main routes
- Database migration: `supabase/migrations/*_add_tenant_id.sql`

## Impact

- **Security**: Proper tenant isolation now enforced at database query level
- **Multi-tenancy**: Each organization's data properly isolated
- **Backwards Compatible**: org_id still populated in INSERT statements
- **RLS Ready**: Queries structured to work with Row Level Security policies

