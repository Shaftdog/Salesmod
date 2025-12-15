# Tenant ID Migration - Quick Reference

**Last Updated:** 2025-12-01

---

## Migration Progress: 38% Complete

```
████████████░░░░░░░░░░░░░░░░░░░░ 34/88 tables
```

---

## ✅ COMPLETED (34 tables)

### Core Business (4)
- ✅ clients
- ✅ orders
- ✅ properties
- ✅ contacts

### Production System (11)
- ✅ kanban_cards
- ✅ production_cards
- ✅ production_tasks
- ✅ production_templates
- ✅ production_template_tasks
- ✅ production_template_subtasks
- ✅ production_time_entries
- ✅ production_resources
- ✅ production_alerts
- ✅ production_agent_runs

### Jobs System (2)
- ✅ jobs
- ✅ job_tasks

### Agent System (5)
- ✅ agent_runs
- ✅ agent_memories
- ✅ agent_reflections
- ✅ agent_settings
- ✅ email_suppressions

### CRM & Activities (3)
- ✅ activities
- ✅ deals
- ✅ contact_companies

### Campaigns (2)
- ✅ campaigns
- ✅ campaign_contact_status

### Finance (3)
- ✅ invoices
- ✅ invoice_line_items
- ✅ products

### Other (4)
- ✅ goals
- ✅ oauth_tokens
- ✅ contact_attempts
- ✅ field_service_requests
- ✅ field_service_assignments

---

## 🔴 URGENT - NEED MIGRATION (16 tables)

### Marketing Module (HIGH PRIORITY)
- ❌ marketing_campaigns
- ❌ marketing_content
- ❌ marketing_audiences
- ❌ marketing_newsletters
- ❌ newsletter_issues
- ❌ email_templates
- ❌ email_campaigns
- ❌ email_sends
- ❌ content_schedule
- ❌ lead_scores
- ❌ contact_preferences

### Gmail Integration (HIGH PRIORITY)
- ❌ gmail_messages
- ❌ gmail_sync_state

### Chat System (HIGH PRIORITY)
- ❌ chat_messages
- ❌ embeddings_index

### Campaign System (URGENT)
- ❌ campaign_responses

---

## 🟡 MEDIUM PRIORITY (12 tables)

### Business Tables
- ❌ property_units
- ❌ party_roles
- ❌ email_notifications
- ❌ validation_logs

### Field Services Core
- ❌ bookings
- ❌ bookable_resources
- ❌ service_territories
- ❌ notifications
- ❌ customer_feedback
- ❌ integrations
- ❌ webhooks
- ❌ api_keys

---

## 🟢 LOW PRIORITY (~26 tables)

### Analytics & Logging
- ❌ analytics_snapshots
- ❌ custom_reports
- ❌ api_requests
- ❌ merge_audit
- ❌ mileage_logs
- ❌ gps_tracking

### Field Services Extended
- ❌ ~20 additional field service tables

---

## 📋 Quick Commands

### Check Migration Status
```bash
# Run from project root
node scripts/run-migration.js --check
```

### Apply Next Migration
```bash
# Apply specific migration
node scripts/run-migration.js supabase/migrations/20251201000002_add_tenant_id_to_marketing.sql
```

### Verify Table Status
```sql
-- Check if table has tenant_id
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'your_table_name'
  AND column_name IN ('org_id', 'tenant_id');

-- Check RLS policies
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
```

---

## 🎯 Next Steps

1. **This Week:**
   - [ ] Migrate marketing module (11 tables)
   - [ ] Migrate Gmail integration (2 tables)
   - [ ] Migrate chat system (2 tables)

2. **Next Week:**
   - [ ] Migrate campaign_responses (1 table)
   - [ ] Migrate business tables (4 tables)
   - [ ] Begin field services core (6 tables)

3. **This Month:**
   - [ ] Complete field services core
   - [ ] Complete all medium priority tables
   - [ ] Test production deployment

---

## 🔍 Key Files

- **Full Audit:** `docs/operations/database-migrations/TENANT_ID_MIGRATION_AUDIT.md`
- **Bootstrap:** `supabase/migrations/20251129000001_bootstrap_tenants.sql`
- **RLS Cleanup:** `supabase/migrations/20251129000010_cleanup_legacy_org_id_policies.sql`

---

## ⚠️ Important Notes

- **DO NOT** drop `org_id` columns until migration is 100% complete
- **ALWAYS** test migrations on dev database first
- **VERIFY** data integrity after each migration
- **CHECK** for NULL `tenant_id` values before enforcing NOT NULL

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 88 |
| Migrated | 34 (38%) |
| High Priority Remaining | 16 |
| Medium Priority Remaining | 12 |
| Low Priority Remaining | ~26 |
| Estimated Completion | 8-12 weeks |

---

**See full details:** [TENANT_ID_MIGRATION_AUDIT.md](./TENANT_ID_MIGRATION_AUDIT.md)
