# Tenant ID Migration - Executive Summary

**Date:** 2025-12-01
**Status:** 38% Complete (34/88 tables)
**Priority:** HIGH - Active Development Required

---

## What Is This Migration?

The database is transitioning from **single-user organizations** (`org_id = user ID`) to **multi-user tenant organizations** (`tenant_id = organization ID`). This enables:

- **Team collaboration** within the same organization
- **True multi-tenancy** for SaaS features
- **Better data isolation** and security
- **Scalability** for enterprise clients

---

## Current Status

### ✅ Completed (34 tables)
- Core business tables: clients, orders, properties, contacts
- Production system: kanban, templates, tasks (11 tables)
- Agent system: runs, memories, settings (5 tables)
- Jobs system: jobs, tasks (2 tables)
- CRM: activities, deals, contact companies (3 tables)
- Finance: invoices, products (3 tables)
- Other: campaigns, goals, oauth_tokens, field service requests (7 tables)

### 🔴 High Priority - Need Migration (16 tables)
- **Marketing Module** (11 tables): All marketing_*, email_*, newsletter_* tables
- **Gmail Integration** (2 tables): gmail_messages, gmail_sync_state
- **Chat System** (2 tables): chat_messages, embeddings_index
- **Campaign System** (1 table): campaign_responses

### 🟡 Medium Priority (12 tables)
- Business tables: property_units, party_roles, email_notifications, validation_logs
- Field services core: bookings, resources, territories, notifications, etc.

### 🟢 Low Priority (~26 tables)
- Analytics & logging tables
- Field services extended features

---

## Why This Matters

### Current Problem (org_id = user ID)
```
User A (org_id: user-123) owns Client X
User B (org_id: user-456) CANNOT see Client X
Even if User A and User B work for the same company!
```

### After Migration (tenant_id = organization ID)
```
User A (tenant_id: company-abc) owns Client X
User B (tenant_id: company-abc) CAN see Client X
Both users collaborate within the same organization!
```

---

## What Was Already Done

### November 2025 Migrations (20251129*)
1. **Bootstrap Tenants** - Created tenant records for all users
   - Internal users (@myroihome.com) → "ROI Appraisal Group" tenant
   - External users → Individual tenants (one per user initially)

2. **Add tenant_id Columns** - Added tenant_id to 30+ tables
   - Kanban & Production System (11 tables)
   - Jobs System (2 tables)
   - Agent System (5 tables)
   - Marketing & Campaigns (2 tables)
   - Invoicing & Products (3 tables)
   - Other business tables (7+ tables)

3. **Backfill Data** - Populated tenant_id from user's profile
   - All records assigned to correct tenant
   - Data integrity verified

4. **Update RLS Policies** - Changed from org_id to tenant_id
   - Core tables (clients, orders, properties, contacts)
   - Production & kanban tables
   - Agent system tables
   - Marketing & finance tables

5. **Cleanup Legacy Policies** - Removed old org_id-based policies

### December 2025 Migrations (20251201*)
1. **Add tenant_id to deals** - Deal tracking now tenant-isolated
2. **Fix contacts tenant_id** - Contacts table properly isolated
3. **Add tenant_id to activities** - Activity logging tenant-isolated

---

## What Still Needs to Be Done

### Phase 1: High Priority (3-4 weeks)
**16 tables - Critical user-facing features**

1. **Marketing Module** (Week 1)
   - 11 tables: marketing campaigns, content, audiences, newsletters, email templates
   - **Impact:** Marketing features won't work correctly for teams
   - **Risk:** Data leakage between organizations

2. **Gmail Integration** (Week 1)
   - 2 tables: gmail_messages, gmail_sync_state
   - **Impact:** Email sync may show wrong data
   - **Risk:** Users see emails from other organizations

3. **Chat System** (Week 2)
   - 2 tables: chat_messages, embeddings_index
   - **Impact:** Chat features broken for multi-user tenants
   - **Risk:** Users see chat from other organizations

4. **Campaign Responses** (Week 2)
   - 1 table: campaign_responses
   - **Impact:** Campaign tracking incomplete
   - **Risk:** Data integrity issues

### Phase 2: Medium Priority (2-4 weeks)
**12 tables - Important but not critical**
- Business tables: property_units, party_roles
- Field services: bookings, resources, territories
- Integrations: webhooks, api_keys

### Phase 3: Low Priority (2-3 weeks)
**~26 tables - Analytics and extended features**
- Analytics & logging tables
- Field services extended features
- Can be migrated gradually

---

## Migration Process (For Each Table Group)

1. **Add Column**
   ```sql
   ALTER TABLE [table] ADD COLUMN tenant_id UUID REFERENCES tenants(id);
   ```

2. **Backfill Data**
   ```sql
   UPDATE [table] t SET tenant_id = p.tenant_id
   FROM profiles p WHERE t.org_id = p.id;
   ```

3. **Make NOT NULL**
   ```sql
   ALTER TABLE [table] ALTER COLUMN tenant_id SET NOT NULL;
   ```

4. **Add Index**
   ```sql
   CREATE INDEX idx_[table]_tenant_id ON [table](tenant_id);
   ```

5. **Update RLS Policies**
   ```sql
   CREATE POLICY [table]_tenant_isolation ON [table]
   FOR ALL USING (
     tenant_id IN (
       SELECT tenant_id FROM profiles WHERE id = auth.uid()
     )
   );
   ```

6. **Verify**
   - Check for NULL values
   - Test user access
   - Verify data isolation

---

## Timeline

| Phase | Duration | Tables | Start | End |
|-------|----------|--------|-------|-----|
| Phase 1 (High Priority) | 3-4 weeks | 16 | Week 1 | Week 4 |
| Phase 2 (Medium Priority) | 2-4 weeks | 12 | Week 5 | Week 8 |
| Phase 3 (Low Priority) | 2-3 weeks | ~26 | Week 9 | Week 12 |
| **TOTAL** | **8-12 weeks** | **~54** | **Now** | **March 2026** |

### Milestones
- **Week 4:** 50% complete (high priority done)
- **Week 8:** 65% complete (medium priority done)
- **Week 12:** 100% complete (all tables migrated)

---

## Risks & Mitigation

### Risk 1: Data Loss
- **Mitigation:** Keep org_id column until 100% complete
- **Mitigation:** Full database backups before each phase

### Risk 2: RLS Policy Gaps
- **Mitigation:** Always create RLS policies in same transaction
- **Mitigation:** Test data isolation after each migration

### Risk 3: Performance Impact
- **Mitigation:** Proper indexing on tenant_id
- **Mitigation:** Monitor query performance
- **Mitigation:** Optimize RLS subqueries if needed

### Risk 4: Long-Running Migrations
- **Mitigation:** Batch updates for large tables
- **Mitigation:** Use CONCURRENTLY for index creation
- **Mitigation:** Schedule during low-traffic windows

---

## Success Criteria

### Per-Migration Success
- ✅ Zero NULL tenant_id values
- ✅ All RLS policies created
- ✅ Application tests pass
- ✅ No data leakage between tenants

### Phase Completion Success
- ✅ All tables in phase have tenant_id
- ✅ No legacy org_id-based policies
- ✅ Application code updated

### Overall Success (100% Complete)
- ✅ 88 business tables migrated
- ✅ Multi-tenant collaboration working
- ✅ org_id columns deprecated
- ✅ Performance benchmarks met

---

## Documents

### Detailed Documentation
- **📊 Full Audit Report:** `docs/operations/database-migrations/TENANT_ID_MIGRATION_AUDIT.md`
  - Complete table inventory
  - Detailed migration status
  - Verification queries
  - Risk analysis

- **📋 Quick Reference:** `docs/operations/database-migrations/TENANT_MIGRATION_QUICK_REFERENCE.md`
  - Visual progress bar
  - Table checklists
  - Quick commands

- **📅 Action Plan:** `docs/operations/database-migrations/TENANT_MIGRATION_ACTION_PLAN.md`
  - Week-by-week execution plan
  - Detailed migration steps
  - Rollback procedures
  - Success criteria

### Migration Files
- **Bootstrap:** `supabase/migrations/20251129000001_bootstrap_tenants.sql`
- **Add Columns:** `supabase/migrations/20251129000003_add_tenant_id_to_business_tables.sql`
- **Backfill Part 1:** `supabase/migrations/20251129000004_backfill_tenant_id_part1.sql`
- **Backfill Part 2:** `supabase/migrations/20251129000005_backfill_tenant_id_part2.sql`
- **Update RLS Core:** `supabase/migrations/20251129000007_update_rls_core_tables.sql`
- **Update RLS Agent:** `supabase/migrations/20251129000008_update_rls_agent_tables.sql`
- **Update RLS Marketing:** `supabase/migrations/20251129000009_update_rls_marketing_finance.sql`
- **Cleanup:** `supabase/migrations/20251129000010_cleanup_legacy_org_id_policies.sql`
- **Deals:** `supabase/migrations/20251201000000_add_tenant_id_to_deals.sql`
- **Contacts:** `supabase/migrations/20251201000001_add_tenant_id_to_contacts.sql`

---

## Quick Commands

### Check Migration Status
```bash
node scripts/run-migration.js --check
```

### Apply Migration
```bash
node scripts/run-migration.js supabase/migrations/[filename].sql
```

### Verify Tables
```sql
-- Check tenant_id coverage
SELECT COUNT(DISTINCT table_name)
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'tenant_id';

-- Find tables with org_id but no tenant_id
SELECT DISTINCT c1.table_name
FROM information_schema.columns c1
WHERE c1.table_schema = 'public'
  AND c1.column_name = 'org_id'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c2
    WHERE c2.table_name = c1.table_name AND c2.column_name = 'tenant_id'
  );
```

---

## Next Steps

### Immediate (This Week)
1. ✅ Review audit report with team
2. ✅ Approve action plan
3. ⬜ Create marketing module migration
4. ⬜ Test on dev database
5. ⬜ Deploy to production

### Short Term (Next 2 Weeks)
1. ⬜ Complete Phase 1 (high priority tables)
2. ⬜ Verify multi-user tenant functionality
3. ⬜ Update application code if needed

### Medium Term (Next Month)
1. ⬜ Complete Phase 2 (medium priority tables)
2. ⬜ Monitor performance metrics
3. ⬜ Begin Phase 3 (low priority tables)

### Long Term (2-3 Months)
1. ⬜ Complete Phase 3
2. ⬜ Deprecate org_id columns
3. ⬜ Performance optimization
4. ⬜ Final documentation update

---

## Questions?

**For technical details:** See [TENANT_ID_MIGRATION_AUDIT.md](docs/operations/database-migrations/TENANT_ID_MIGRATION_AUDIT.md)

**For execution plan:** See [TENANT_MIGRATION_ACTION_PLAN.md](docs/operations/database-migrations/TENANT_MIGRATION_ACTION_PLAN.md)

**For quick reference:** See [TENANT_MIGRATION_QUICK_REFERENCE.md](docs/operations/database-migrations/TENANT_MIGRATION_QUICK_REFERENCE.md)

---

**Last Updated:** 2025-12-01
**Next Review:** After Phase 1 completion
