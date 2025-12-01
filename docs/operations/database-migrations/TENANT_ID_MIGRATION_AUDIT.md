# Tenant ID Migration Audit Report
**Generated:** 2025-12-01
**Status:** Comprehensive Analysis

---

## Executive Summary

The database is undergoing a migration from `org_id` (user-based isolation) to `tenant_id` (organization-based multi-tenant isolation). This audit identifies the current state of the migration across all business tables.

### Migration Status Overview

- **✅ Complete:** 34 tables with tenant_id + RLS policies updated
- **⚠️ Partial:** 6 tables with tenant_id but missing proper RLS (newly added)
- **❌ Incomplete:** ~20+ tables still using org_id without tenant_id
- **🔒 Core Tables:** 4/4 core tables migrated (clients, orders, properties, contacts)

---

## 1. Tables with Complete tenant_id Migration

These tables have:
- ✅ `tenant_id UUID` column added
- ✅ Backfilled with data from profiles.tenant_id
- ✅ RLS policies updated to use tenant_id
- ✅ Indexes created for performance

### Core Business Tables (4)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `clients` | ✅ | ✅ | 20251129000007_update_rls_core_tables.sql |
| `orders` | ✅ | ✅ | 20251129000007_update_rls_core_tables.sql |
| `properties` | ✅ | ✅ | 20251129000007_update_rls_core_tables.sql |
| `contacts` | ✅ | ✅ | 20251201000001_add_tenant_id_to_contacts.sql |

### Production & Kanban System (11)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `kanban_cards` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_cards` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_tasks` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_templates` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_template_tasks` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_template_subtasks` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_time_entries` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_resources` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_alerts` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `production_agent_runs` | ✅ | ✅ | 20251129000003 + 20251129000008 |

### Jobs System (2)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `jobs` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `job_tasks` | ✅ | ✅ | 20251129000003 + 20251129000008 |

### Agent System (5)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `agent_runs` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `agent_memories` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `agent_reflections` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `agent_settings` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `email_suppressions` | ✅ | ✅ | 20251129000003 + 20251129000008 |

### Marketing & Campaigns (2)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `campaigns` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `campaign_contact_status` | ✅ | ✅ | 20251129000003 + 20251129000009 |

### Invoicing & Products (3)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `invoices` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `invoice_line_items` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `products` | ✅ | ✅ | 20251129000003 + 20251129000009 |

### Other Business Tables (7)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `goals` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `oauth_tokens` | ✅ | ✅ | 20251129000003 + 20251129000008 |
| `activities` | ✅ | ✅ | 20251129000002 |
| `contact_companies` | ✅ | ✅ | 20251129000002 |
| `deals` | ✅ | ✅ | 20251201000000_add_tenant_id_to_deals.sql |
| `field_service_requests` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `field_service_assignments` | ✅ | ✅ | 20251129000003 + 20251129000009 |

### Optional Feature Tables (6)
| Table | tenant_id Added | RLS Updated | Migration File |
|-------|----------------|-------------|----------------|
| `reviews` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `review_responses` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `webinars` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `webinar_registrations` | ✅ | ✅ | 20251129000003 + 20251129000009 |
| `contact_attempts` | ✅ | ✅ | 20251129000003 + 20251129000009 |

**Total: 34 tables fully migrated**

---

## 2. Tables with Partial tenant_id Support

These tables may have `tenant_id` but lack proper RLS policies or haven't been backfilled:

| Table | Issue | Action Needed |
|-------|-------|---------------|
| `campaign_contacts` | May not exist (check for campaign_contact_status instead) | Verify table name |

---

## 3. Tables Still Using org_id WITHOUT tenant_id

### Critical Business Tables Needing Migration

#### Marketing Module (11 tables)
| Table | org_id? | tenant_id? | RLS Pattern | Priority |
|-------|---------|-----------|-------------|----------|
| `marketing_campaigns` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `marketing_content` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `content_schedule` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `lead_scores` | ✅ | ❌ | `org_id = auth.uid()` | MEDIUM |
| `marketing_audiences` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `marketing_newsletters` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `newsletter_issues` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `email_templates` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `email_campaigns` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `email_sends` | ✅ | ❌ | `org_id = auth.uid()` | MEDIUM |
| `contact_preferences` | ✅ | ❌ | `org_id = auth.uid()` | MEDIUM |

#### Gmail Integration (2 tables)
| Table | org_id? | tenant_id? | RLS Pattern | Priority |
|-------|---------|-----------|-------------|----------|
| `gmail_messages` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |
| `gmail_sync_state` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |

#### Chat & RAG System (2 tables)
| Table | org_id? | tenant_id? | RLS Pattern | Priority |
|-------|---------|-----------|-------------|----------|
| `embeddings_index` | ✅ | ❌ | `org_id = auth.uid()` | MEDIUM |
| `chat_messages` | ✅ | ❌ | `org_id = auth.uid()` | HIGH |

#### Field Services System (~20 tables)
| Table | org_id? | tenant_id? | Priority |
|-------|---------|-----------|----------|
| `service_territories` | ✅ | ❌ | MEDIUM |
| `bookable_resources` | ✅ | ❌ | MEDIUM |
| `bookings` | ✅ | ❌ | HIGH |
| `mileage_logs` | ✅ | ❌ | LOW |
| `gps_tracking` | ✅ | ❌ | LOW |
| `notifications` | ✅ | ❌ | MEDIUM |
| `customer_feedback` | ✅ | ❌ | MEDIUM |
| `analytics_snapshots` | ✅ | ❌ | LOW |
| `custom_reports` | ✅ | ❌ | MEDIUM |
| `integrations` | ✅ | ❌ | MEDIUM |
| `webhooks` | ✅ | ❌ | MEDIUM |
| `api_keys` | ✅ | ❌ | HIGH |
| `api_requests` | ✅ | ❌ | LOW |
| `field_service_roles` | ✅ | ❌ | MEDIUM |
| `field_service_user_roles` | ✅ | ❌ | MEDIUM |
| `batch_operations` | ✅ | ❌ | LOW |
| *(~15 more field service tables)* | ✅ | ❌ | VARIOUS |

#### Other Business Tables (6 tables)
| Table | org_id? | tenant_id? | RLS Pattern | Priority |
|-------|---------|-----------|-------------|----------|
| `validation_logs` | ✅ | ❌ | `org_id = auth.uid()` | LOW |
| `property_units` | ✅ | ❌ | Via parent property | MEDIUM |
| `party_roles` | ✅ | ❌ | Via parent order | MEDIUM |
| `email_notifications` | ✅ | ❌ | `org_id = auth.uid()` | MEDIUM |
| `merge_audit` | ✅ | ❌ | `org_id = auth.uid()` | LOW |
| `campaign_responses` | ✅ | ❌ | Via parent campaign | HIGH |

**Total: ~54 tables still need migration**

---

## 4. Tables Without org_id or tenant_id (System Tables)

These tables don't need tenant isolation:

| Table | Scope | Reason |
|-------|-------|--------|
| `profiles` | Global | User profiles are global, tenant_id is a column here |
| `tenants` | Global | Tenant definitions |
| `roles` | Global | RBAC role definitions |
| `permissions` | Global | RBAC permission definitions |
| `role_permissions` | Global | RBAC mappings |
| `audit_logs` | Global | System audit trail |
| `settings` | Global | System settings |
| `migration_jobs` | System | Migration tracking |
| `migration_errors` | System | Migration error log |
| `borrower_order_access` | Scoped | Uses order_id FK |
| `order_status_history` | Scoped | Uses order_id FK |
| `skill_types` | Global | Reference data |
| `equipment_catalog` | Global | Reference data |
| `task_library` | Special | Uses RBAC for access control |

---

## 5. RLS Policy Audit

### Legacy org_id-based Policies (Need Replacement)

**Pattern:** `USING (org_id = auth.uid())`

These policies assume single-user tenants and need to be replaced with:
```sql
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
)
```

#### Tables Still Using Legacy RLS Pattern:

1. **Marketing Module** (11 tables):
   - All `marketing_*` tables
   - All `email_*` tables
   - All `newsletter_*` tables
   - All `content_*` tables

2. **Gmail Integration** (2 tables):
   - `gmail_messages`
   - `gmail_sync_state`

3. **Chat System** (2 tables):
   - `embeddings_index`
   - `chat_messages`

4. **Field Services** (~20 tables):
   - All field service related tables

5. **Miscellaneous** (6 tables):
   - `validation_logs`
   - `email_notifications`
   - `merge_audit`
   - Others listed above

### Modern tenant_id-based Policies (Correct Pattern)

**Pattern:** `tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())`

- ✅ **34 tables** now use this pattern correctly
- ✅ Supports multi-user tenants
- ✅ Allows team collaboration within organizations
- ✅ Future-proof for SaaS multi-tenancy

---

## 6. Migration Strategy & Recommendations

### Phase 1: High Priority Tables (Immediate)
**Target:** Tables with active user data and high usage

1. **Marketing Module** (1-2 weeks)
   - Create migration: `20251201000002_add_tenant_id_to_marketing_tables.sql`
   - Migrate: `marketing_campaigns`, `marketing_audiences`, `email_campaigns`, `email_templates`, `marketing_newsletters`
   - Backfill from `org_id → profiles.tenant_id`
   - Update RLS policies

2. **Gmail Integration** (1 week)
   - Create migration: `20251201000003_add_tenant_id_to_gmail.sql`
   - Migrate: `gmail_messages`, `gmail_sync_state`
   - Critical for email functionality

3. **Chat System** (1 week)
   - Create migration: `20251201000004_add_tenant_id_to_chat.sql`
   - Migrate: `chat_messages`, `embeddings_index`
   - Important for user experience

4. **Campaign Responses** (urgent - data loss risk)
   - Create migration: `20251201000005_add_tenant_id_to_campaign_responses.sql`
   - This table is referenced in campaigns but may lack proper isolation

### Phase 2: Medium Priority (2-4 weeks)
1. **Field Services Core** (~10 key tables)
   - Focus on: `bookings`, `bookable_resources`, `service_territories`
   - Create migration: `20251201000006_add_tenant_id_to_field_services_core.sql`

2. **Remaining Business Tables**
   - `property_units`, `party_roles`, `email_notifications`
   - Create migration: `20251201000007_add_tenant_id_to_business_misc.sql`

### Phase 3: Low Priority (As needed)
1. **Analytics & Logging Tables**
   - `validation_logs`, `analytics_snapshots`, `api_requests`
   - Create migration: `20251201000008_add_tenant_id_to_analytics.sql`

2. **Field Services Extended Features**
   - Remaining field service tables (mileage, GPS, etc.)
   - Create migration: `20251201000009_add_tenant_id_to_field_services_extended.sql`

---

## 7. Migration Template

For each table group, follow this pattern:

```sql
-- =============================================
-- Add tenant_id to [TABLE_GROUP] tables
-- Phase: [1/2/3], Priority: [HIGH/MEDIUM/LOW]
-- =============================================

-- 1. Add tenant_id columns (nullable for backfill)
ALTER TABLE public.[table_name]
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Backfill from org_id
UPDATE public.[table_name] t
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE t.org_id = p.id
  AND t.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- 3. Make NOT NULL (after verification)
ALTER TABLE public.[table_name]
  ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Add index
CREATE INDEX IF NOT EXISTS idx_[table_name]_tenant_id
  ON public.[table_name](tenant_id);

-- 5. Update RLS policies
DROP POLICY IF EXISTS [old_policy_name] ON public.[table_name];

CREATE POLICY [table_name]_tenant_isolation
  ON public.[table_name]
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

-- 6. Verify
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM public.[table_name]
  WHERE tenant_id IS NULL;

  IF v_null_count > 0 THEN
    RAISE WARNING '[table_name] has % NULL tenant_id values', v_null_count;
  ELSE
    RAISE NOTICE '[table_name] migration complete ✓';
  END IF;
END $$;
```

---

## 8. Verification Queries

### Check Current Migration Status
```sql
-- Count tables with tenant_id
SELECT COUNT(DISTINCT table_name)
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
  AND table_name NOT IN ('tenants', 'profiles');

-- List tables with org_id but no tenant_id
SELECT DISTINCT c1.table_name
FROM information_schema.columns c1
WHERE c1.table_schema = 'public'
  AND c1.column_name = 'org_id'
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c2
    WHERE c2.table_schema = 'public'
      AND c2.table_name = c1.table_name
      AND c2.column_name = 'tenant_id'
  )
ORDER BY c1.table_name;

-- Check for NULL tenant_id values
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
  )
ORDER BY n_live_tup DESC;

-- Find legacy RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN qual::text LIKE '%org_id = auth.uid()%' THEN 'LEGACY (org_id)'
    WHEN qual::text LIKE '%tenant_id IN%' THEN 'MODERN (tenant_id)'
    ELSE 'OTHER'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY policy_type, tablename;
```

### Check Data Consistency
```sql
-- Verify all profiles have tenant_id
SELECT COUNT(*) as orphaned_profiles
FROM public.profiles
WHERE tenant_id IS NULL;

-- Verify backfill completeness for a table
SELECT
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as null_tenant_id,
  COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as has_tenant_id,
  COUNT(*) as total
FROM public.[table_name];
```

---

## 9. Risks & Mitigation

### High Risk Areas

1. **Data Loss on org_id Removal**
   - Risk: Dropping org_id before tenant_id is fully backfilled
   - Mitigation: Keep org_id column until Phase 3 complete, mark as deprecated

2. **RLS Policy Gaps**
   - Risk: Tables with tenant_id but no RLS = data leak
   - Mitigation: Always create RLS policies in same transaction as column add

3. **NULL tenant_id Values**
   - Risk: Orphaned records if backfill fails
   - Mitigation: DO NOT make tenant_id NOT NULL until verification passes

4. **Performance Impact**
   - Risk: RLS subquery on every query could be slow
   - Mitigation: Proper indexing on tenant_id, query optimization

### Rollback Strategy

Each migration file includes rollback instructions:
```sql
-- Drop policies
DROP POLICY IF EXISTS [policy_name] ON public.[table_name];

-- Drop indexes
DROP INDEX IF EXISTS idx_[table_name]_tenant_id;

-- Remove column
ALTER TABLE public.[table_name] DROP COLUMN IF EXISTS tenant_id;
```

---

## 10. Action Items

### Immediate (This Week)
- [ ] Create migration for marketing module tables
- [ ] Create migration for Gmail integration tables
- [ ] Create migration for chat system tables
- [ ] Test migrations on development database
- [ ] Verify data integrity after each migration

### Short Term (Next 2 Weeks)
- [ ] Create migration for campaign_responses
- [ ] Create migration for field services core tables
- [ ] Create migration for remaining business tables
- [ ] Update application code to use tenant_id in queries

### Medium Term (Next Month)
- [ ] Create migration for analytics/logging tables
- [ ] Create migration for field services extended tables
- [ ] Mark org_id columns as deprecated
- [ ] Update documentation for tenant_id usage

### Long Term (Future)
- [ ] Remove org_id columns (after full verification)
- [ ] Remove legacy RLS policies (after full verification)
- [ ] Add constraint checks for tenant_id consistency
- [ ] Performance tuning and optimization

---

## 11. Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Tables in Schema** | ~95 |
| **Tables with tenant_id (Complete)** | 34 |
| **Tables with org_id (Need Migration)** | ~54 |
| **System Tables (No Isolation Needed)** | ~14 |
| **Migration Coverage** | 38% |
| **RLS Policies Updated** | 34 |
| **Legacy RLS Policies Remaining** | ~54 |

### Migration Timeline Estimate
- **Phase 1 (High Priority):** 3-4 weeks
- **Phase 2 (Medium Priority):** 2-4 weeks
- **Phase 3 (Low Priority):** 2-3 weeks
- **Total Estimated Time:** 8-12 weeks for complete migration

---

## Related Documents

- [Migration Instructions](./MANUAL-MIGRATION-INSTRUCTIONS.md)
- [Tenant Bootstrap Migration](../../supabase/migrations/20251129000001_bootstrap_tenants.sql)
- [RLS Cleanup Migration](../../supabase/migrations/20251129000010_cleanup_legacy_org_id_policies.sql)

---

**Last Updated:** 2025-12-01
**Next Review:** After Phase 1 completion
