# P1 Database Migration - Deployment Checklist

**Migration**: P1 Engines (Phase 1 Automation)
**Date**: 2025-12-22
**Approved**: YES
**Risk**: LOW

---

## Pre-Deployment Checklist

### Environment Verification
- [ ] Database credentials confirmed in `.env.local`
- [ ] Connected to correct environment (check with `--check`)
- [ ] Backup taken (recommended but not required for additive migration)
- [ ] Team notified of deployment window

### Migration Files Ready
- [ ] Base migration exists: `supabase/migrations/20251223000000_p1_engines.sql`
- [ ] Enhancements exist: `supabase/migrations/20251223000001_p1_enhancements.sql`
- [ ] Validation script exists: `scripts/validate-p1-migration.js`
- [ ] Check script exists: `scripts/check-p1-schema.js`

### Validation Complete
- [ ] Syntax validation passed: `node scripts/validate-p1-migration.js`
- [ ] Schema review completed: Read `P1_MIGRATION_REVIEW.md`
- [ ] Security audit passed: RLS policies reviewed
- [ ] Performance analysis done: Indexes reviewed

### Documentation Reviewed
- [ ] Read executive summary: `P1_EXECUTIVE_SUMMARY.md`
- [ ] Read deployment guide: `P1_DEPLOYMENT_SUMMARY.md`
- [ ] Understand rollback procedure
- [ ] Know what each engine does

---

## Deployment Steps

### Step 1: Pre-Deployment Check
```bash
# Verify current state
node scripts/run-migration.js --check
```

**Expected Output**:
- Connection successful
- Migration history displayed
- No P1 tables exist yet

**Status**: [ ] COMPLETE

---

### Step 2: Validate Migration
```bash
# Validate SQL syntax
node scripts/validate-p1-migration.js
```

**Expected Output**:
```
✅ VALIDATION SUCCESSFUL
Both migration files have valid SQL syntax.
Ready for deployment.
```

**Status**: [ ] COMPLETE

---

### Step 3: Apply Base Migration
```bash
# Deploy 10 tables, 3 functions, 5 columns
node scripts/run-migration.js supabase/migrations/20251223000000_p1_engines.sql
```

**Expected Duration**: 5-10 seconds

**Expected Output**:
```
⚙️  Running: 20251223000000_p1_engines.sql
✅ Migration completed successfully
📝 Logged to migration history
```

**Status**: [ ] COMPLETE

**Verification**:
```bash
# Verify tables created
node scripts/check-p1-schema.js
```

**Expected**: All 10 P1 tables should exist

**Status**: [ ] VERIFIED

---

### Step 4: Apply Enhancements (Recommended)
```bash
# Deploy indexes, triggers, views
node scripts/run-migration.js supabase/migrations/20251223000001_p1_enhancements.sql
```

**Expected Duration**: 3-5 seconds

**Expected Output**:
```
⚙️  Running: 20251223000001_p1_enhancements.sql
✅ Migration completed successfully
📝 Logged to migration history
```

**Status**: [ ] COMPLETE

---

### Step 5: Post-Deployment Verification
```bash
# Check final state
node scripts/run-migration.js --check
```

**Expected Output**:
- Both migrations marked as applied
- Total migrations increased by 2

**Status**: [ ] COMPLETE

---

## Verification Tests

### Test 1: Table Accessibility
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const tables = [
    'feedback_requests', 'deal_stage_history', 'deal_stage_config',
    'quotes', 'quote_activities', 'quote_outcomes',
    'contact_enrichment_queue', 'opportunity_signals',
    'compliance_schedule', 'compliance_checks'
  ];

  for (const table of tables) {
    const result = await pool.query(\`SELECT COUNT(*) FROM \${table}\`);
    console.log(\`✅ \${table}: accessible (count: \${result.rows[0].count})\`);
  }
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: All 10 tables accessible, count = 0

**Status**: [ ] PASSED

---

### Test 2: Deals Columns Added
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const result = await pool.query(\`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'deals'
    AND column_name IN (
      'last_activity_at', 'stalled_at', 'auto_follow_up_enabled',
      'next_follow_up_at', 'follow_up_count'
    )
    ORDER BY column_name
  \`);
  console.log('New deals columns:', result.rows.map(r => r.column_name));
  console.log(\`✅ Found \${result.rows.length}/5 expected columns\`);
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: All 5 columns present

**Status**: [ ] PASSED

---

### Test 3: Utility Functions
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const functions = [
    'get_stalled_deals',
    'get_quotes_needing_followup',
    'get_compliance_due'
  ];

  const result = await pool.query(\`
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = ANY(\$1)
  \`, [functions]);

  console.log('Functions found:', result.rows.map(r => r.routine_name));
  console.log(\`✅ Found \${result.rows.length}/3 expected functions\`);
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: All 3 functions exist

**Status**: [ ] PASSED

---

### Test 4: RLS Policies Active
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const result = await pool.query(\`
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE tablename IN (
      'feedback_requests', 'deal_stage_history', 'deal_stage_config',
      'quotes', 'quote_activities', 'quote_outcomes',
      'contact_enrichment_queue', 'opportunity_signals',
      'compliance_schedule', 'compliance_checks'
    )
    GROUP BY tablename
    ORDER BY tablename
  \`);

  console.log('RLS policies per table:');
  result.rows.forEach(row => {
    console.log(\`  \${row.tablename}: \${row.policy_count} policies\`);
  });
  console.log(\`✅ All tables have RLS policies\`);
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: Each table has 2 policies (tenant_isolation + service_role_all)

**Status**: [ ] PASSED

---

### Test 5: Indexes Created
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const result = await pool.query(\`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexname ~ '(feedback|deal|quote|enrichment|signal|compliance)'
    ORDER BY indexname
  \`);

  console.log('P1 Indexes created:');
  result.rows.forEach(row => console.log(\`  ✅ \${row.indexname}\`));
  console.log(\`\nTotal P1 indexes: \${result.rows.length}\`);
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: At least 12 indexes (16 if enhancements applied)

**Status**: [ ] PASSED

---

### Test 6: Triggers Active (If Enhancements Applied)
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const result = await pool.query(\`
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_name IN ('deal_stage_change', 'deal_activity_update')
    ORDER BY trigger_name
  \`);

  if (result.rows.length > 0) {
    console.log('Triggers found:');
    result.rows.forEach(row => {
      console.log(\`  ✅ \${row.trigger_name} on \${row.event_object_table}\`);
    });
  } else {
    console.log('No triggers found (enhancements not applied)');
  }
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: 2 triggers if enhancements applied, 0 if not

**Status**: [ ] PASSED

---

### Test 7: Sample Data Insert
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  // Get a tenant ID
  const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
  if (tenantResult.rows.length === 0) {
    console.log('⚠️  No tenants found - create a tenant first');
    await pool.end();
    return;
  }
  const tenantId = tenantResult.rows[0].id;

  // Try to insert and delete a test record
  await pool.query('BEGIN');
  try {
    const result = await pool.query(\`
      INSERT INTO deal_stage_config (tenant_id, stage, max_days_before_stale)
      VALUES ($1, 'test_stage', 7)
      RETURNING id
    \`, [tenantId]);

    console.log('✅ Test insert successful (ID:', result.rows[0].id, ')');

    // Clean up
    await pool.query('DELETE FROM deal_stage_config WHERE stage = \\'test_stage\\'');
    console.log('✅ Test cleanup successful');

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Test failed:', error.message);
  }
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: Insert and delete successful

**Status**: [ ] PASSED

---

### Test 8: Function Execution
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL });

async function test() {
  const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
  if (tenantResult.rows.length === 0) {
    console.log('⚠️  No tenants found - create a tenant first');
    await pool.end();
    return;
  }
  const tenantId = tenantResult.rows[0].id;

  // Test each function
  console.log('Testing utility functions...\n');

  const stalledDeals = await pool.query(
    'SELECT * FROM get_stalled_deals(\$1, 5)',
    [tenantId]
  );
  console.log('✅ get_stalled_deals:', stalledDeals.rows.length, 'results');

  const quotesFollowup = await pool.query(
    'SELECT * FROM get_quotes_needing_followup(\$1, 5)',
    [tenantId]
  );
  console.log('✅ get_quotes_needing_followup:', quotesFollowup.rows.length, 'results');

  const complianceDue = await pool.query(
    'SELECT * FROM get_compliance_due(\$1, 5)',
    [tenantId]
  );
  console.log('✅ get_compliance_due:', complianceDue.rows.length, 'results');

  console.log('\n✅ All functions executable');
  await pool.end();
}
test().catch(console.error);
"
```

**Expected**: All functions execute without errors

**Status**: [ ] PASSED

---

## Post-Deployment Checklist

### Immediate Actions
- [ ] All verification tests passed
- [ ] Team notified of successful deployment
- [ ] Documentation links shared with team
- [ ] Migration logged in project history

### Short-Term (This Week)
- [ ] Create API routes for engines
- [ ] Setup cron jobs for automation
- [ ] Create test data in dev environment
- [ ] Train team on new capabilities

### Medium-Term (This Month)
- [ ] Build dashboards for analytics views
- [ ] Configure per-tenant thresholds
- [ ] Setup compliance schedules
- [ ] Monitor query performance

---

## Rollback Checklist (If Needed)

**Only use if critical issues occur**

### Rollback Steps
1. [ ] Stop any running cron jobs
2. [ ] Run rollback script:
```sql
BEGIN;

-- Drop tables
DROP TABLE IF EXISTS
  feedback_requests, deal_stage_history, deal_stage_config,
  quotes, quote_activities, quote_outcomes,
  contact_enrichment_queue, opportunity_signals,
  compliance_schedule, compliance_checks
CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_stalled_deals(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_quotes_needing_followup(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_compliance_due(UUID, INTEGER);

-- Drop enhancements (if applied)
DROP TRIGGER IF EXISTS deal_stage_change ON deals;
DROP TRIGGER IF EXISTS deal_activity_update ON deals;
DROP FUNCTION IF EXISTS log_deal_stage_change();
DROP FUNCTION IF EXISTS update_deal_last_activity();
DROP VIEW IF EXISTS deal_stage_velocity;
DROP VIEW IF EXISTS quote_win_rates;
DROP VIEW IF EXISTS signal_action_rates;
DROP VIEW IF EXISTS compliance_completion_rates;

-- Remove deals columns
ALTER TABLE deals
  DROP COLUMN IF EXISTS last_activity_at,
  DROP COLUMN IF EXISTS stalled_at,
  DROP COLUMN IF EXISTS auto_follow_up_enabled,
  DROP COLUMN IF EXISTS next_follow_up_at,
  DROP COLUMN IF EXISTS follow_up_count;

-- Remove from migration history
DELETE FROM migration_history WHERE migration_name IN (
  '20251223000000_p1_engines.sql',
  '20251223000001_p1_enhancements.sql'
);

COMMIT;
```
3. [ ] Verify rollback successful
4. [ ] Document reason for rollback
5. [ ] Create issue for investigation

---

## Sign-Off

### Deployment Complete
- [ ] All migration steps completed
- [ ] All verification tests passed
- [ ] No errors in logs
- [ ] System operating normally

**Deployed By**: ___________________
**Date**: ___________________
**Time**: ___________________

### Verification Complete
- [ ] Functionality verified
- [ ] Performance acceptable
- [ ] No security issues
- [ ] Documentation updated

**Verified By**: ___________________
**Date**: ___________________

---

## Support

**If Issues Occur**:
1. Check error logs
2. Review verification test results
3. Consult `P1_MIGRATION_REVIEW.md` for technical details
4. Run rollback if critical

**Documentation**:
- Technical Review: `P1_MIGRATION_REVIEW.md`
- Deployment Guide: `P1_DEPLOYMENT_SUMMARY.md`
- Executive Summary: `P1_EXECUTIVE_SUMMARY.md`
- This Checklist: `P1_DEPLOYMENT_CHECKLIST.md`

**Database Access**:
- Session Pooler: `DATABASE_URL` (recommended)
- Direct Connection: `DIRECT_DATABASE_URL`

---

**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] COMPLETE | [ ] ROLLED BACK

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
