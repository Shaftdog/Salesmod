# Tenant ID Migration - Action Plan
**Created:** 2025-12-01
**Status:** Ready for Execution

---

## Phase 1: High Priority Tables (Week 1-3)

### Week 1: Marketing Module (11 tables)

**Migration File:** `20251201000002_add_tenant_id_to_marketing_tables.sql`

**Tables to Migrate:**
1. `marketing_campaigns` - Core marketing functionality
2. `marketing_content` - Content management
3. `marketing_audiences` - Audience segmentation
4. `marketing_newsletters` - Newsletter management
5. `newsletter_issues` - Newsletter editions
6. `email_templates` - Email templates
7. `email_campaigns` - Email campaign tracking
8. `email_sends` - Send history
9. `content_schedule` - Content scheduling
10. `lead_scores` - Lead scoring
11. `contact_preferences` - Contact preferences

**Backfill Strategy:**
- All tables use `org_id UUID` referencing `profiles(id)`
- Backfill: `UPDATE table SET tenant_id = (SELECT tenant_id FROM profiles WHERE id = org_id)`

**RLS Pattern:**
```sql
CREATE POLICY [table]_tenant_isolation
  ON public.[table]
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );
```

**Dependencies:**
- None (independent module)

**Risk Level:** LOW
- Well-defined schema
- Clear backfill path
- No circular dependencies

**Estimated Time:** 4-6 hours
- Migration creation: 2 hours
- Testing: 1 hour
- Deployment: 30 minutes
- Verification: 1 hour

---

### Week 1: Gmail Integration (2 tables)

**Migration File:** `20251201000003_add_tenant_id_to_gmail.sql`

**Tables to Migrate:**
1. `gmail_messages` - Email messages from Gmail
2. `gmail_sync_state` - Sync state tracking

**Backfill Strategy:**
- Both tables use `org_id UUID` referencing `profiles(id)`
- Backfill: `UPDATE table SET tenant_id = (SELECT tenant_id FROM profiles WHERE id = org_id)`

**Special Considerations:**
- `gmail_messages` may have large data volume
- Consider batch updates for backfill
- Add index before backfill: `CREATE INDEX CONCURRENTLY idx_gmail_messages_org_id ON gmail_messages(org_id);`

**Risk Level:** MEDIUM
- Large data volume may cause long-running transaction
- Critical for email functionality

**Estimated Time:** 3-4 hours
- Migration creation: 1 hour
- Testing: 1 hour
- Deployment: 1 hour (due to data volume)
- Verification: 30 minutes

---

### Week 2: Chat System (2 tables)

**Migration File:** `20251201000004_add_tenant_id_to_chat.sql`

**Tables to Migrate:**
1. `chat_messages` - User chat messages
2. `embeddings_index` - RAG embeddings

**Backfill Strategy:**
- Both tables use `org_id UUID` referencing `profiles(id)`
- Backfill: `UPDATE table SET tenant_id = (SELECT tenant_id FROM profiles WHERE id = org_id)`

**Special Considerations:**
- `embeddings_index` may have large data volume
- `chat_messages` is critical for user experience
- Consider partitioning strategy if tables are large

**Risk Level:** MEDIUM
- Critical user-facing feature
- Large data volume possible

**Estimated Time:** 3-4 hours
- Migration creation: 1 hour
- Testing: 1 hour
- Deployment: 1 hour
- Verification: 30 minutes

---

### Week 2: Campaign Responses (1 table)

**Migration File:** `20251201000005_add_tenant_id_to_campaign_responses.sql`

**Tables to Migrate:**
1. `campaign_responses` - Campaign response tracking

**Backfill Strategy:**
- Uses `org_id UUID` referencing `tenants(id)` (check this!)
- May need to backfill via parent campaign:
  ```sql
  UPDATE campaign_responses cr
  SET tenant_id = c.tenant_id
  FROM campaigns c
  WHERE cr.campaign_id = c.id
    AND cr.tenant_id IS NULL
    AND c.tenant_id IS NOT NULL;
  ```

**Special Considerations:**
- **URGENT:** This table is referenced by campaigns
- May have existing data with missing isolation
- Check if org_id references tenants or profiles

**Risk Level:** HIGH
- Data integrity risk if not migrated
- Critical for campaign functionality

**Estimated Time:** 2-3 hours
- Migration creation: 1 hour
- Testing: 1 hour
- Deployment: 30 minutes
- Verification: 30 minutes

---

## Phase 2: Medium Priority Tables (Week 3-6)

### Week 3: Business Tables (4 tables)

**Migration File:** `20251201000006_add_tenant_id_to_business_misc.sql`

**Tables to Migrate:**
1. `property_units` - Property unit details
2. `party_roles` - Order participant roles
3. `email_notifications` - Email notification log
4. `validation_logs` - Address validation logs

**Backfill Strategy:**
- `property_units`: Via parent property
  ```sql
  UPDATE property_units pu
  SET tenant_id = p.tenant_id
  FROM properties p
  WHERE pu.property_id = p.id;
  ```
- `party_roles`: Via parent order
  ```sql
  UPDATE party_roles pr
  SET tenant_id = o.tenant_id
  FROM orders o
  WHERE pr.order_id = o.id;
  ```
- `email_notifications`: From org_id → profiles.tenant_id
- `validation_logs`: From org_id → profiles.tenant_id

**Risk Level:** LOW
- Non-critical tables
- Clear parent relationships

**Estimated Time:** 3-4 hours

---

### Week 4-5: Field Services Core (6 tables)

**Migration File:** `20251201000007_add_tenant_id_to_field_services_core.sql`

**Tables to Migrate:**
1. `bookings` - Service bookings
2. `bookable_resources` - Resource management
3. `service_territories` - Territory definitions
4. `notifications` - User notifications
5. `customer_feedback` - Feedback tracking
6. `integrations` - Integration configs

**Backfill Strategy:**
- All use `org_id UUID` referencing `profiles(id)`
- Standard backfill from profiles.tenant_id

**Risk Level:** MEDIUM
- Field services module may have complex relationships
- Test thoroughly before production

**Estimated Time:** 6-8 hours

---

### Week 5-6: API & Integration Tables (2 tables)

**Migration File:** `20251201000008_add_tenant_id_to_integrations.sql`

**Tables to Migrate:**
1. `webhooks` - Webhook configurations
2. `api_keys` - API key management

**Backfill Strategy:**
- Both use `org_id UUID` referencing `profiles(id)`
- Standard backfill from profiles.tenant_id

**Special Considerations:**
- **HIGH SECURITY RISK** - API keys are sensitive
- Test webhook delivery after migration
- Verify API key authentication still works

**Risk Level:** HIGH
- Security-sensitive data
- External integrations depend on this

**Estimated Time:** 4-5 hours

---

## Phase 3: Low Priority Tables (Week 7-12)

### Week 7-8: Analytics & Logging (6 tables)

**Migration File:** `20251201000009_add_tenant_id_to_analytics.sql`

**Tables to Migrate:**
1. `analytics_snapshots`
2. `custom_reports`
3. `api_requests`
4. `merge_audit`
5. `mileage_logs`
6. `gps_tracking`

**Risk Level:** LOW
- Logging and analytics tables
- Can be migrated gradually

**Estimated Time:** 4-6 hours

---

### Week 9-12: Field Services Extended (~20 tables)

**Migration File:** `20251201000010_add_tenant_id_to_field_services_extended.sql`

**Tables to Migrate:**
- All remaining field service tables
- Equipment tracking
- Route planning
- Time entries
- Digital signatures
- Customer portal
- Scheduling suggestions
- Batch operations
- System settings
- Cached calculations
- Report subscriptions
- Webhook deliveries
- Field service roles
- User roles
- Resource skills
- Resource availability
- Booking conflicts
- Route plans
- Route waypoints
- Offline sync queue

**Risk Level:** LOW
- Extended features
- Lower usage
- Can be done incrementally

**Estimated Time:** 12-16 hours (spread over 4 weeks)

---

## Execution Checklist

### Before Each Migration

- [ ] Backup production database
- [ ] Test migration on dev database
- [ ] Verify backfill completeness (no NULL tenant_id)
- [ ] Check for existing data issues
- [ ] Review RLS policies for correctness
- [ ] Test application functionality with new schema
- [ ] Verify performance impact (explain plans)
- [ ] Schedule deployment during low-traffic window

### During Migration

- [ ] Apply migration using run-migration.js script
- [ ] Monitor for errors in migration output
- [ ] Check migration_history table for success
- [ ] Verify RLS policies are created
- [ ] Verify indexes are created
- [ ] Run data consistency checks

### After Migration

- [ ] Verify zero NULL tenant_id values
- [ ] Test user access (correct data isolation)
- [ ] Test CRUD operations via API
- [ ] Monitor application logs for RLS errors
- [ ] Check database performance metrics
- [ ] Update this action plan (mark as complete)
- [ ] Document any issues encountered

---

## Rollback Procedures

### If Migration Fails

1. **Immediately:**
   ```sql
   -- Rollback the migration
   BEGIN;
   -- Drop new policies
   DROP POLICY IF EXISTS [policy_name] ON public.[table_name];
   -- Drop indexes
   DROP INDEX IF EXISTS idx_[table_name]_tenant_id;
   -- Drop column
   ALTER TABLE public.[table_name] DROP COLUMN IF EXISTS tenant_id;
   COMMIT;
   ```

2. **Record in migration_history:**
   ```sql
   UPDATE migration_history
   SET status = 'rolled_back', error_message = 'Reason for rollback'
   WHERE filename = '[migration_filename]';
   ```

3. **Investigate root cause before retry**

### If Data Issues Found After Migration

1. **DO NOT drop tenant_id column**
2. **Fix data integrity issues:**
   ```sql
   -- Find orphaned records
   SELECT * FROM [table_name] WHERE tenant_id IS NULL;

   -- Fix orphaned records (if org_id is available)
   UPDATE [table_name] t
   SET tenant_id = p.tenant_id
   FROM profiles p
   WHERE t.org_id = p.id
     AND t.tenant_id IS NULL;
   ```

3. **Re-verify RLS policies**
4. **Test user access again**

---

## Success Criteria

### Per-Migration Success
- ✅ Zero NULL `tenant_id` values
- ✅ All RLS policies created successfully
- ✅ Indexes created for performance
- ✅ Application tests pass
- ✅ No regression in functionality
- ✅ Performance metrics within acceptable range

### Phase Completion Success
- ✅ All tables in phase have tenant_id
- ✅ All RLS policies use tenant_id pattern
- ✅ No legacy org_id-based policies remain
- ✅ Application code updated to use tenant_id
- ✅ Documentation updated

### Overall Migration Success (100% Complete)
- ✅ 88 business tables migrated
- ✅ Zero legacy org_id-based RLS policies
- ✅ All data integrity checks pass
- ✅ Performance benchmarks met
- ✅ Multi-tenant collaboration working
- ✅ org_id columns marked as deprecated
- ✅ Migration documented and reviewed

---

## Timeline Summary

| Phase | Duration | Tables | Status |
|-------|----------|--------|--------|
| Phase 1 - High Priority | 3 weeks | 16 tables | 🔴 NOT STARTED |
| Phase 2 - Medium Priority | 3 weeks | 12 tables | 🔴 NOT STARTED |
| Phase 3 - Low Priority | 6 weeks | ~26 tables | 🔴 NOT STARTED |
| **TOTAL** | **12 weeks** | **~54 tables** | **38% Complete (34/88)** |

### Milestones

- **Week 3:** Phase 1 Complete (50% total migration)
- **Week 6:** Phase 2 Complete (65% total migration)
- **Week 12:** Phase 3 Complete (100% total migration)

---

## Resource Requirements

### Development Time
- **Senior Engineer:** 40-60 hours total
- **QA Testing:** 20-30 hours total
- **Database Admin:** 10-15 hours total

### Infrastructure
- **Dev Database:** Full production clone
- **Staging Database:** For final testing
- **Backup Storage:** Full database backups before each phase

### Documentation
- **Migration logs:** Document each migration execution
- **Issue tracking:** Track and resolve data issues
- **User communication:** Notify of any downtime

---

## Communication Plan

### Stakeholders
- Development team
- QA team
- Product management
- Operations/DevOps
- End users (if downtime required)

### Communication Points

**Before Phase 1:**
- Announce migration plan
- Explain benefits (multi-user tenants)
- Set expectations for timeline

**During Each Phase:**
- Status updates after each migration
- Report any issues immediately
- Celebrate milestones

**After Completion:**
- Final migration report
- Performance comparison
- Lessons learned
- Future improvements

---

## Next Action

**START HERE:**
1. Review this action plan with team
2. Schedule Phase 1, Week 1 kickoff
3. Create migration file: `20251201000002_add_tenant_id_to_marketing_tables.sql`
4. Test on dev database
5. Deploy to production

---

**Related Documents:**
- [Full Migration Audit](./TENANT_ID_MIGRATION_AUDIT.md)
- [Quick Reference](./TENANT_MIGRATION_QUICK_REFERENCE.md)
- [Migration Template](./TENANT_ID_MIGRATION_AUDIT.md#7-migration-template)
