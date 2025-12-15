# Client Portal - Technical Architecture

**Resolves Critical Design Decisions**
**Version:** 2.0
**Last Updated:** 2025-11-09

---

## Document Purpose

This document defines the technical architecture, resolves critical design decisions, and provides implementation guidance for the Client Portal project.

**Key Decisions Resolved:**
1. [Multi-Tenant Migration Strategy](#multi-tenant-strategy)
2. [Borrower Identity Model](#borrower-identity-model)
3. [RLS Policy Design](#rls-policy-design)
4. [Service-Role Key Usage](#service-role-usage)
5. [External Data Integration Approach](#external-data-integration)

---

## Table of Contents

1. [Current State Analysis](#current-state)
2. [Multi-Tenant Migration Strategy](#multi-tenant-strategy)
3. [Borrower Identity Model](#borrower-identity-model)
4. [RLS Policy Design](#rls-policy-design)
5. [Service-Role Key Usage](#service-role-usage)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [External Data Integration](#external-data-integration)
9. [Security Architecture](#security-architecture)
10. [Performance Optimization](#performance-optimization)

---

## Current State Analysis {#current-state}

### Existing Schema Pattern

**Problem:** Current schema treats each user as their own "organization":

```sql
-- Current implementation
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES profiles(id), -- ← This is the USER who created it
  company_name TEXT,
  ...
);

CREATE POLICY "Users can view their clients"
  ON clients FOR SELECT
  USING (org_id = auth.uid()); -- Direct comparison to user ID
```

**What this means:**
- `org_id` = user who created the record
- Each user operates in isolation (single-user tenant)
- No data sharing between users in same company
- Multi-tenant requires fundamental change

### Tables Affected by Multi-Tenant Migration

**Complete list of tables with `org_id` that need migration:**

1. `clients` - Client companies
2. `orders` - Appraisal orders
3. `properties` - Property records
4. `contacts` - Contact persons
5. `activities` - CRM activities
6. `deals` - Deal tracking
7. `cases` - Case management
8. `tags` - Custom tags
9. `tasks` - Task assignments
10. `goals` - Goal tracking
11. `agent_cards` - AI agent tasks
12. `chat_messages` - AI chat history

**RLS policies to update:** 40+ policies across these tables

---

## Multi-Tenant Migration Strategy {#multi-tenant-strategy}

**Decision:** ✅ **Option C: Hybrid Approach** (Chosen for minimal disruption)

### The Chosen Strategy

**Keep `org_id` as-is, add `tenant_id` for shared access:**

```sql
-- NEW tenant table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'lender', 'investor', 'amc', etc.
  owner_id UUID REFERENCES profiles(id), -- Original user
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UPDATE profiles (existing users)
ALTER TABLE profiles
  ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Existing tables: ADD tenant_id but keep org_id
ALTER TABLE clients
  ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- New RLS policy (additive, doesn't break existing)
CREATE POLICY "Users can view their own clients OR tenant clients"
  ON clients FOR SELECT
  USING (
    org_id = auth.uid() -- Existing logic (backward compatible)
    OR
    tenant_id IN ( -- New logic (for teams)
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### Migration Plan (Phase 0)

**Step 1: Create Tenant Records for Existing Users**

```sql
-- Migration script: 20251110000001_create_tenants_for_existing_users.sql

-- 1. Create tenant for each existing user
INSERT INTO tenants (id, name, type, owner_id)
SELECT
  gen_random_uuid(),
  COALESCE(p.name || '''s Organization', 'Default Organization'),
  'internal', -- Default type, can be updated later
  p.id
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE owner_id = p.id);

-- 2. Link users to their tenants
UPDATE profiles p
SET tenant_id = t.id
FROM tenants t
WHERE t.owner_id = p.id
AND p.tenant_id IS NULL;
```

**Step 2: Backfill tenant_id on All Tables**

```sql
-- Backfill clients
UPDATE clients c
SET tenant_id = p.tenant_id
FROM profiles p
WHERE c.org_id = p.id
AND c.tenant_id IS NULL;

-- Backfill orders
UPDATE orders o
SET tenant_id = p.tenant_id
FROM profiles p
WHERE o.org_id = p.id
AND o.tenant_id IS NULL;

-- Repeat for: properties, contacts, activities, deals, cases, tags, tasks, goals, agent_cards, chat_messages
```

**Step 3: Update RLS Policies (Additive)**

```sql
-- Example: Update clients policy
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;

CREATE POLICY "Users can view their clients"
  ON clients FOR SELECT
  USING (
    org_id = auth.uid() -- Backward compatible (existing single-user orgs)
    OR
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()) -- New (teams)
  );

-- Similar updates for INSERT, UPDATE, DELETE policies
```

**Step 4: Testing**

```sql
-- Verify backfill completeness
SELECT 'clients' as table_name, COUNT(*) as null_tenant_count
FROM clients WHERE tenant_id IS NULL
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE tenant_id IS NULL
UNION ALL
SELECT 'properties', COUNT(*) FROM properties WHERE tenant_id IS NULL;
-- All counts should be 0

-- Test tenant isolation
-- Create two test users in different tenants, verify user A cannot see user B's data
```

### Rollback Plan

```sql
-- Emergency rollback if Phase 0 fails

-- 1. Revert RLS policies to original
DROP POLICY IF EXISTS "Users can view their clients" ON clients;
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT TO authenticated USING (true);

-- 2. Remove tenant_id columns (data preserved in org_id)
ALTER TABLE clients DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE orders DROP COLUMN IF EXISTS tenant_id;
-- ... etc

-- 3. Drop tenants table
DROP TABLE IF EXISTS tenants CASCADE;
```

### Timeline & Risk

**Estimated Effort:** 2-3 weeks
- Week 1: Migration scripts, testing on staging
- Week 2: RLS policy updates, automated testing
- Week 3: Production migration (staged rollout)

**Risk Level:** 🟡 Medium
- **Risk:** Backfill fails for large tables (100k+ records)
- **Mitigation:** Batch processing, progress monitoring
- **Risk:** RLS policies too complex, slow queries
- **Mitigation:** Index tenant_id, query plan analysis
- **Risk:** Data inconsistency (some records missing tenant_id)
- **Mitigation:** Verification queries, automated tests

---

## Borrower Identity Model {#borrower-identity-model}

**Decision:** ✅ **Option 3: Magic Links** (Recommended)

### Why Magic Links?

**Pros:**
- ✅ No password management (better UX for infrequent users)
- ✅ Leverages Supabase Auth (secure, battle-tested)
- ✅ Built-in MFA option if needed later
- ✅ Audit trail via Supabase Auth logs
- ✅ Automatic session expiration

**Cons:**
- ❌ Requires email delivery (dependency on email service)
- ❌ Can't use if borrower email bounces

### Implementation

#### Step 1: Lender Grants Access

```typescript
// API Route: POST /api/orders/[orderId]/borrower-access

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  const supabase = createClient(); // Regular client (authenticated as lender)
  const body = await request.json();

  // 1. Verify lender has access to this order
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 2. Create magic link using Supabase Admin API
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: body.borrowerEmail,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/borrower/orders/${params.orderId}`,
      data: {
        role: 'borrower',
        order_id: params.orderId,
        granted_by: (await supabase.auth.getUser()).data.user?.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }
    }
  });

  if (error) throw error;

  // 3. Log access grant
  await supabase.from('borrower_access_log').insert({
    order_id: params.orderId,
    borrower_email: body.borrowerEmail,
    action: 'access_granted',
    granted_by: (await supabase.auth.getUser()).data.user?.id,
    magic_link_sent: true
  });

  // 4. Send email with magic link
  await sendEmail({
    to: body.borrowerEmail,
    subject: `Access Granted: Order ${order.order_number}`,
    html: `
      <p>You have been granted access to view your appraisal order.</p>
      <p><a href="${data.properties.action_link}">Click here to view order</a></p>
      <p>This link expires in 30 days.</p>
    `
  });

  return NextResponse.json({ success: true, email: body.borrowerEmail });
}
```

#### Step 2: Borrower Clicks Magic Link

```typescript
// Page: /app/borrower/orders/[orderId]/page.tsx

export default async function BorrowerOrderPage({ params }: { params: { orderId: string } }) {
  const supabase = createClient();

  // 1. Get current user (created by magic link)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?message=Please use the link from your email');
  }

  // 2. Check user metadata for borrower role
  const userRole = user.user_metadata?.role;
  const authorizedOrderId = user.user_metadata?.order_id;

  if (userRole !== 'borrower' || authorizedOrderId !== params.orderId) {
    return <div>Access denied. This link is not valid for this order.</div>;
  }

  // 3. Log access
  await supabase.from('borrower_access_log').insert({
    order_id: params.orderId,
    borrower_email: user.email,
    action: 'order_viewed',
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent')
  });

  // 4. Fetch order data (RLS will enforce access)
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      property_address,
      property_city,
      property_state,
      property_zip,
      due_date,
      documents:order_documents(*)
    `)
    .eq('id', params.orderId)
    .single();

  return <BorrowerOrderView order={order} />;
}
```

#### Step 3: RLS Policies for Borrower Access

```sql
-- Borrowers can view orders they're authorized for
CREATE POLICY "Borrowers can view authorized orders"
  ON orders FOR SELECT
  USING (
    -- Regular users (lenders, staff)
    (
      org_id = auth.uid()
      OR tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
    OR
    -- Borrowers via magic link
    (
      auth.jwt()->>'role' = 'borrower'
      AND id::text = auth.jwt()->'user_metadata'->>'order_id'
      AND (auth.jwt()->'user_metadata'->>'expires_at')::timestamptz > NOW()
    )
  );

-- Borrowers can only view public documents
CREATE POLICY "Borrowers can view public documents"
  ON order_documents FOR SELECT
  USING (
    -- Regular users (see all docs)
    (
      order_id IN (SELECT id FROM orders WHERE org_id = auth.uid())
    )
    OR
    -- Borrowers (only public docs)
    (
      auth.jwt()->>'role' = 'borrower'
      AND order_id::text = auth.jwt()->'user_metadata'->>'order_id'
      AND is_public_to_borrower = true
    )
  );
```

### Access Revocation

```typescript
// Lender revokes access: Update user_metadata to set expired
await supabaseAdmin.auth.admin.updateUserById(borrowerUserId, {
  user_metadata: {
    ...existingMetadata,
    expires_at: new Date().toISOString() // Set to past date
  }
});
```

### Advantages of This Approach

1. **Security:** Leverages Supabase Auth (battle-tested)
2. **Auditability:** All access via `auth.users` + custom logs
3. **Simplicity:** No custom token management
4. **Flexibility:** Can add MFA later if needed
5. **Compliance:** JWT contains order_id, expires_at for RLS enforcement

---

## RLS Policy Design {#rls-policy-design}

### Policy Complexity Management

**Problem:** Multi-tenant + borrower access = complex policies

**Solution:** Policy composition with helper functions

```sql
-- Helper function: Check if user can access tenant
CREATE OR REPLACE FUNCTION auth.user_can_access_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND tenant_id = tenant_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Check if user is borrower for order
CREATE OR REPLACE FUNCTION auth.user_is_borrower_for_order(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'role' = 'borrower'
    AND order_uuid::text = auth.jwt()->'user_metadata'->>'order_id'
    AND (auth.jwt()->'user_metadata'->>'expires_at')::timestamptz > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Simplified policy using helpers
CREATE POLICY "Users and borrowers can view orders"
  ON orders FOR SELECT
  USING (
    org_id = auth.uid() -- Creator
    OR auth.user_can_access_tenant(tenant_id) -- Team member
    OR auth.user_is_borrower_for_order(id) -- Authorized borrower
  );
```

### Performance Optimization

**Problem:** RLS policies can slow queries

**Solutions:**
1. Index columns used in RLS policies
2. Use `SECURITY DEFINER` + `STABLE` on helper functions (allows inlining)
3. Monitor query plans with `EXPLAIN ANALYZE`

```sql
-- Indexes for RLS performance
CREATE INDEX idx_clients_tenant ON clients(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_orders_tenant ON orders(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_profiles_tenant_auth ON profiles(tenant_id, id);
```

---

## Service-Role Key Usage {#service-role-usage}

**Problem:** Some operations require bypassing RLS (e.g., tenant creation during registration).

**Solution:** Strictly control service-role usage with audit logging.

### Allowed Use Cases

✅ **Permitted:**
1. Tenant creation during user registration
2. Magic link generation for borrowers
3. Automated system tasks (cleanup, aggregations)
4. Admin panel operations (with user authorization check)

❌ **Prohibited:**
1. Regular API routes accessible to users
2. Client-side code
3. Unlogged operations

### Implementation Pattern

```typescript
// src/lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js';
import { createClient as createRegularClient } from './server';

// NEVER export this directly to API routes
function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
      db: { schema: 'public' }
    }
  );
}

// Safe wrapper: requires user auth + logs usage
export async function executeAsAdmin<T>(
  operation: string,
  userId: string,
  fn: (adminClient: any) => Promise<T>
): Promise<T> {
  // 1. Verify user is authenticated (via regular client)
  const supabase = createRegularClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.id !== userId) {
    throw new Error('Unauthorized admin operation');
  }

  // 2. Log the operation
  console.log('[ADMIN OPERATION]', {
    operation,
    userId,
    timestamp: new Date().toISOString()
  });

  // 3. Execute with admin client
  const adminClient = getAdminClient();
  const result = await fn(adminClient);

  // 4. Log completion
  console.log('[ADMIN OPERATION COMPLETE]', { operation, userId });

  return result;
}
```

### Usage Example

```typescript
// API Route: POST /api/auth/register

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name, tenantName, tenantType } = registerSchema.parse(body);

  // 1. Create user with Supabase Auth (no service-role needed)
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (authError) throw authError;
  const userId = authData.user!.id;

  // 2. Create tenant (requires service-role)
  const tenant = await executeAsAdmin(
    'create_tenant_during_registration',
    userId,
    async (adminClient) => {
      const { data, error } = await adminClient
        .from('tenants')
        .insert({ name: tenantName, type: tenantType, owner_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  );

  // 3. Update profile with tenant_id (requires service-role)
  await executeAsAdmin(
    'link_user_to_tenant',
    userId,
    async (adminClient) => {
      await adminClient
        .from('profiles')
        .update({ tenant_id: tenant.id, tenant_type: tenantType })
        .eq('id', userId);
    }
  );

  return NextResponse.json({ success: true, userId, tenantId: tenant.id });
}
```

### Audit Logging

All service-role operations logged to:
1. Application logs (stdout, captured by Vercel/Sentry)
2. Database audit table (optional, for compliance)

```sql
-- Optional: Database audit log
CREATE TABLE admin_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Database Schema {#database-schema}

### New Tables for Client Portal

```sql
-- Tenants (multi-org support)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lender', 'investor', 'amc', 'attorney', 'accountant', 'borrower', 'internal')),
  owner_id UUID REFERENCES profiles(id),
  theme_settings JSONB DEFAULT '{"primaryColor": "#3b82f6", "logo": null}',
  sla_settings JSONB DEFAULT '{"standard_turnaround_days": 7, "rush_turnaround_days": 3}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order documents (already planned in original docs)
CREATE TABLE public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  is_public_to_borrower BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Borrower access logs (USPAP audit trail)
CREATE TABLE public.borrower_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  borrower_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'access_granted', 'order_viewed', 'document_downloaded'
  granted_by UUID REFERENCES profiles(id),
  magic_link_sent BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External property data cache
CREATE TABLE public.property_external_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL, -- 'zillow', 'mls_name', 'attom'
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(property_id, source)
);

-- Comparables (USPAP compliance)
CREATE TABLE public.comparables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id),
  address TEXT NOT NULL,
  sale_date DATE NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  distance_miles DECIMAL(5,2),
  gla_sqft INTEGER,
  adjustments JSONB NOT NULL, -- {"location": -5000, "condition": 2000, ...}
  total_adjustment DECIMAL(12,2) NOT NULL,
  adjusted_value DECIMAL(12,2) NOT NULL,
  justification TEXT NOT NULL, -- USPAP requirement
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-order validation results
CREATE TABLE public.pre_order_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  validation_type TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  message TEXT,
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-specific feature flags
CREATE TABLE public.role_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT REFERENCES party_roles(code) NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB,
  UNIQUE(role_code, feature_key)
);

-- Bulk actions log
CREATE TABLE public.bulk_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id) NOT NULL,
  order_ids UUID[] NOT NULL,
  parameters JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Tenant-based queries
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_clients_tenant ON clients(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_orders_tenant ON orders(tenant_id) WHERE tenant_id IS NOT NULL;

-- Client dashboard queries
CREATE INDEX idx_orders_client_status_due ON orders(client_id, status, due_date);
CREATE INDEX idx_orders_client_ordered ON orders(client_id, ordered_date DESC);

-- Document access
CREATE INDEX idx_order_documents_order ON order_documents(order_id);
CREATE INDEX idx_order_documents_public ON order_documents(is_public_to_borrower, order_id);

-- Comparables
CREATE INDEX idx_comparables_order ON comparables(order_id);

-- Audit logs
CREATE INDEX idx_borrower_log_order ON borrower_access_log(order_id);
CREATE INDEX idx_borrower_log_email ON borrower_access_log(borrower_email);

-- External data cache
CREATE INDEX idx_external_data_property ON property_external_data(property_id, source);
CREATE INDEX idx_external_data_expires ON property_external_data(expires_at);
```

---

## API Architecture {#api-architecture}

### API Route Patterns

**Standard CRUD Routes:**
```
GET    /api/clients/[clientId]/orders          # List orders
GET    /api/orders/[orderId]                   # Order detail
POST   /api/orders                             # Create order
PATCH  /api/orders/[orderId]                   # Update order
DELETE /api/orders/[orderId]                   # Delete order
```

**Nested Resource Routes:**
```
POST   /api/orders/[orderId]/documents         # Upload document
GET    /api/orders/[orderId]/documents/[docId] # Get document
DELETE /api/orders/[orderId]/documents/[docId] # Delete document
```

**Action Routes (Non-CRUD):**
```
POST   /api/orders/[orderId]/borrower-access   # Grant access
POST   /api/orders/[orderId]/assign            # Assign appraiser
POST   /api/pre-orders/[preOrderId]/convert    # Convert to order
POST   /api/lender/orders/bulk-assign          # Bulk assign
POST   /api/clients/[clientId]/orders/export   # Export CSV
```

### Authentication Middleware

```typescript
// src/lib/api/with-auth.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export function withAuth(
  handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, context, user);
  };
}

// Usage
export const GET = withAuth(async (request, { params }, user) => {
  // user is authenticated
  const supabase = createClient();
  const { data } = await supabase.from('orders').select('*');
  return NextResponse.json({ data });
});
```

### Error Handling

```typescript
// src/lib/api/api-error.ts

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }

  console.error('[API Error]', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## External Data Integration {#external-data-integration}

**Status:** ⏳ **Requires Phase 2.0 Discovery Before Implementation**

### Discovery Phase Requirements

Before implementing external data integration, complete:

1. **Zillow Data Source Evaluation**
   - ✅ Confirm RapidAPI provider reliability (uptime, accuracy)
   - ✅ Legal review of screen-scraping terms
   - ✅ Cost analysis: $0.01-$0.10 per request × expected volume
   - ✅ Test data accuracy vs. internal comps
   - ✅ Decision: GO/NO-GO

2. **MLS Data Source Evaluation**
   - ✅ Identify target markets (FL, CA, TX priority)
   - ✅ Research MLS access (license requirements, APIs)
   - ✅ Evaluate aggregators: Trestle, Bridge Interactive, RESO
   - ✅ Get pricing quotes (likely $1k-$5k/month)
   - ✅ Legal review of republishing terms
   - ✅ Decision: GO/NO-GO per market

3. **Alternative Data Sources**
   - ✅ Evaluate ATTOM Data Solutions (property data API)
   - ✅ Evaluate CoreLogic / First American
   - ✅ Evaluate Regrid (parcel data)
   - ✅ Design user-uploaded comps fallback

### IF Approved: Architecture

**Caching Strategy:**
```typescript
// src/lib/integrations/cache.ts

export async function getCachedOrFetch<T>(
  cacheKey: { property_id: string; source: string },
  fetchFn: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<T> {
  const supabase = createClient();

  // Check cache
  const { data: cached } = await supabase
    .from('property_external_data')
    .select('data, expires_at')
    .eq('property_id', cacheKey.property_id)
    .eq('source', cacheKey.source)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return cached.data as T;
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  // Cache it
  await supabase
    .from('property_external_data')
    .upsert({
      property_id: cacheKey.property_id,
      source: cacheKey.source,
      data: freshData,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttl).toISOString()
    });

  return freshData;
}
```

**Rate Limiting:**
```typescript
// Using Upstash Redis for distributed rate limiting

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true
});

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

---

## Security Architecture {#security-architecture}

### Defense in Depth

**Layer 1: Network**
- TLS 1.3 for all traffic
- Vercel DDoS protection
- Rate limiting on auth endpoints (5 attempts per 15 min)

**Layer 2: Authentication**
- Supabase Auth (JWT with HMAC-SHA256)
- MFA via TOTP (optional)
- Magic links for borrowers

**Layer 3: Authorization**
- Row-Level Security (RLS) on all tables
- Helper functions for complex policies
- Service-role key strictly controlled

**Layer 4: Application**
- Input validation (Zod schemas)
- Output escaping (React default)
- CSP headers
- File upload validation

**Layer 5: Data**
- Encryption at rest (AES-256)
- PII access logging
- Audit trails (immutable logs)

### Security Headers

```typescript
// next.config.ts

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'"
    ].join('; ')
  }
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};
```

---

## Performance Optimization {#performance-optimization}

### Query Optimization

**Problem:** RLS policies can cause slow queries

**Solutions:**
1. Indexes on RLS-filtered columns
2. Materialized views for complex aggregations
3. Query plan analysis

```sql
-- Example: Optimize client dashboard query
CREATE MATERIALIZED VIEW client_dashboard_stats AS
SELECT
  client_id,
  COUNT(*) FILTER (WHERE status = 'new') as new_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  -- ... other counts
FROM orders
GROUP BY client_id;

CREATE UNIQUE INDEX ON client_dashboard_stats(client_id);

-- Refresh periodically (5 minutes)
-- Via cron job or pg_cron extension
```

### Caching Strategy

**Client-Side (React Query):**
```typescript
// src/hooks/use-client-orders.ts

export function useClientOrders(clientId: string) {
  return useQuery({
    queryKey: ['client', clientId, 'orders'],
    queryFn: () => fetchClientOrders(clientId),
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    cacheTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  });
}
```

**Server-Side (Next.js):**
```typescript
// API routes with Next.js cache headers
export async function GET(request: NextRequest) {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
    }
  });
}
```

### Real-Time Optimization

**Selective Subscriptions:**
```typescript
// Only subscribe to changes for current view
const subscription = supabase
  .channel('client_orders')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `client_id=eq.${clientId}` // Server-side filter
    },
    (payload) => {
      queryClient.invalidateQueries(['client', clientId, 'orders']);
    }
  )
  .subscribe();
```

---

## Conclusion

This architecture resolves all critical design decisions:

✅ **Multi-Tenant:** Hybrid approach (add `tenant_id`, keep `org_id` for backward compatibility)
✅ **Borrower Auth:** Magic links via Supabase Auth (secure, simple, auditable)
✅ **RLS Design:** Helper functions + indexes for maintainable, performant policies
✅ **Service-Role:** Strictly controlled with audit logging
✅ **External Data:** Discovery phase required before implementation

**Next Steps:**
1. Stakeholder approval of architecture decisions
2. Proceed to [03-ROADMAP.md](./03-ROADMAP.md) for implementation plan
3. Begin Phase 0 (Multi-Tenant Migration)

---

**Questions or concerns?** Review with tech lead and security stakeholder before proceeding.
