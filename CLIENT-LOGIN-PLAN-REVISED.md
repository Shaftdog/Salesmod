# Client Login Module - Implementation Plan (REVISED)

**Project:** Salesmod - Appraisal Management System
**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS, shadcn/ui
**Date:** 2025-11-09

---

## Executive Summary

This plan details the implementation of a comprehensive **multi-tenant client portal** for Salesmod, enabling lenders, borrowers, investors, AMCs, and other stakeholders to access appraisal orders, reports, and property data through role-based dashboards.

### Key Objectives

1. **Multi-tenant authentication** with role-based access using Supabase Auth + RLS
2. **Client dashboards** with order visibility, document access, and real-time updates
3. **Borrower sub-logins** with restricted, lender-authorized access
4. **USPAP compliance** with proper audit trails and confidentiality controls
5. **Third-party integrations** (Zillow, MLS) for enhanced property insights
6. **Production-ready** with 80% test coverage and security best practices

---

## 1. Multi-Tenant Authentication & Role Management

**Goal:** Implement secure authentication supporting multiple tenant types (lenders, borrowers, investors, AMCs) with appropriate role-based access.

### Current State

✅ **Already Implemented:**
- Supabase Auth integration (`/app/login/page.tsx`)
- Basic sign-in/sign-up flow
- `profiles` table extending `auth.users`
- RBAC system (`roles`, `permissions`, `role_permissions` tables)
- RLS policies on core tables
- Party roles system (`party_roles` table) with 40+ role types

### What's Needed

🔨 **To Implement:**
- Tenant isolation strategy (multi-org support)
- Enhanced registration flow with tenant selection
- Role assignment during onboarding
- MFA configuration endpoints
- Password reset flow
- Email verification handling
- Session management improvements

### Implementation Tasks

:::task-stub{title="Enhance authentication with multi-tenant support"}

**Database Changes:**
```sql
-- Add tenant/org support to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS tenant_type TEXT CHECK (tenant_type IN
    ('lender', 'borrower', 'investor', 'amc', 'attorney', 'accountant', 'internal')
  );

-- Create tenants table for multi-org support
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for tenant isolation
CREATE POLICY "Users can only see their tenant data"
  ON public.profiles FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
```

**API Routes:**
- `src/app/api/auth/register/route.ts` - Enhanced registration with tenant creation
- `src/app/api/auth/mfa/setup/route.ts` - MFA enrollment
- `src/app/api/auth/mfa/verify/route.ts` - MFA verification
- `src/app/api/auth/reset-password/route.ts` - Password reset request
- `src/app/api/auth/verify-email/route.ts` - Email verification handler

**UI Components:**
- `src/components/auth/RegisterForm.tsx` - Multi-step registration with tenant type selection
- `src/components/auth/MFASetup.tsx` - QR code + backup codes
- `src/components/auth/ResetPasswordForm.tsx` - Password reset UI
- `src/app/login/page.tsx` - Update with tenant-aware messaging

**Validation Schemas:**
- `src/lib/validations/auth.ts` - Zod schemas for registration, login, MFA

**Testing:**
- Unit tests for auth validation schemas
- Integration tests for auth API routes (success + error cases)
- E2E tests for registration → email verification → login flow
- E2E tests for MFA enrollment and login
- Test tenant isolation (user from tenant A cannot see tenant B data)

**Acceptance Criteria:**
- [ ] User can register and select tenant type (lender/borrower/investor/AMC)
- [ ] Email verification required before login
- [ ] MFA optional but available for all users
- [ ] Password reset flow working end-to-end
- [ ] RLS policies enforce tenant isolation
- [ ] All tests passing with 80%+ coverage
:::

---

## 2. Client Dashboard & Open Order Visibility

**Goal:** Provide dashboards showing open orders with status summaries, filters, real-time updates, and quick access to order details.

### Current State

✅ **Already Implemented:**
- Orders table with comprehensive fields
- Order status tracking (new, assigned, in_progress, completed, etc.)
- Properties linked to orders (`property_id` foreign key)
- Property units support
- Party roles on orders
- Basic order list page at `/app/(app)/orders/page.tsx`

### What's Needed

🔨 **To Implement:**
- Client-scoped order views (filter by `client_id`)
- Real-time order updates via Supabase Realtime
- Advanced filtering (status, date range, priority, property type)
- Search functionality
- Export capabilities
- Saved filter presets
- Order summary cards with key metrics

### Implementation Tasks

:::task-stub{title="Build client dashboard for open orders"}

**Database Changes:**
```sql
-- Add indexes for client dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_client_status
  ON public.orders(client_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_client_due_date
  ON public.orders(client_id, due_date) WHERE status NOT IN ('completed', 'cancelled');

-- Create view for client order summaries
CREATE OR REPLACE VIEW public.client_order_summary AS
SELECT
  client_id,
  COUNT(*) FILTER (WHERE status = 'new') as new_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue_count,
  COUNT(*) as total_orders
FROM public.orders
GROUP BY client_id;
```

**API Routes:**
- `src/app/api/clients/[clientId]/orders/route.ts` - GET orders for client with filters
- `src/app/api/clients/[clientId]/dashboard/route.ts` - GET dashboard summary stats
- `src/app/api/clients/[clientId]/orders/export/route.ts` - Export orders as CSV

**Pages:**
- `src/app/(app)/clients/[clientId]/dashboard/page.tsx` - Client dashboard landing page
- `src/app/(app)/clients/[clientId]/orders/page.tsx` - Client-scoped order list

**Components:**
- `src/components/clients/ClientDashboard.tsx` - Dashboard container with summary cards
- `src/components/clients/OrderSummaryCard.tsx` - Stat cards (new, in-progress, overdue)
- `src/components/clients/ClientOrderList.tsx` - Filterable order table with real-time updates
- `src/components/clients/OrderFilters.tsx` - Filter controls (status, date, priority)
- `src/components/clients/OrderSearch.tsx` - Search by order number, address, borrower
- `src/components/shared/ExportButton.tsx` - Export functionality

**Hooks:**
- `src/hooks/use-client-orders.ts` - React Query hook with Supabase Realtime subscription
- `src/hooks/use-client-dashboard.ts` - Dashboard summary data

**Validation:**
- `src/lib/validations/orders.ts` - Filter validation schema

**Testing:**
- Unit tests for filter validation
- Integration tests for client orders API (pagination, filters, search)
- Integration tests for dashboard summary calculations
- E2E tests for dashboard load → filter → search → view order
- E2E tests for real-time order updates (simulate order status change)
- Test RLS: client A cannot see client B's orders

**Acceptance Criteria:**
- [ ] Client dashboard shows summary cards (new, in-progress, overdue counts)
- [ ] Order list supports pagination (20 per page)
- [ ] Filters work: status, date range, priority, property type
- [ ] Search works: order number, property address, borrower name
- [ ] Real-time updates: new orders appear without refresh
- [ ] Export to CSV includes all filtered results
- [ ] Performance: dashboard loads in <2s with 1000+ orders
- [ ] All tests passing with 80%+ coverage
:::

---

## 3. Order Detail Page with Property Map & Documents

**Goal:** Display comprehensive order details including property map, uploaded documents, workflow timeline, and comparable properties.

### Current State

✅ **Already Implemented:**
- Order detail page at `/app/(app)/orders/[id]/page.tsx`
- Properties with lat/lng coordinates
- Property units with prior work tracking (USPAP compliance)
- Activity tracking system
- Basic document storage setup

### What's Needed

🔨 **To Implement:**
- Interactive property map (Google Maps or Mapbox)
- Document management UI (upload, download, preview)
- Order timeline component
- Comparable properties display
- Adjustment documentation (USPAP requirement)
- Report version history
- Borrower/lender notes section

### Implementation Tasks

:::task-stub{title="Develop order detail view with map and document handling"}

**Database Changes:**
```sql
-- Documents table for order attachments
CREATE TABLE IF NOT EXISTS public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  is_public_to_borrower BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_documents_order ON public.order_documents(order_id);

-- Comparables table
CREATE TABLE IF NOT EXISTS public.comparables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  sale_date DATE,
  sale_price DECIMAL(12,2),
  distance_miles DECIMAL(5,2),
  gla_sqft INTEGER,
  adjustments JSONB, -- { "location": -5000, "condition": 2000, ... }
  total_adjustment DECIMAL(12,2),
  adjusted_value DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comparables_order ON public.comparables(order_id);

-- RLS policies
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their orders"
  ON public.order_documents FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE org_id = auth.uid() OR client_id IN (
        SELECT id FROM public.clients WHERE org_id = auth.uid()
      )
    )
  );
```

**API Routes:**
- `src/app/api/orders/[orderId]/route.ts` - GET order details with populated relations
- `src/app/api/orders/[orderId]/documents/route.ts` - GET/POST documents
- `src/app/api/orders/[orderId]/documents/[docId]/download/route.ts` - Download document
- `src/app/api/orders/[orderId]/comparables/route.ts` - GET/POST comparables
- `src/app/api/orders/[orderId]/timeline/route.ts` - GET activity timeline

**Pages:**
- Update `src/app/(app)/orders/[id]/page.tsx` - Enhanced order detail view

**Components:**
- `src/components/orders/OrderDetailHeader.tsx` - Order summary banner
- `src/components/orders/PropertyMap.tsx` - Interactive map with marker (@vis.gl/react-google-maps)
- `src/components/orders/DocumentManager.tsx` - Upload/download/delete documents
- `src/components/orders/DocumentPreview.tsx` - PDF/image preview modal
- `src/components/orders/OrderTimeline.tsx` - Activity history with icons
- `src/components/orders/ComparablesTable.tsx` - Comps with adjustments breakdown
- `src/components/orders/AdjustmentCalculator.tsx` - USPAP-compliant adjustment input
- `src/components/orders/NotesSection.tsx` - Borrower/lender notes with timestamps

**Hooks:**
- `src/hooks/use-order-detail.ts` - Order data with relations
- `src/hooks/use-order-documents.ts` - Document CRUD operations
- `src/hooks/use-order-timeline.ts` - Activity history

**Services:**
- `src/lib/storage/documents.ts` - Supabase Storage wrapper for uploads/downloads

**Testing:**
- Unit tests for adjustment calculations
- Integration tests for document upload → storage → metadata save
- Integration tests for document download with access control
- E2E tests for order detail page load → view map → upload document → view timeline
- E2E tests for comparables CRUD
- Test RLS: borrower can only see documents marked `is_public_to_borrower = true`
- Test file upload validation (file type, size limits)

**Acceptance Criteria:**
- [ ] Order detail page shows all order metadata
- [ ] Property map displays property location with marker
- [ ] Document upload works for PDF, images (max 10MB)
- [ ] Document download enforces access control
- [ ] Timeline shows all activities in chronological order
- [ ] Comparables table shows adjustments and adjusted values
- [ ] USPAP: all adjustments documented with justification
- [ ] Performance: page loads in <3s with 50+ documents
- [ ] All tests passing with 80%+ coverage
:::

---

## 4. Zillow & MLS Data Integrations

**Goal:** Surface property valuation insights by pulling Zillow Zestimates and MLS data, merging with proprietary appraisal data.

### Current State

✅ **Already Implemented:**
- Properties table with GLA, lot size, year built
- Geocoding support

### What's Needed

🔨 **To Implement:**
- Zillow API integration (or RapidAPI Zillow)
- MLS data feed integration (varies by market)
- Data normalization layer
- Caching strategy (avoid rate limits)
- Fallback handling when APIs unavailable
- Data source attribution (USPAP requirement)

### Implementation Tasks

:::task-stub{title="Integrate Zillow and MLS data feeds"}

**Environment Setup:**
```env
# .env.local
ZILLOW_API_KEY=your_key_here
MLS_API_KEY=your_key_here
MLS_API_ENDPOINT=https://api.mls-provider.com
```

**Database Changes:**
```sql
-- External data cache
CREATE TABLE IF NOT EXISTS public.property_external_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL, -- 'zillow', 'mls', 'attom'
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(property_id, source)
);

CREATE INDEX idx_property_external_data_property
  ON public.property_external_data(property_id);

CREATE INDEX idx_property_external_data_expires
  ON public.property_external_data(expires_at);
```

**API Routes:**
- `src/app/api/properties/[propertyId]/external-data/route.ts` - GET cached or fresh external data
- `src/app/api/integrations/zillow/estimate/route.ts` - Fetch Zillow Zestimate
- `src/app/api/integrations/mls/property/route.ts` - Fetch MLS data

**Services:**
- `src/lib/integrations/zillow/client.ts` - Zillow API client with retry logic
- `src/lib/integrations/mls/client.ts` - MLS API client
- `src/lib/integrations/cache.ts` - Caching service with TTL

**Components:**
- `src/components/properties/PropertyInsights.tsx` - Valuation widget container
- `src/components/properties/ZillowEstimate.tsx` - Zestimate display with range
- `src/components/properties/MLSData.tsx` - MLS status, days on market, list price
- `src/components/properties/DataSourceAttribution.tsx` - USPAP-compliant source citations

**Utilities:**
- `src/lib/integrations/normalizers/zillow.ts` - Normalize Zillow response
- `src/lib/integrations/normalizers/mls.ts` - Normalize MLS response

**Testing:**
- Unit tests for normalizers
- Integration tests for API clients (use mocked responses)
- Integration tests for caching logic (fetch → cache → serve from cache)
- E2E tests for property insights widget load
- Test rate limiting (simulate API rate limit response)
- Test fallback behavior (API down → show cached data or message)
- Test data source attribution displayed

**Acceptance Criteria:**
- [ ] Zillow Zestimate fetched and displayed with valuation range
- [ ] MLS data shows status, list price, days on market
- [ ] Data cached for 24 hours to avoid rate limits
- [ ] Fallback message shown if API unavailable
- [ ] Data source attribution visible (USPAP compliance)
- [ ] Rate limit handling: exponential backoff + user notification
- [ ] Cost analysis documented (API calls per month)
- [ ] All tests passing with 80%+ coverage
:::

---

## 5. Pre-Order Submission Workflow

**Goal:** Allow clients to submit preliminary orders with property info, documents, and get quick eligibility checks before full appraisal engagement.

### Current State

✅ **Already Implemented:**
- Order creation flow
- Client selection
- Property linking

### What's Needed

🔨 **To Implement:**
- Pre-order state/workflow
- Client-facing submission form
- File upload during submission
- Preliminary validation rules
- Internal review dashboard
- Convert pre-order → full order action

### Implementation Tasks

:::task-stub{title="Create pre-order submission and review workflow"}

**Database Changes:**
```sql
-- Add pre-order status to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_pre_order BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_order_reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS pre_order_reviewed_at TIMESTAMPTZ;

-- Pre-order validation rules
CREATE TABLE IF NOT EXISTS public.pre_order_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  validation_type TEXT NOT NULL, -- 'address_valid', 'client_approved', 'docs_complete'
  is_valid BOOLEAN NOT NULL,
  message TEXT,
  validated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `src/app/api/pre-orders/route.ts` - POST create pre-order
- `src/app/api/pre-orders/[preOrderId]/route.ts` - GET/PATCH pre-order
- `src/app/api/pre-orders/[preOrderId]/validate/route.ts` - Run validation checks
- `src/app/api/pre-orders/[preOrderId]/convert/route.ts` - Convert to full order

**Pages:**
- `src/app/(app)/pre-orders/new/page.tsx` - Client-facing pre-order wizard
- `src/app/(app)/pre-orders/[id]/page.tsx` - Pre-order detail (staff view)
- `src/app/(app)/admin/pre-orders/page.tsx` - Pre-order review dashboard

**Components:**
- `src/components/pre-orders/PreOrderWizard.tsx` - Multi-step form
- `src/components/pre-orders/PropertyInfoStep.tsx` - Address, type, details
- `src/components/pre-orders/BorrowerInfoStep.tsx` - Borrower contact info
- `src/components/pre-orders/DocumentUploadStep.tsx` - Upload supporting docs
- `src/components/pre-orders/ReviewStep.tsx` - Confirm submission
- `src/components/pre-orders/ValidationStatus.tsx` - Show validation results
- `src/components/admin/PreOrderReviewPanel.tsx` - Staff review interface
- `src/components/admin/ConvertToOrderButton.tsx` - Approve + convert action

**Validation Logic:**
- `src/lib/validations/pre-order.ts` - Zod schema for pre-order submission
- `src/lib/pre-orders/validators.ts` - Business logic validators

**Testing:**
- Unit tests for validation rules
- Integration tests for pre-order creation → validation → review → convert
- E2E tests for wizard flow (fill all steps → submit → success)
- E2E tests for staff review dashboard → approve → convert
- Test document upload during pre-order submission
- Test validation failure scenarios

**Acceptance Criteria:**
- [ ] Client can submit pre-order with property + borrower + docs
- [ ] Wizard validates each step before proceeding
- [ ] Pre-order runs eligibility checks (address valid, client approved)
- [ ] Staff see pending pre-orders in review dashboard
- [ ] Staff can approve and convert pre-order → full order
- [ ] Client notified when pre-order approved/rejected
- [ ] All tests passing with 80%+ coverage
:::

---

## 6. Borrower Sub-Login Access

**Goal:** Enable lender-authorized borrower logins to view approved report documents and limited order status (USPAP compliant).

### Current State

✅ **Already Implemented:**
- Auth system
- Orders with borrower contact info
- RLS policies

### What's Needed

🔨 **To Implement:**
- Borrower sub-accounts (linked to orders)
- Lender authorization workflow
- Borrower portal with restricted view
- Audit logging for report access
- Time-limited access tokens
- Watermarked report PDFs

### Implementation Tasks

:::task-stub{title="Implement borrower sub-login and authorization"}

**Database Changes:**
```sql
-- Borrower access grants
CREATE TABLE IF NOT EXISTS public.borrower_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  borrower_email TEXT NOT NULL,
  access_token UUID DEFAULT gen_random_uuid(),
  granted_by UUID REFERENCES public.profiles(id) NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(order_id, borrower_email)
);

-- Borrower access log (USPAP audit trail)
CREATE TABLE IF NOT EXISTS public.borrower_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_access_id UUID REFERENCES public.borrower_access(id) NOT NULL,
  action TEXT NOT NULL, -- 'login', 'view_order', 'download_report'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_borrower_access_log_access_id
  ON public.borrower_access_log(borrower_access_id);
```

**API Routes:**
- `src/app/api/orders/[orderId]/borrower-access/route.ts` - POST grant access (lender only)
- `src/app/api/borrower/auth/login/route.ts` - Borrower login with access token
- `src/app/api/borrower/orders/[orderId]/route.ts` - GET order details (restricted)
- `src/app/api/borrower/orders/[orderId]/report/route.ts` - Download report (watermarked)

**Pages:**
- `src/app/borrower/login/page.tsx` - Borrower login (email + access token)
- `src/app/borrower/orders/[orderId]/page.tsx` - Borrower order view

**Components:**
- `src/components/orders/BorrowerAccessPanel.tsx` - Lender UI to grant access
- `src/components/borrower/BorrowerOrderView.tsx` - Restricted order details
- `src/components/borrower/ReportDownload.tsx` - Download with watermark notice

**Services:**
- `src/lib/borrower/access-control.ts` - Check borrower permissions
- `src/lib/borrower/audit-logger.ts` - Log borrower actions
- `src/lib/pdf/watermark.ts` - Add watermark to PDFs

**Middleware:**
- `src/middleware.ts` - Add borrower auth check for `/borrower/*` routes

**Testing:**
- Unit tests for access control logic
- Integration tests for access grant → borrower login → view order
- Integration tests for audit logging (each action logged)
- E2E tests for lender grants access → borrower logs in → downloads report
- Test access expiration (expired token cannot login)
- Test watermarked PDF generation
- Test RLS: borrower can only see authorized orders

**Acceptance Criteria:**
- [ ] Lender can invite borrower via email
- [ ] Borrower receives email with access link (token)
- [ ] Borrower can login and view authorized order only
- [ ] Borrower can download report (watermarked)
- [ ] All borrower actions logged with IP, timestamp, user agent
- [ ] Access tokens expire after configurable period (default 30 days)
- [ ] Lender can revoke borrower access at any time
- [ ] All tests passing with 80%+ coverage
:::

---

## 7. Lender & AMC Portal Enhancements

**Goal:** Design lender portal with bulk order management, report retrieval, and future AMC white-label customization.

### Current State

✅ **Already Implemented:**
- Client management
- Order management
- Party roles (AMC contact types)

### What's Needed

🔨 **To Implement:**
- Bulk order actions (assign, update status, export)
- AMC theming/branding configuration
- Custom SLA tracking per AMC
- Automated report delivery
- White-label configuration

### Implementation Tasks

:::task-stub{title="Develop lender/AMC portal features"}

**Database Changes:**
```sql
-- AMC/Lender settings
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{
    "primaryColor": "#3b82f6",
    "logo": null,
    "companyName": null
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS sla_settings JSONB DEFAULT '{
    "standard_turnaround_days": 7,
    "rush_turnaround_days": 3,
    "notification_before_due_hours": 24
  }'::jsonb;

-- Bulk actions log
CREATE TABLE IF NOT EXISTS public.bulk_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'bulk_assign', 'bulk_status_update', 'bulk_export'
  performed_by UUID REFERENCES public.profiles(id) NOT NULL,
  order_ids UUID[] NOT NULL,
  parameters JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `src/app/api/lender/orders/bulk-assign/route.ts` - POST bulk assign orders
- `src/app/api/lender/orders/bulk-export/route.ts` - POST export multiple orders
- `src/app/api/lender/reports/batch-download/route.ts` - POST download multiple reports
- `src/app/api/tenants/[tenantId]/theme/route.ts` - GET/PATCH theme settings
- `src/app/api/tenants/[tenantId]/sla/route.ts` - GET/PATCH SLA settings

**Pages:**
- `src/app/(app)/lender/orders/page.tsx` - Lender dashboard with bulk actions
- `src/app/(app)/lender/reports/page.tsx` - Report retrieval center
- `src/app/(app)/admin/tenants/[tenantId]/settings/page.tsx` - AMC theme configuration

**Components:**
- `src/components/lender/BulkActionToolbar.tsx` - Checkbox selection + bulk actions
- `src/components/lender/ReportBatchDownload.tsx` - Multi-report download
- `src/components/admin/ThemeConfigurator.tsx` - Color picker, logo upload
- `src/components/admin/SLASettings.tsx` - Configure turnaround times

**Theme System:**
- `src/lib/theme/amc-theme-provider.tsx` - Apply tenant theme
- `src/lib/theme/theme-utils.ts` - Load theme from tenant settings

**Testing:**
- Unit tests for bulk action logic
- Integration tests for bulk assign (assign 100 orders at once)
- Integration tests for batch export (export 500 orders → CSV)
- E2E tests for lender dashboard → select orders → bulk assign → verify
- E2E tests for theme configuration → save → verify applied
- Test SLA notifications trigger correctly

**Acceptance Criteria:**
- [ ] Lender can select multiple orders and bulk assign
- [ ] Bulk export generates CSV with all selected orders
- [ ] Batch report download creates ZIP file
- [ ] AMC theme settings apply (logo, colors) throughout portal
- [ ] SLA settings configurable per tenant
- [ ] SLA notifications sent before deadline
- [ ] All tests passing with 80%+ coverage
:::

---

## 8. Investor / Accountant / Attorney Profiles

**Goal:** Support additional professional client roles with tailored dashboards and permissions.

### Current State

✅ **Already Implemented:**
- Party roles table with investor, accountant, attorney roles
- RBAC system

### What's Needed

🔨 **To Implement:**
- Role-specific dashboard layouts
- Feature toggles per role
- Custom analytics per role
- Enhanced onboarding flows

### Implementation Tasks

:::task-stub{title="Support additional professional client roles"}

**Database Changes:**
```sql
-- Role-specific features
CREATE TABLE IF NOT EXISTS public.role_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT REFERENCES public.party_roles(code) NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB,
  UNIQUE(role_code, feature_key)
);

-- Example seed data
INSERT INTO public.role_features (role_code, feature_key, is_enabled, config) VALUES
  ('investor', 'portfolio_analytics', true, '{"show_roi": true}'),
  ('accountant', 'financial_reports', true, '{"export_formats": ["csv", "xlsx"]}'),
  ('attorney', 'legal_documents', true, '{"templates": ["deed", "contract"]}')
ON CONFLICT DO NOTHING;
```

**Services:**
- `src/lib/roles/feature-flags.ts` - Check if role has feature access
- `src/lib/analytics/role-specific-kpis.ts` - Calculate KPIs by role

**Components:**
- `src/components/dashboard/RoleDashboard.tsx` - Conditional rendering by role
- `src/components/dashboard/InvestorDashboard.tsx` - Portfolio analytics
- `src/components/dashboard/AccountantDashboard.tsx` - Financial reports
- `src/components/dashboard/AttorneyDashboard.tsx` - Legal document access

**API Routes:**
- `src/app/api/analytics/investor/portfolio/route.ts` - Investor portfolio stats
- `src/app/api/analytics/accountant/financials/route.ts` - Accounting reports
- `src/app/api/analytics/attorney/documents/route.ts` - Legal document list

**Testing:**
- Unit tests for feature flag logic
- Integration tests for role-specific analytics
- E2E tests for investor dashboard → view portfolio → export
- Test RBAC: attorney cannot access investor features

**Acceptance Criteria:**
- [ ] Investor sees portfolio analytics dashboard
- [ ] Accountant sees financial reports with export options
- [ ] Attorney sees legal document management
- [ ] Feature flags correctly restrict access by role
- [ ] Onboarding collects role-specific data
- [ ] All tests passing with 80%+ coverage
:::

---

## 9. Infrastructure & Security

**Goal:** Implement production-ready infrastructure: storage, monitoring, rate limiting, compliance.

### Current State

✅ **Already Implemented:**
- Supabase for database + auth + storage
- Next.js deployment on Vercel/Firebase
- Basic RLS policies

### What's Needed

🔨 **To Implement:**
- Supabase Storage policies
- Rate limiting on API routes
- Centralized error monitoring
- Backup/disaster recovery plan
- GDPR data retention policies
- Security headers
- DDoS protection

### Implementation Tasks

:::task-stub{title="Set up infrastructure and security layers"}

**Supabase Storage:**
```sql
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('order-documents', 'order-documents', false),
  ('reports', 'reports', false),
  ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload order documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'order-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view their order documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'order-documents' AND
    auth.uid() IS NOT NULL
  );
```

**Rate Limiting:**
- `src/lib/rate-limit/upstash.ts` - Upstash Redis rate limiter
- `src/middleware.ts` - Apply rate limits (10 req/min per IP on auth routes)

**Monitoring:**
- Integrate Sentry for error tracking
- Set up Vercel Analytics
- Configure Supabase logging

**Security Headers:**
```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
];
```

**Documentation:**
- `docs/security/compliance.md` - USPAP, GDPR, SOC 2 controls
- `docs/security/incident-response.md` - Security incident playbook
- `docs/operations/backup-recovery.md` - Backup procedures

**Testing:**
- Security tests for XSS, SQL injection, CSRF
- Rate limit tests (simulate 100 req/sec)
- Test storage access control (unauthorized access fails)
- Penetration testing (hire external firm or use OWASP ZAP)

**Acceptance Criteria:**
- [ ] Storage buckets configured with RLS policies
- [ ] Rate limiting prevents brute force attacks
- [ ] Security headers configured
- [ ] Sentry captures and reports errors
- [ ] Backup plan documented and tested
- [ ] GDPR data retention policy implemented
- [ ] All security tests passing
:::

---

## 10. Product & Operational Documentation

**Goal:** Document roadmap, user stories, SLAs, and support processes for launch and operations.

### Implementation Tasks

:::task-stub{title="Document product roadmap and operational playbooks"}

**Documentation Files:**
- `docs/roadmap.md` - Phased rollout plan (MVP → Phase 2 → Phase 3)
- `docs/user-stories.md` - User stories with acceptance criteria
- `docs/operations/support.md` - Support escalation process
- `docs/operations/slas.md` - Service level agreements
- `docs/training/lender-portal-guide.md` - Lender user guide
- `docs/training/borrower-access-guide.md` - Borrower user guide
- `docs/training/admin-guide.md` - System admin guide

**Runbooks:**
- `docs/runbooks/incident-response.md` - Handle production incidents
- `docs/runbooks/deployment.md` - Deployment checklist
- `docs/runbooks/database-maintenance.md` - Database backup/restore

**User Onboarding:**
- In-app tooltips for first-time users
- Video tutorials for key workflows
- Knowledge base articles

**Testing:**
- Review all docs for accuracy
- Validate runbooks by executing procedures
- User testing with external beta users

**Acceptance Criteria:**
- [ ] Roadmap documents MVP, Phase 2, Phase 3 features
- [ ] User stories cover all 10 functional areas
- [ ] Support playbook defines SLAs and escalation
- [ ] Training materials available for all user types
- [ ] Runbooks tested and validated
:::

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **State Management** | React Query (@tanstack/react-query), Zustand |
| **Forms** | React Hook Form, Zod validation |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (JWT, RLS) |
| **Storage** | Supabase Storage |
| **Real-time** | Supabase Realtime |
| **API** | Next.js API Routes |
| **Deployment** | Vercel / Firebase App Hosting |
| **Monitoring** | Sentry, Vercel Analytics |
| **Maps** | @vis.gl/react-google-maps |
| **External APIs** | Zillow, MLS providers |

---

## File Structure (Corrected)

```
src/
├── app/
│   ├── (app)/                      # Authenticated app routes
│   │   ├── clients/
│   │   │   └── [clientId]/
│   │   │       ├── dashboard/       # Client dashboard
│   │   │       └── orders/          # Client-scoped orders
│   │   ├── orders/
│   │   │   ├── [id]/               # Order detail
│   │   │   └── page.tsx            # Order list
│   │   ├── pre-orders/
│   │   │   ├── new/                # Pre-order wizard
│   │   │   └── [id]/               # Pre-order detail
│   │   ├── lender/
│   │   │   ├── orders/             # Lender dashboard
│   │   │   └── reports/            # Report center
│   │   └── borrower/
│   │       └── orders/[id]/        # Borrower portal
│   ├── (admin)/                    # Admin routes
│   │   └── pre-orders/             # Pre-order review
│   ├── api/                        # API routes
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── mfa/
│   │   │   └── reset-password/route.ts
│   │   ├── clients/[clientId]/
│   │   │   ├── orders/route.ts
│   │   │   └── dashboard/route.ts
│   │   ├── orders/[orderId]/
│   │   │   ├── documents/route.ts
│   │   │   ├── comparables/route.ts
│   │   │   └── borrower-access/route.ts
│   │   ├── pre-orders/route.ts
│   │   ├── borrower/
│   │   │   └── auth/login/route.ts
│   │   ├── lender/
│   │   │   └── orders/bulk-assign/route.ts
│   │   ├── integrations/
│   │   │   ├── zillow/estimate/route.ts
│   │   │   └── mls/property/route.ts
│   │   └── tenants/[tenantId]/
│   │       ├── theme/route.ts
│   │       └── sla/route.ts
│   └── login/
│       └── page.tsx                # Auth page
├── components/
│   ├── auth/                       # Auth components
│   ├── clients/                    # Client components
│   ├── orders/                     # Order components
│   ├── properties/                 # Property components
│   ├── pre-orders/                 # Pre-order components
│   ├── borrower/                   # Borrower components
│   ├── lender/                     # Lender components
│   ├── admin/                      # Admin components
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase
│   │   ├── server.ts               # Server-side Supabase
│   │   └── middleware.ts           # Auth middleware
│   ├── integrations/
│   │   ├── zillow/client.ts
│   │   ├── mls/client.ts
│   │   └── cache.ts
│   ├── validations/                # Zod schemas
│   ├── storage/                    # Storage utilities
│   ├── theme/                      # Theme system
│   └── rate-limit/                 # Rate limiting
├── hooks/                          # React hooks
└── middleware.ts                   # Next.js middleware

supabase/
└── migrations/                     # SQL migrations
```

---

## USPAP Compliance Considerations

Throughout implementation, ensure:

1. **Audit Trails:** All document access, report downloads, and data modifications logged
2. **Data Attribution:** External data sources (Zillow, MLS) clearly cited
3. **Confidentiality:** Borrower access restricted to lender-authorized content only
4. **Prior Work Disclosure:** Property units track prior appraisals (3-year lookback)
5. **Adjustment Documentation:** All comparable adjustments documented with justification
6. **Chain of Custody:** Document version history maintained
7. **Independence:** Appraiser assignment free from client influence (admin-only)

---

## Next Steps

1. ✅ **Plan Approved** - This document
2. 📋 **Review Phased Roadmap** - Prioritize MVP features
3. 📋 **Review Task Stubs** - Detailed implementation guides with testing
4. 🛠️ **Begin Phase 1 Implementation** - Start with foundational features

---

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Author:** Claude (AI Assistant)
