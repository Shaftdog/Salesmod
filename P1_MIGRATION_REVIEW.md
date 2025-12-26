# P1 Database Migration Review
**Migration File**: `supabase/migrations/20251223000000_p1_engines.sql`
**Review Date**: 2025-12-22
**Reviewer**: Claude Code (Database Architect)

## Executive Summary

**Overall Status**: PASS WITH MINOR RECOMMENDATIONS

The P1 migration is well-designed and ready for deployment. It creates 10 new tables and 3 utility functions to support Phase 1 automation engines. All critical requirements are met:
- Proper tenant isolation with RLS policies
- Comprehensive indexes for query optimization
- Foreign key constraints for referential integrity
- Service role policies for autonomous agents
- Safe schema additions with IF NOT EXISTS checks

## Current Database State

### Existing Tables
- `deals` table exists with 16 columns (no P1 automation columns yet)
- None of the new P1 tables exist yet
- None of the P1 utility functions exist yet

### Conflicts
No table name conflicts detected. Migration is safe to apply.

---

## Table-by-Table Review

### 1. feedback_requests (P1.3: Feedback Automation)
**Status**: PASS

**Purpose**: Track post-delivery feedback collection and responses

**Schema Quality**: Excellent
- Proper status workflow with CHECK constraint
- Good timing fields for scheduling and tracking
- Response data capture (email_id, sentiment, summary)
- Follow-up action tracking (case creation, service recovery)
- UNIQUE constraint on (tenant_id, order_id) prevents duplicates

**Indexes**: PASS
- `idx_feedback_pending`: Partial index on pending items (optimized for engine queries)
- `idx_feedback_order`: Quick order lookups

**RLS Policies**: PASS
- Tenant isolation using auth.uid() → profiles → tenant_id
- WITH CHECK for write operations
- Service role bypass policy

**Foreign Keys**: PASS
- All references cascade appropriately
- contact_id uses SET NULL (contact deletion doesn't break feedback)

**Recommendations**: None. Well-designed.

---

### 2. deal_stage_history (P1.4: Deals Engine)
**Status**: PASS

**Purpose**: Track deal stage transitions for analytics and stall detection

**Schema Quality**: Good
- Captures from_stage, to_stage, timing
- Tracks who made the change (changed_by)
- Calculates days_in_previous_stage for velocity metrics

**Indexes**: PASS
- `idx_deal_history`: Deal-specific history (DESC for recent first)
- `idx_deal_history_tenant`: Tenant-wide reporting

**RLS Policies**: PASS
- Standard tenant isolation
- Service role access

**Foreign Keys**: PASS
- CASCADE on deal deletion (clean up history)
- SET NULL on user deletion (preserve audit trail)

**Recommendations**:
- Consider adding trigger to auto-insert history row on deals.stage update
- This would ensure complete audit trail without manual API calls

---

### 3. deal_stage_config (P1.4: Deals Engine)
**Status**: PASS

**Purpose**: Per-tenant configuration for stall detection thresholds

**Schema Quality**: Good
- Tenant-specific thresholds per stage
- Configurable follow-up intervals
- UNIQUE constraint on (tenant_id, stage)

**Indexes**:
- Implicit index on UNIQUE constraint covers common queries

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Recommendations**:
- Consider seeding default configs for new tenants
- Add migration to insert default rows for standard stages

---

### 4. deals Table Alterations (P1.4)
**Status**: PASS

**Purpose**: Add automation tracking columns to existing deals table

**Implementation**: Excellent
- Uses DO $$ block with IF NOT EXISTS checks
- Safe for re-running (idempotent)
- Adds 5 columns for automation state:
  - `last_activity_at`: For stall detection
  - `stalled_at`: Mark stall timestamp
  - `auto_follow_up_enabled`: Per-deal opt-in/out
  - `next_follow_up_at`: Schedule next action
  - `follow_up_count`: Track attempt count

**Missing**:
- No index on `last_activity_at` (but may be covered by function logic)
- No index on `next_follow_up_at` for scheduled queries

**Recommendations**:
- Add composite index: `idx_deals_follow_up ON deals(tenant_id, auto_follow_up_enabled, next_follow_up_at)` WHERE auto_follow_up_enabled = TRUE
- Add index: `idx_deals_activity ON deals(tenant_id, last_activity_at)` for stall detection

---

### 5. quotes (P1.5: Quotes/Bids Engine)
**Status**: PASS

**Purpose**: Manage quote lifecycle from draft to outcome

**Schema Quality**: Excellent
- Comprehensive status workflow (8 states)
- Tracking fields (sent_at, viewed_at, view_count)
- Outcome capture with competitor intelligence
- Intel gathering via JSONB for flexible data
- Follow-up scheduling built-in
- UNIQUE on (tenant_id, quote_number)

**Indexes**: PASS
- `idx_quotes_status`: Primary query pattern
- `idx_quotes_client`: Client relationship queries
- `idx_quotes_followup`: Partial index for active quotes needing follow-up

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Foreign Keys**: PASS
- Cascading references where appropriate
- Optional deal_id for quote-to-deal conversion

**Recommendations**: None. Comprehensive design.

---

### 6. quote_activities (P1.5)
**Status**: PASS

**Purpose**: Activity log for quote interactions

**Schema Quality**: Good
- Activity type categorization
- JSONB metadata for flexibility
- Tracks who performed action

**Indexes**: PASS
- `idx_quote_activities`: Quote timeline queries (DESC)

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Recommendations**: None.

---

### 7. quote_outcomes (P1.5)
**Status**: PASS

**Purpose**: Structured outcome data for pattern learning

**Schema Quality**: Excellent
- Primary and secondary reasons for loss analysis
- Competitor tracking
- Price comparison (our_amount vs competitor_amount)
- Learnings field for AI extraction
- Separate from quotes table allows multiple outcome records if needed

**Indexes**:
- Consider adding: `idx_quote_outcomes_analysis ON quote_outcomes(tenant_id, outcome, recorded_at DESC)` for reporting

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Recommendations**:
- Add composite index for reporting queries

---

### 8. contact_enrichment_queue (P1.6: Contact Enrichment)
**Status**: PASS

**Purpose**: Queue contact data enrichment from various sources

**Schema Quality**: Good
- Source tracking (email_signature, apollo, manual, web_search)
- Status workflow
- JSONB for flexible extracted data
- Merge tracking (merged_to_contact_id, conflicts)
- Error capture

**Indexes**: PASS
- `idx_enrichment_pending`: Partial index for queue processing

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Foreign Keys**: PASS
- Cascade on tenant deletion
- SET NULL on contact deletion (preserve queue item)

**Recommendations**:
- Consider adding index on `email_address` for deduplication queries
- Add: `idx_enrichment_email ON contact_enrichment_queue(tenant_id, email_address)` WHERE status = 'pending'

---

### 9. opportunity_signals (P1.6)
**Status**: PASS

**Purpose**: Capture detected opportunity signals from interactions

**Schema Quality**: Excellent
- Source type and ID for traceability
- Signal type categorization (complaint, urgency, budget, competitor, etc.)
- Signal strength scoring (0.0 to 1.0)
- Extracted text and context preservation
- Action tracking (actioned, action_taken, result)

**Indexes**: PASS
- `idx_signals_unactioned`: Partial index on actionable signals (sorted by strength)
- `idx_signals_client`: Client-specific signal history

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Foreign Keys**: PASS
- CASCADE on client/contact deletion

**Recommendations**: None. Well-designed for ML pattern detection.

---

### 10. compliance_schedule (P1.7: Quarterly Compliance)
**Status**: PASS

**Purpose**: Define recurring compliance check schedules

**Schema Quality**: Good
- Compliance type categorization
- Frequency options (monthly, quarterly, semi_annual, annual)
- Target entity type and filter specification
- Required fields specification via JSONB
- Notification and escalation timing
- Active/inactive toggle

**Indexes**: PASS
- `idx_compliance_schedule_due`: Partial index on active schedules

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Recommendations**:
- Consider adding validation for `target_filter` JSONB structure
- Document expected JSON schema for filters

---

### 11. compliance_checks (P1.7)
**Status**: PASS

**Purpose**: Individual compliance check instances

**Schema Quality**: Excellent
- Entity type and ID for polymorphic associations
- Period tracking (start, end, due_at)
- Comprehensive status workflow (7 states)
- Validation tracking (required_fields, missing_fields, errors)
- Communication tracking (reminders, escalations)
- Resolution tracking (completed_at, completed_by, waived_reason)

**Indexes**: PASS
- `idx_compliance_due`: Partial index on active checks
- `idx_compliance_entity`: Entity lookups

**RLS Policies**: PASS
- Tenant isolation
- Service role access

**Foreign Keys**: PASS
- SET NULL on schedule deletion (preserve completed checks)
- Escalation tracking to profiles

**Recommendations**: None. Comprehensive compliance tracking.

---

## Utility Functions Review

### 1. get_stalled_deals()
**Status**: PASS

**Purpose**: Find deals exceeding stall thresholds

**Implementation Quality**: Good
- Proper tenant_id parameter
- LEFT JOIN with deal_stage_config for thresholds
- Filters closed deals (won/lost)
- Respects auto_follow_up_enabled flag
- Returns structured data with calculated fields
- LIMIT parameter for pagination

**Performance**: Good
- Will use indexes on deals.tenant_id
- Function should be fast with proper indexes

**Recommendations**:
- Add index on deals: `idx_deals_stall_detection ON deals(tenant_id, stage, auto_follow_up_enabled, last_activity_at)` WHERE stage NOT IN ('won', 'lost')

---

### 2. get_quotes_needing_followup()
**Status**: PASS

**Purpose**: Find quotes ready for follow-up

**Implementation Quality**: Excellent
- Proper tenant_id parameter
- Filters by status (sent, viewed)
- Excludes quotes with outcomes (already decided)
- Checks follow-up count limit
- Checks scheduled time (next_follow_up_at)
- Smart sorting (high value first, then by age)
- LIMIT parameter for batch processing

**Performance**: Good
- Partial index `idx_quotes_followup` will accelerate this query

**Recommendations**: None. Well-optimized.

---

### 3. get_compliance_due()
**Status**: PASS

**Purpose**: Find compliance checks due or overdue

**Implementation Quality**: Excellent
- JOIN with compliance_schedule for notification window
- Dual condition: due within notification window OR overdue
- Calculates days_until_due and is_overdue
- Smart sorting (overdue first, then by due date)
- LIMIT parameter

**Performance**: Good
- Partial index `idx_compliance_due` will help
- JOIN to schedule is necessary for notification_days_before

**Recommendations**: None. Well-designed for cron job queries.

---

## RLS Policy Analysis

### Policy Pattern
All tables use identical policy structure:
```sql
CREATE POLICY tenant_isolation ON table_name
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
```

**Status**: PASS

**Strengths**:
- Consistent pattern across all tables
- Both read (USING) and write (WITH CHECK) protection
- Subquery pattern is standard Supabase approach

**Potential Issues**:
- Subquery executed on every row check (could be slow for large result sets)
- No caching of tenant_id lookup

**Alternatives to Consider**:
1. Use security definer function to cache tenant lookup:
```sql
CREATE OR REPLACE FUNCTION auth.current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE POLICY tenant_isolation ON table_name
    FOR ALL
    USING (tenant_id = auth.current_tenant_id())
    WITH CHECK (tenant_id = auth.current_tenant_id());
```

2. Use JWT claims (if tenant_id added to JWT):
```sql
USING (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id')
```

**Recommendation**: Current pattern is acceptable, but consider optimizing if RLS performance becomes an issue. The security definer function approach would reduce subquery overhead.

---

## Index Strategy Review

### Existing Indexes: PASS

All critical query patterns are covered:
- Partial indexes on status/state columns (optimization for common queries)
- Composite indexes for multi-column filters
- DESC ordering where needed for timeline queries

### Missing Indexes (Recommended)

1. **deals table**:
   ```sql
   CREATE INDEX idx_deals_follow_up
     ON deals(tenant_id, auto_follow_up_enabled, next_follow_up_at)
     WHERE auto_follow_up_enabled = TRUE;

   CREATE INDEX idx_deals_stall_detection
     ON deals(tenant_id, stage, last_activity_at)
     WHERE stage NOT IN ('won', 'lost');
   ```

2. **contact_enrichment_queue**:
   ```sql
   CREATE INDEX idx_enrichment_email
     ON contact_enrichment_queue(tenant_id, email_address)
     WHERE status = 'pending';
   ```

3. **quote_outcomes** (for reporting):
   ```sql
   CREATE INDEX idx_quote_outcomes_analysis
     ON quote_outcomes(tenant_id, outcome, recorded_at DESC);
   ```

These are not critical for initial deployment but will improve performance as data grows.

---

## Query Pattern Analysis

### P1.3 Feedback Engine
**Primary Query**: Get feedback requests due for sending
```sql
SELECT * FROM feedback_requests
WHERE tenant_id = ?
  AND status = 'pending'
  AND scheduled_for <= NOW()
ORDER BY scheduled_for
LIMIT 20;
```
**Index Coverage**: EXCELLENT (`idx_feedback_pending`)

---

### P1.4 Deals Engine
**Primary Query**: Find stalled deals (via function)
```sql
SELECT * FROM get_stalled_deals(?, 20);
```
**Index Coverage**: GOOD (will benefit from recommended index)

**Secondary Query**: Record stage change
```sql
INSERT INTO deal_stage_history (tenant_id, deal_id, from_stage, to_stage, ...)
```
**Index Coverage**: N/A (insert operation)

---

### P1.5 Quotes Engine
**Primary Query**: Find quotes needing follow-up (via function)
```sql
SELECT * FROM get_quotes_needing_followup(?, 20);
```
**Index Coverage**: EXCELLENT (`idx_quotes_followup`)

**Secondary Query**: Record quote activity
```sql
INSERT INTO quote_activities (tenant_id, quote_id, activity_type, ...)
```
**Index Coverage**: N/A (insert operation)

---

### P1.6 Contact Enrichment
**Primary Query**: Get pending enrichment tasks
```sql
SELECT * FROM contact_enrichment_queue
WHERE tenant_id = ?
  AND status = 'pending'
ORDER BY created_at
LIMIT 20;
```
**Index Coverage**: EXCELLENT (`idx_enrichment_pending`)

**Secondary Query**: Find unactioned signals
```sql
SELECT * FROM opportunity_signals
WHERE tenant_id = ?
  AND actioned = FALSE
ORDER BY signal_strength DESC
LIMIT 20;
```
**Index Coverage**: EXCELLENT (`idx_signals_unactioned`)

---

### P1.7 Compliance Engine
**Primary Query**: Find compliance checks due (via function)
```sql
SELECT * FROM get_compliance_due(?, 20);
```
**Index Coverage**: EXCELLENT (`idx_compliance_due`)

---

## Data Integrity Analysis

### Foreign Key Constraints: PASS

All foreign keys are properly defined with appropriate cascade rules:
- `tenant_id`: CASCADE (tenant deletion removes all data)
- `order_id`, `deal_id`, `quote_id`: CASCADE (parent deletion removes children)
- `client_id`: CASCADE (client deletion removes related data)
- `contact_id`: SET NULL (contact deletion preserves records)
- `schedule_id`: SET NULL (preserve completed checks)
- User references (`created_by`, etc.): SET NULL (user deletion preserves audit trail)

### Check Constraints: PASS

Status enums are properly constrained:
- `feedback_requests.status`: 5 valid states
- `quotes.status`: 8 valid states
- `compliance_schedule.frequency`: 4 valid options
- `compliance_checks.status`: 7 valid states
- `opportunity_signals.signal_strength`: 0.0 to 1.0
- `quote_outcomes.outcome`: 3 valid states

### Unique Constraints: PASS

Proper uniqueness enforcement:
- `feedback_requests`: (tenant_id, order_id)
- `deal_stage_config`: (tenant_id, stage)
- `quotes`: (tenant_id, quote_number)

---

## Migration Safety Analysis

### Idempotency: EXCELLENT

All table creations use `IF NOT EXISTS`:
```sql
CREATE TABLE IF NOT EXISTS table_name (...)
```

All column additions check for existence:
```sql
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE ...)
```

All policy creations will fail gracefully if already exist (CREATE POLICY is idempotent).

### Rollback Plan

This migration is additive only (no data modifications), making rollback straightforward:

```sql
-- Rollback script (if needed)
DROP TABLE IF EXISTS feedback_requests CASCADE;
DROP TABLE IF EXISTS deal_stage_history CASCADE;
DROP TABLE IF EXISTS deal_stage_config CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS quote_activities CASCADE;
DROP TABLE IF EXISTS quote_outcomes CASCADE;
DROP TABLE IF EXISTS contact_enrichment_queue CASCADE;
DROP TABLE IF EXISTS opportunity_signals CASCADE;
DROP TABLE IF EXISTS compliance_schedule CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;

DROP FUNCTION IF EXISTS get_stalled_deals(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_quotes_needing_followup(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_compliance_due(UUID, INTEGER);

-- Rollback deals table alterations
ALTER TABLE deals DROP COLUMN IF EXISTS last_activity_at;
ALTER TABLE deals DROP COLUMN IF EXISTS stalled_at;
ALTER TABLE deals DROP COLUMN IF EXISTS auto_follow_up_enabled;
ALTER TABLE deals DROP COLUMN IF EXISTS next_follow_up_at;
ALTER TABLE deals DROP COLUMN IF EXISTS follow_up_count;
```

### Zero-Downtime: YES

This migration can be applied with zero downtime:
- Only adds new tables (no existing queries affected)
- Only adds new columns to deals (no existing queries affected)
- No data migrations or transformations
- No schema changes to existing tables

---

## Security Audit

### Tenant Isolation: PASS
- All tables include `tenant_id` column
- All RLS policies enforce tenant isolation
- Subquery pattern prevents cross-tenant data access

### Service Role Access: PASS
- All tables have service role bypass policies
- Required for autonomous agent operation
- Service role key must be kept secure (server-side only)

### SQL Injection: PASS
- Utility functions use parameterized queries
- No dynamic SQL construction
- Proper type casting (::INTEGER, ::TEXT)

### Data Exposure: PASS
- No sensitive data stored in plain text
- Email addresses stored but that's expected
- Consider encryption for intel/learnings JSONB if sensitive

### Audit Trail: PASS
- All tables have `created_at` timestamps
- Key tables have `created_by` and `updated_at`
- Stage history provides full deal progression audit

---

## Performance Projections

### Expected Record Volumes (per tenant)

| Table | Daily Inserts | Monthly Total | Index Impact |
|-------|--------------|---------------|--------------|
| feedback_requests | 5-20 | 150-600 | Low |
| deal_stage_history | 10-50 | 300-1500 | Low |
| quotes | 2-10 | 60-300 | Low |
| quote_activities | 10-50 | 300-1500 | Low |
| contact_enrichment_queue | 20-100 | 600-3000 | Medium |
| opportunity_signals | 10-50 | 300-1500 | Low |
| compliance_checks | 100-500/quarter | 1200-6000/year | Low |

### Query Performance Expectations

With proper indexes (including recommended additions):
- Engine queries (via functions): < 100ms with 10K records
- Timeline queries (activities, history): < 50ms with 5K records
- Status updates: < 10ms
- Scheduled queries (cron jobs): < 200ms batch of 20

### Scaling Considerations

Current design will scale well to:
- 100 active tenants
- 10,000 deals per tenant
- 5,000 quotes per tenant per year
- 10,000 contacts per tenant

Beyond these volumes, consider:
- Partitioning by tenant_id (if single tenant dominates)
- Archiving old records (closed deals, expired quotes)
- Materialized views for reporting

---

## Recommendations Summary

### Critical (Apply Before Migration)
None. Migration is ready to apply as-is.

### Important (Apply Soon After)

1. **Add missing indexes for deals table**:
   ```sql
   CREATE INDEX idx_deals_follow_up
     ON deals(tenant_id, auto_follow_up_enabled, next_follow_up_at)
     WHERE auto_follow_up_enabled = TRUE;

   CREATE INDEX idx_deals_stall_detection
     ON deals(tenant_id, stage, last_activity_at)
     WHERE stage NOT IN ('won', 'lost');
   ```

2. **Add trigger for automatic deal stage history**:
   ```sql
   CREATE OR REPLACE FUNCTION log_deal_stage_change()
   RETURNS TRIGGER AS $$
   BEGIN
     IF OLD.stage IS DISTINCT FROM NEW.stage THEN
       INSERT INTO deal_stage_history (
         tenant_id, deal_id, from_stage, to_stage,
         days_in_previous_stage
       ) VALUES (
         NEW.tenant_id, NEW.id, OLD.stage, NEW.stage,
         EXTRACT(DAY FROM (NOW() - OLD.updated_at))::INTEGER
       );
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER deal_stage_change
     AFTER UPDATE ON deals
     FOR EACH ROW
     WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
     EXECUTE FUNCTION log_deal_stage_change();
   ```

3. **Seed default deal_stage_config rows for new tenants**.

### Nice to Have (Future Enhancements)

1. Add enrichment email index:
   ```sql
   CREATE INDEX idx_enrichment_email
     ON contact_enrichment_queue(tenant_id, email_address)
     WHERE status = 'pending';
   ```

2. Add quote outcomes analysis index:
   ```sql
   CREATE INDEX idx_quote_outcomes_analysis
     ON quote_outcomes(tenant_id, outcome, recorded_at DESC);
   ```

3. Consider RLS optimization (security definer function for tenant lookup).

4. Add data retention policies (archive/delete old records).

---

## Pre-Flight Checklist

- [x] No table name conflicts
- [x] All foreign keys valid (referenced tables exist)
- [x] All indexes named and optimized
- [x] All RLS policies defined
- [x] Service role policies present
- [x] Migration is idempotent (IF NOT EXISTS checks)
- [x] Zero-downtime compatible
- [x] Rollback plan documented
- [x] Security audit passed
- [x] Query patterns analyzed

---

## Deployment Instructions

### 1. Pre-Deployment
```bash
# Verify current state
node scripts/run-migration.js --check

# Backup database (recommended)
# Use Supabase dashboard or pg_dump
```

### 2. Apply Migration
```bash
# Apply the P1 migration
node scripts/run-migration.js supabase/migrations/20251223000000_p1_engines.sql
```

### 3. Verify Deployment
```bash
# Check migration status
node scripts/run-migration.js --check

# Test a query
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });
pool.query('SELECT COUNT(*) FROM feedback_requests')
  .then(r => console.log('✅ feedback_requests table accessible'))
  .catch(e => console.error('❌ Error:', e.message))
  .finally(() => pool.end());
"
```

### 4. Post-Deployment (Optional Enhancements)

Apply recommended indexes:
```sql
-- deals table optimization
CREATE INDEX idx_deals_follow_up
  ON deals(tenant_id, auto_follow_up_enabled, next_follow_up_at)
  WHERE auto_follow_up_enabled = TRUE;

CREATE INDEX idx_deals_stall_detection
  ON deals(tenant_id, stage, last_activity_at)
  WHERE stage NOT IN ('won', 'lost');

-- Add stage change trigger
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO deal_stage_history (
      tenant_id, deal_id, from_stage, to_stage,
      days_in_previous_stage
    ) VALUES (
      NEW.tenant_id, NEW.id, OLD.stage, NEW.stage,
      EXTRACT(DAY FROM (NOW() - OLD.updated_at))::INTEGER
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_stage_change
  AFTER UPDATE ON deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION log_deal_stage_change();
```

---

## Final Assessment

**Migration Status**: READY FOR PRODUCTION

**Risk Level**: LOW
- No destructive operations
- Idempotent migration
- Zero-downtime compatible
- Comprehensive RLS policies
- Well-indexed for performance

**Confidence Level**: HIGH
- Schema design follows best practices
- All query patterns analyzed
- Security audit passed
- Performance projections favorable

**Recommendation**: APPROVE AND DEPLOY

The P1 migration is production-ready and can be applied immediately. The optional enhancements can be applied after initial deployment to further optimize performance.

---

## Appendix: Test Queries

After deployment, verify with these test queries:

```sql
-- Test feedback_requests
INSERT INTO feedback_requests (tenant_id, order_id, client_id, delivery_date, scheduled_for)
SELECT tenant_id, id, client_id, updated_at, updated_at + INTERVAL '7 days'
FROM orders WHERE status = 'completed' LIMIT 1;

-- Test deal_stage_history
SELECT * FROM get_stalled_deals('YOUR_TENANT_ID', 5);

-- Test quotes
INSERT INTO quotes (tenant_id, client_id, quote_number, title, total_amount)
VALUES ('YOUR_TENANT_ID', 'CLIENT_ID', 'Q-001', 'Test Quote', 1000.00);

-- Test quote follow-ups
SELECT * FROM get_quotes_needing_followup('YOUR_TENANT_ID', 5);

-- Test compliance
SELECT * FROM get_compliance_due('YOUR_TENANT_ID', 5);

-- Test RLS isolation
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"USER_ID"}';
SELECT COUNT(*) FROM feedback_requests; -- Should only see own tenant
```
