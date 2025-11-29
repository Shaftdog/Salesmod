# Multi-Tenant Migration Deployment Guide

**Migration Complete**: 2025-11-29
**Overall Progress**: 85% (Core migration complete, optional cleanup pending)
**Status**: ✅ Ready for Deployment

---

## Executive Summary

The Salesmod application has been successfully migrated from a single-user-per-org architecture to a true multi-tenant system. All critical security vulnerabilities have been fixed, and complete tenant isolation is enforced at the database level via Row Level Security (RLS).

### What Changed
- **Before**: Each user had their own "org" (org_id = user.id), data isolated per-user
- **After**: Users belong to shared tenants, data isolated per-tenant
- **Impact**: ROI Appraisal Group internal team can now collaborate on shared data
- **Security**: 5 P0 vulnerabilities fixed, complete RLS-based isolation

### Migration Stats
- **Tables Migrated**: 32+
- **RLS Policies Updated**: 30+
- **Migrations Created**: 10
- **Critical Fixes**: 5/5
- **Files Modified**: 8
- **Service-Role Usages Hardened**: 4

---

## Pre-Deployment Checklist

### 1. Review Migration Files
All migrations are in `supabase/migrations/`:

```bash
# Tenant setup
20251129000001_bootstrap_tenants.sql

# Security fixes
20251129000002_add_rls_to_activities_and_contact_companies.sql

# Tenant migration (8 files)
20251129000003_add_tenant_id_to_business_tables.sql
20251129000004_backfill_tenant_id_part1.sql
20251129000005_backfill_tenant_id_part2.sql
20251129000006_enforce_tenant_id_not_null.sql
20251129000007_update_rls_core_tables.sql
20251129000008_update_rls_agent_tables.sql
20251129000009_update_rls_marketing_finance.sql
20251129000010_cleanup_legacy_org_id_policies.sql
```

### 2. Database Backup ⚠️ CRITICAL
```bash
# Create full database backup before deployment
pg_dump $DATABASE_URL > backup_before_tenant_migration_$(date +%Y%m%d).sql

# Or use Supabase CLI
npx supabase db dump -f backup_before_migration.sql
```

### 3. Review Documentation
- [ ] Read `docs/ARCHITECTURE-tenancy.md` - Multi-tenant architecture
- [ ] Read `docs/SERVICE-ROLE-AUDIT.md` - Service-role usage patterns
- [ ] Read `docs/access-control-audit.md` - Security audit results
- [ ] Read `MIGRATION-PROGRESS.md` - Detailed migration log

---

## Deployment Steps

### Option A: Incremental Deployment (Recommended)

Deploy migrations one phase at a time, with verification between each:

#### Step 1: Deploy Phase 0 (Tenant Bootstrap)
```bash
# Apply tenant bootstrap migration
npx supabase db push --include 20251129000001_bootstrap_tenants.sql
```

**Verification**:
```sql
-- Check all users have tenants
SELECT COUNT(*) FROM profiles WHERE tenant_id IS NULL;
-- Expected: 0

-- View tenant summary
SELECT * FROM tenant_bootstrap_summary;
-- Expected: ROI Appraisal Group + individual external tenants
```

#### Step 2: Deploy Phase 1 (Security Fixes)
```bash
# Apply activities/contact_companies RLS
npx supabase db push --include 20251129000002_add_rls_to_activities_and_contact_companies.sql
```

**Verification**:
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('activities', 'contact_companies');
-- Expected: Both true

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('activities', 'contact_companies');
-- Expected: 2 policies
```

**Note**: Code fixes (chat-simple, migrations, borrower-invite) are already deployed in Phase 1

#### Step 3: Deploy Phase 3 (Tenant Migration - 8 Migrations)
```bash
# Apply all Phase 3 migrations in order
npx supabase db push --include 20251129000003_add_tenant_id_to_business_tables.sql
npx supabase db push --include 20251129000004_backfill_tenant_id_part1.sql
npx supabase db push --include 20251129000005_backfill_tenant_id_part2.sql
npx supabase db push --include 20251129000006_enforce_tenant_id_not_null.sql
npx supabase db push --include 20251129000007_update_rls_core_tables.sql
npx supabase db push --include 20251129000008_update_rls_agent_tables.sql
npx supabase db push --include 20251129000009_update_rls_marketing_finance.sql
npx supabase db push --include 20251129000010_cleanup_legacy_org_id_policies.sql
```

**Verification After Each**:
```sql
-- After 000003: Check columns added
SELECT table_name FROM information_schema.columns
WHERE column_name = 'tenant_id' AND table_schema = 'public'
ORDER BY table_name;
-- Expected: 32+ tables

-- After 000004/000005: Check backfill
SELECT COUNT(*) FROM kanban_cards WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM jobs WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM campaigns WHERE tenant_id IS NULL;
-- Expected: All 0

-- After 000006: Check NOT NULL constraint
SELECT table_name, is_nullable FROM information_schema.columns
WHERE column_name = 'tenant_id' AND is_nullable = 'YES'
  AND table_schema = 'public';
-- Expected: Only 'tenants' and 'profiles' (nullable for meta tables)

-- After 000007-000009: Check RLS policies
SELECT COUNT(*) FROM pg_policies
WHERE policyname LIKE '%tenant_isolation%';
-- Expected: 30+

-- After 000010: Check legacy policies removed
SELECT * FROM pg_policies
WHERE qual::text LIKE '%org_id = auth.uid()%'
  OR with_check::text LIKE '%org_id = auth.uid()%';
-- Expected: No results
```

#### Step 4: Deploy Code Changes
```bash
# Deploy updated API routes and agent system
git push origin main  # Deploys to Vercel/production

# Or manually verify files changed:
# - src/app/api/agent/chat-simple/route.ts
# - src/app/api/migrations/run/route.ts
# - src/app/api/migrations/dry-run/route.ts
# - src/app/api/borrower/invite/route.ts
# - src/app/api/email/webhook/route.ts
# - src/app/api/admin/properties/backfill/route.ts
# - src/lib/agent/orchestrator.ts
```

---

### Option B: All-at-Once Deployment

```bash
# Apply all migrations in sequence
npx supabase db push

# This will apply all 10 migrations in order
# Recommended for staging/testing environments only
```

---

## Post-Deployment Verification

### Critical Checks (5 minutes)

Run these SQL queries immediately after deployment:

```sql
-- 1. ✅ All users have tenants
SELECT id, email, tenant_id FROM profiles WHERE tenant_id IS NULL;
-- Expected: Empty

-- 2. ✅ All business data has tenant_id
SELECT 'clients' as tbl, COUNT(*) as nulls FROM clients WHERE tenant_id IS NULL
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE tenant_id IS NULL
UNION ALL
SELECT 'properties', COUNT(*) FROM properties WHERE tenant_id IS NULL
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts WHERE tenant_id IS NULL
UNION ALL
SELECT 'activities', COUNT(*) FROM activities WHERE tenant_id IS NULL
UNION ALL
SELECT 'kanban_cards', COUNT(*) FROM kanban_cards WHERE tenant_id IS NULL
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs WHERE tenant_id IS NULL;
-- Expected: All 0

-- 3. ✅ All tables have RLS enabled
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name FROM information_schema.columns
    WHERE column_name = 'tenant_id' AND table_schema = 'public'
  )
  AND rowsecurity = false;
-- Expected: Empty

-- 4. ✅ Tenant-based policies exist
SELECT COUNT(*) FROM pg_policies
WHERE policyname LIKE '%tenant_isolation%';
-- Expected: 30+

-- 5. ✅ No legacy org_id policies
SELECT tablename, policyname FROM pg_policies
WHERE qual::text LIKE '%org_id = auth.uid()%';
-- Expected: Empty
```

### Functional Testing (15-30 minutes)

#### Test 1: Tenant Isolation
```bash
# 1. Log in as ROI internal user (rod@myroihome.com)
# 2. Create a test client: "Test Client A"
# 3. Log in as external user (different tenant)
# 4. Verify "Test Client A" is NOT visible
# 5. Create "Test Client B" as external user
# 6. Log back in as ROI user
# 7. Verify "Test Client B" is NOT visible

# Expected: Complete isolation between tenants
```

#### Test 2: Internal Team Collaboration
```bash
# 1. Log in as rod@myroihome.com (ROI internal)
# 2. Create client "Shared Client"
# 3. Log in as another @myroihome.com user
# 4. Verify "Shared Client" IS visible
# 5. Both users modify the client
# 6. Verify changes visible to both

# Expected: ROI internal team shares all data
```

#### Test 3: Borrower Access (Regression Test)
```bash
# 1. Create order as ROI user
# 2. Use "Invite Borrower" feature
# 3. Click magic link as borrower
# 4. Verify borrower sees ONLY their specific order
# 5. Verify borrower cannot see other ROI orders

# Expected: Borrower access still works, properly scoped
```

#### Test 4: CSV Import Security
```bash
# 1. Create CSV with contacts
# 2. Add fake "org_id" column with another tenant's ID
# 3. Import as Tenant A user
# 4. Check imported contacts in database
# 5. Verify all contacts have Tenant A's tenant_id (not spoofed value)

# Expected: org_id spoofing prevented
```

#### Test 5: Agent System
```bash
# 1. Create job as ROI user
# 2. Run agent work block
# 3. Check created kanban cards
# 4. Verify all cards have ROI tenant's tenant_id
# 5. Log in as external user
# 6. Verify no access to ROI's kanban cards

# Expected: Agent system respects tenant boundaries
```

---

## Rollback Plan

### If Issues Detected

**Option 1: Rollback Code Only (Low Risk)**
```bash
# If API issues, rollback code deployment
git revert <commit-hash>
git push origin main

# Database migrations stay (they're safe)
```

**Option 2: Rollback Specific Migration**
```bash
# Rollback instructions in each migration file (footer)
# Example:
UPDATE profiles SET tenant_id = NULL, tenant_type = NULL;
DELETE FROM tenants;

# See migration file footer for specific rollback SQL
```

**Option 3: Full Database Restore (Nuclear Option)**
```bash
# Restore from backup created pre-deployment
psql $DATABASE_URL < backup_before_tenant_migration_20251129.sql

# WARNING: This loses all data created after backup
```

---

## Monitoring Post-Deployment

### Week 1: Watch for Issues

**Error Monitoring**:
- Check application logs for tenant_id null errors
- Monitor Sentry/error tracking for RLS policy errors
- Watch for "User has no tenant assigned" messages

**Performance**:
- Check query performance on tenant_id-indexed tables
- Monitor RLS policy evaluation overhead (should be minimal)

**User Reports**:
- "Can't see my data" → Check user's tenant_id in profiles
- "See someone else's data" → **CRITICAL - investigate immediately**

### SQL Monitoring Queries

```sql
-- Users without tenants (should stay 0)
SELECT COUNT(*) FROM profiles WHERE tenant_id IS NULL;

-- Records without tenant_id (should stay 0)
SELECT
  (SELECT COUNT(*) FROM clients WHERE tenant_id IS NULL) as clients,
  (SELECT COUNT(*) FROM orders WHERE tenant_id IS NULL) as orders,
  (SELECT COUNT(*) FROM properties WHERE tenant_id IS NULL) as properties;

-- Active tenants
SELECT
  t.name,
  t.type,
  COUNT(DISTINCT p.id) as user_count,
  COUNT(DISTINCT c.id) as client_count,
  COUNT(DISTINCT o.id) as order_count
FROM tenants t
LEFT JOIN profiles p ON p.tenant_id = t.id
LEFT JOIN clients c ON c.tenant_id = t.id
LEFT JOIN orders o ON o.tenant_id = t.id
GROUP BY t.id, t.name, t.type
ORDER BY user_count DESC;
```

---

## Common Issues & Solutions

### Issue 1: User Can't See Their Data
**Symptom**: User logs in, sees empty dashboard

**Diagnosis**:
```sql
SELECT id, email, tenant_id FROM profiles WHERE email = 'user@example.com';
```

**Fix**: Assign user to tenant
```sql
UPDATE profiles
SET tenant_id = (SELECT id FROM tenants WHERE name = 'Appropriate Tenant')
WHERE email = 'user@example.com';
```

---

### Issue 2: Import Fails with NULL tenant_id
**Symptom**: CSV import returns error "tenant_id cannot be null"

**Diagnosis**:
```sql
SELECT id, email, tenant_id FROM profiles WHERE id = '<user-id>';
```

**Fix**: User needs tenant assignment (see Issue 1)

---

### Issue 3: Service-Role Query Returns No Data
**Symptom**: Agent system or webhook returns empty results

**Diagnosis**: Check if service-role query is filtered by tenant_id

**Fix**: Update query to include tenant_id filter (see `docs/SERVICE-ROLE-AUDIT.md`)

---

## Future Enhancements

After successful deployment, consider:

### Phase 5: Cleanup (Optional)
- Remove obsolete `fix-contacts-org-id` admin endpoint
- Update job-planner.ts to use tenant_id throughout
- Remove redundant frontend filters (RLS handles it)

### Phase 6: Testing (Recommended)
- Add E2E Playwright tests for tenant isolation
- Create unit tests for RLS policies
- Set up automated tenant boundary tests

### New Features
- **Tenant Switching**: Allow super_admin to view any tenant's data
- **Cross-Tenant Sharing**: Controlled data sharing between tenants
- **Tenant Analytics**: Usage metrics per tenant
- **Tenant Quotas**: Limit orders/users per tenant
- **Custom Branding**: Per-tenant themes and logos

---

## Support & Documentation

### Key Documents
- `docs/ARCHITECTURE-tenancy.md` - Multi-tenant architecture deep dive
- `docs/SERVICE-ROLE-AUDIT.md` - Service-role usage patterns
- `docs/access-control-audit.md` - Security audit & fixes
- `MIGRATION-PROGRESS.md` - Phase-by-phase progress log

### Getting Help
- Check migration logs in Supabase dashboard
- Review RLS policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
- Run verification queries from this guide
- Consult architecture docs for design decisions

---

## Deployment Sign-Off

**Pre-Deployment:**
- [ ] Database backup created
- [ ] All 10 migrations reviewed
- [ ] Rollback plan understood
- [ ] Verification queries prepared

**Post-Deployment:**
- [ ] All 5 critical checks passed
- [ ] Functional tests completed
- [ ] No errors in application logs
- [ ] Users can access their data
- [ ] Tenant isolation confirmed

**Approved By**: _________________
**Date**: _________________
**Notes**: _________________

---

**Migration completed by**: Claude Code
**Date**: 2025-11-29
**Status**: ✅ Ready for Production Deployment
