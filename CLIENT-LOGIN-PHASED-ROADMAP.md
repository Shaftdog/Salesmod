# Client Login Module - Phased Implementation Roadmap

**Project:** Salesmod Client Portal
**Document Version:** 1.0
**Last Updated:** 2025-11-09

---

## Overview

This roadmap breaks the client login module into **3 phases** with clear dependencies, timelines, and success criteria. Each phase delivers incremental value while building toward the complete vision.

### Phase Summary

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|-----------------|
| **Phase 1 (MVP)** | Core Authentication & Client Dashboard | 4-6 weeks | Multi-tenant auth, client dashboard, order details, borrower access |
| **Phase 2** | Integrations & Pre-Orders | 3-4 weeks | Zillow/MLS integration, pre-order workflow |
| **Phase 3** | Advanced Features & Scale | 3-4 weeks | AMC portals, role-specific features, advanced analytics |

**Total Timeline:** 10-14 weeks (2.5-3.5 months)

---

## Phase 1: MVP - Core Authentication & Client Portal

**Goal:** Launch minimum viable client portal enabling lenders to view orders and authorize borrower access.

**Duration:** 4-6 weeks
**Priority:** P0 (Must Have)
**Target Launch:** End of Month 1

### Features Included

#### 1.1 Multi-Tenant Authentication ✅
- **Deliverables:**
  - Enhanced registration with tenant creation
  - Email verification flow
  - Password reset functionality
  - MFA setup (optional)
  - Tenant isolation via RLS policies

- **Database Changes:**
  - Add `tenants` table
  - Add `tenant_id`, `tenant_type` to `profiles`
  - RLS policies for tenant data isolation

- **API Routes:**
  - `POST /api/auth/register`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/mfa/setup`
  - `POST /api/auth/mfa/verify`

- **Testing Requirements:**
  - ✅ Unit: Auth validation schemas
  - ✅ Integration: Registration → email verification → login
  - ✅ Integration: MFA enrollment and login
  - ✅ E2E: Complete user journey from signup to dashboard
  - ✅ Security: Tenant isolation (user A cannot access tenant B)

- **Success Criteria:**
  - [ ] User can register with tenant type selection
  - [ ] Email verification required
  - [ ] MFA working (optional for users)
  - [ ] RLS enforces tenant boundaries
  - [ ] 80%+ test coverage

**Dependencies:** None (foundational)

---

#### 1.2 Client Dashboard & Order List ✅
- **Deliverables:**
  - Client-scoped dashboard with summary stats
  - Filterable order list with real-time updates
  - Search functionality
  - Export to CSV

- **Database Changes:**
  - `client_order_summary` view
  - Indexes on `orders(client_id, status)`

- **API Routes:**
  - `GET /api/clients/[clientId]/dashboard`
  - `GET /api/clients/[clientId]/orders`
  - `POST /api/clients/[clientId]/orders/export`

- **Components:**
  - `ClientDashboard.tsx` - Summary cards
  - `ClientOrderList.tsx` - Table with filters
  - `OrderFilters.tsx` - Status, date, priority filters
  - `OrderSearch.tsx` - Search input

- **Testing Requirements:**
  - ✅ Unit: Filter validation
  - ✅ Integration: Dashboard stats calculation
  - ✅ Integration: Order list with pagination/filters
  - ✅ E2E: Dashboard load → filter → search → export
  - ✅ E2E: Real-time order updates

- **Success Criteria:**
  - [ ] Dashboard shows new/in-progress/overdue counts
  - [ ] Order list supports pagination (20/page)
  - [ ] Filters and search working
  - [ ] Real-time updates via Supabase Realtime
  - [ ] Export generates CSV
  - [ ] Page loads in <2s with 1000+ orders

**Dependencies:** 1.1 (needs auth)

---

#### 1.3 Order Detail Page ✅
- **Deliverables:**
  - Comprehensive order detail view
  - Interactive property map
  - Document upload/download
  - Order activity timeline
  - Comparables table with adjustments

- **Database Changes:**
  - `order_documents` table
  - `comparables` table
  - Storage policies for order documents

- **API Routes:**
  - `GET /api/orders/[orderId]`
  - `GET/POST /api/orders/[orderId]/documents`
  - `GET /api/orders/[orderId]/documents/[docId]/download`
  - `GET/POST /api/orders/[orderId]/comparables`
  - `GET /api/orders/[orderId]/timeline`

- **Components:**
  - `OrderDetailHeader.tsx`
  - `PropertyMap.tsx` - Google Maps integration
  - `DocumentManager.tsx`
  - `OrderTimeline.tsx`
  - `ComparablesTable.tsx`
  - `AdjustmentCalculator.tsx` (USPAP)

- **Testing Requirements:**
  - ✅ Unit: Adjustment calculations
  - ✅ Integration: Document upload → storage → download
  - ✅ Integration: Timeline data aggregation
  - ✅ E2E: Order detail page full journey
  - ✅ E2E: Document upload and access control
  - ✅ Security: RLS on documents

- **Success Criteria:**
  - [ ] Order page shows all metadata
  - [ ] Map displays property location
  - [ ] Document upload/download working
  - [ ] Timeline shows all activities
  - [ ] Comparables with USPAP-compliant adjustments
  - [ ] Page loads in <3s with 50+ documents

**Dependencies:** 1.2 (order list links to details)

---

#### 1.4 Borrower Sub-Login Access ✅
- **Deliverables:**
  - Lender can grant borrower access to orders
  - Borrower login portal
  - Restricted borrower view (approved docs only)
  - Audit logging for all borrower actions
  - Watermarked report downloads

- **Database Changes:**
  - `borrower_access` table
  - `borrower_access_log` table (audit trail)

- **API Routes:**
  - `POST /api/orders/[orderId]/borrower-access`
  - `POST /api/borrower/auth/login`
  - `GET /api/borrower/orders/[orderId]`
  - `GET /api/borrower/orders/[orderId]/report`

- **Pages:**
  - `/app/borrower/login/page.tsx`
  - `/app/borrower/orders/[orderId]/page.tsx`

- **Components:**
  - `BorrowerAccessPanel.tsx` (lender UI)
  - `BorrowerOrderView.tsx`
  - `ReportDownload.tsx` (with watermark)

- **Testing Requirements:**
  - ✅ Integration: Grant access → borrower login → view order
  - ✅ Integration: Audit log entries created
  - ✅ E2E: Full borrower journey
  - ✅ Security: Borrower cannot access unauthorized orders
  - ✅ Security: Watermark on PDF downloads

- **Success Criteria:**
  - [ ] Lender can invite borrower
  - [ ] Borrower receives email with access link
  - [ ] Borrower can view authorized order only
  - [ ] All actions logged (USPAP compliance)
  - [ ] Reports watermarked
  - [ ] Access expires after 30 days (configurable)

**Dependencies:** 1.3 (order detail page)

---

### Phase 1 Testing Plan

**Unit Tests:**
- Auth validation schemas (Zod)
- Filter validation
- Adjustment calculations
- Access control logic

**Integration Tests:**
- Auth flows (register, login, MFA, reset)
- Dashboard data aggregation
- Order CRUD operations
- Document storage operations
- Borrower access grant/revoke
- Audit logging

**E2E Tests:**
- User registration → email verify → login → dashboard
- Client dashboard → filter orders → view detail → upload document
- Lender grants borrower access → borrower logs in → downloads report
- Real-time order updates (simulate status change)

**Security Tests:**
- RLS tenant isolation
- Document access control
- Borrower restricted view
- XSS/SQL injection prevention
- CSRF protection

**Performance Tests:**
- Dashboard with 1000+ orders
- Order detail with 50+ documents
- Export 500+ orders

**Coverage Target:** 80%+ across all test types

---

### Phase 1 Launch Checklist

- [ ] All 4 features implemented and tested
- [ ] Database migrations run on staging
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete:
  - [ ] User guide for lenders
  - [ ] User guide for borrowers
  - [ ] API documentation
- [ ] Staging environment tested by 3+ users
- [ ] Production deployment plan reviewed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured (Sentry)
- [ ] Support team trained

---

## Phase 2: Integrations & Pre-Order Workflow

**Goal:** Enhance portal with external data and streamline order intake.

**Duration:** 3-4 weeks
**Priority:** P1 (Should Have)
**Target Launch:** End of Month 2

### Features Included

#### 2.1 Zillow & MLS Data Integration ✅
- **Deliverables:**
  - Zillow Zestimate integration
  - MLS data feed (status, list price, DOM)
  - Data caching layer (24hr TTL)
  - Fallback handling
  - Data source attribution (USPAP)

- **Database Changes:**
  - `property_external_data` table

- **API Routes:**
  - `GET /api/properties/[propertyId]/external-data`
  - `POST /api/integrations/zillow/estimate`
  - `POST /api/integrations/mls/property`

- **Components:**
  - `PropertyInsights.tsx`
  - `ZillowEstimate.tsx`
  - `MLSData.tsx`
  - `DataSourceAttribution.tsx` (USPAP)

- **Services:**
  - `lib/integrations/zillow/client.ts`
  - `lib/integrations/mls/client.ts`
  - `lib/integrations/cache.ts`

- **Testing Requirements:**
  - ✅ Unit: Normalizers for API responses
  - ✅ Integration: API clients with mocks
  - ✅ Integration: Caching logic
  - ✅ E2E: Property insights widget
  - ✅ Test rate limiting handling
  - ✅ Test fallback when API unavailable

- **Success Criteria:**
  - [ ] Zestimate displayed with range
  - [ ] MLS data shows status/price/DOM
  - [ ] Data cached for 24 hours
  - [ ] Fallback message if API down
  - [ ] Source attribution visible
  - [ ] Cost analysis documented

**Dependencies:** Phase 1 (property detail pages)

---

#### 2.2 Pre-Order Submission Workflow ✅
- **Deliverables:**
  - Client-facing pre-order wizard
  - Document upload during submission
  - Validation rules (address, client approval)
  - Internal review dashboard
  - Convert pre-order → full order

- **Database Changes:**
  - Add `is_pre_order` to `orders`
  - `pre_order_validations` table

- **API Routes:**
  - `POST /api/pre-orders`
  - `GET/PATCH /api/pre-orders/[preOrderId]`
  - `POST /api/pre-orders/[preOrderId]/validate`
  - `POST /api/pre-orders/[preOrderId]/convert`

- **Pages:**
  - `/app/(app)/pre-orders/new/page.tsx` - Wizard
  - `/app/(app)/admin/pre-orders/page.tsx` - Review dashboard

- **Components:**
  - `PreOrderWizard.tsx` - Multi-step form
  - `PropertyInfoStep.tsx`
  - `BorrowerInfoStep.tsx`
  - `DocumentUploadStep.tsx`
  - `ValidationStatus.tsx`
  - `PreOrderReviewPanel.tsx` (admin)
  - `ConvertToOrderButton.tsx`

- **Testing Requirements:**
  - ✅ Unit: Validation rules
  - ✅ Integration: Pre-order creation → validation → convert
  - ✅ E2E: Wizard flow (all steps)
  - ✅ E2E: Admin review → approve → convert

- **Success Criteria:**
  - [ ] Client can submit pre-order
  - [ ] Wizard validates each step
  - [ ] Eligibility checks run automatically
  - [ ] Admin can review and approve
  - [ ] Convert creates full order
  - [ ] Client notified of approval/rejection

**Dependencies:** Phase 1 (order system, auth)

---

### Phase 2 Testing Plan

**Additional Tests:**
- API integration mocking (Zillow, MLS)
- Pre-order wizard validation
- Pre-order conversion logic
- External data normalization

**Coverage Target:** Maintain 80%+

---

### Phase 2 Launch Checklist

- [ ] Zillow and MLS integrations tested
- [ ] API credentials secured (environment variables)
- [ ] Rate limiting configured
- [ ] Pre-order workflow tested end-to-end
- [ ] Cost analysis for API calls completed
- [ ] Training materials updated
- [ ] Beta testing with 5+ clients

---

## Phase 3: Advanced Features & Enterprise Scale

**Goal:** Complete vision with AMC portals, role-specific features, and advanced analytics.

**Duration:** 3-4 weeks
**Priority:** P2 (Nice to Have)
**Target Launch:** End of Month 3

### Features Included

#### 3.1 Lender & AMC Portal Enhancements ✅
- **Deliverables:**
  - Bulk order actions
  - Batch report download
  - AMC white-label theming
  - Custom SLA configuration
  - Automated report delivery

- **Database Changes:**
  - `theme_settings` in `tenants`
  - `sla_settings` in `tenants`
  - `bulk_actions` log table

- **API Routes:**
  - `POST /api/lender/orders/bulk-assign`
  - `POST /api/lender/orders/bulk-export`
  - `POST /api/lender/reports/batch-download`
  - `GET/PATCH /api/tenants/[tenantId]/theme`
  - `GET/PATCH /api/tenants/[tenantId]/sla`

- **Pages:**
  - `/app/(app)/lender/orders/page.tsx`
  - `/app/(app)/lender/reports/page.tsx`
  - `/app/(app)/admin/tenants/[tenantId]/settings/page.tsx`

- **Components:**
  - `BulkActionToolbar.tsx`
  - `ReportBatchDownload.tsx`
  - `ThemeConfigurator.tsx`
  - `SLASettings.tsx`

- **Testing Requirements:**
  - ✅ Integration: Bulk assign 100 orders
  - ✅ Integration: Export 500 orders
  - ✅ E2E: Lender dashboard → bulk assign → verify
  - ✅ E2E: Theme config → save → verify applied

- **Success Criteria:**
  - [ ] Bulk actions working for 100+ orders
  - [ ] Batch export generates CSV
  - [ ] Batch download creates ZIP
  - [ ] AMC theme applies throughout
  - [ ] SLA notifications sent on time

**Dependencies:** Phase 1, Phase 2

---

#### 3.2 Role-Specific Features (Investor/Accountant/Attorney) ✅
- **Deliverables:**
  - Investor portfolio analytics
  - Accountant financial reports
  - Attorney legal document access
  - Feature flags per role

- **Database Changes:**
  - `role_features` table

- **Components:**
  - `InvestorDashboard.tsx`
  - `AccountantDashboard.tsx`
  - `AttorneyDashboard.tsx`

- **API Routes:**
  - `GET /api/analytics/investor/portfolio`
  - `GET /api/analytics/accountant/financials`
  - `GET /api/analytics/attorney/documents`

- **Testing Requirements:**
  - ✅ Unit: Feature flag logic
  - ✅ Integration: Role-specific analytics
  - ✅ E2E: Investor dashboard
  - ✅ Security: RBAC enforcement

- **Success Criteria:**
  - [ ] Investor sees portfolio analytics
  - [ ] Accountant sees financials
  - [ ] Attorney sees legal docs
  - [ ] Feature flags restrict access correctly

**Dependencies:** Phase 1

---

#### 3.3 Infrastructure & Security Hardening ✅
- **Deliverables:**
  - Supabase Storage policies finalized
  - Rate limiting on all public APIs
  - Sentry error monitoring
  - Security headers
  - GDPR compliance documentation
  - Backup/recovery plan

- **Configuration:**
  - Storage RLS policies
  - Rate limits (Upstash Redis)
  - Security headers in `next.config.ts`
  - Sentry integration

- **Documentation:**
  - `docs/security/compliance.md`
  - `docs/operations/backup-recovery.md`
  - `docs/runbooks/incident-response.md`

- **Testing Requirements:**
  - ✅ Security: XSS, SQL injection, CSRF tests
  - ✅ Security: Storage access control
  - ✅ Performance: Rate limit tests (100 req/sec)
  - ✅ Security: Penetration testing (external)

- **Success Criteria:**
  - [ ] All storage policies enforced
  - [ ] Rate limiting prevents abuse
  - [ ] Security headers configured
  - [ ] Sentry capturing errors
  - [ ] Backup tested successfully
  - [ ] GDPR policy documented

**Dependencies:** All previous phases

---

#### 3.4 Operational Documentation ✅
- **Deliverables:**
  - Product roadmap
  - User stories with acceptance criteria
  - Support playbooks
  - SLA documentation
  - Training materials
  - Runbooks

- **Documents:**
  - `docs/roadmap.md`
  - `docs/user-stories.md`
  - `docs/operations/support.md`
  - `docs/operations/slas.md`
  - `docs/training/lender-portal-guide.md`
  - `docs/training/borrower-access-guide.md`
  - `docs/runbooks/deployment.md`

- **Testing Requirements:**
  - ✅ Review all docs for accuracy
  - ✅ Validate runbooks by execution
  - ✅ User testing with beta users

- **Success Criteria:**
  - [ ] All documentation complete
  - [ ] Runbooks validated
  - [ ] Training materials tested
  - [ ] Support team onboarded

**Dependencies:** All features completed

---

### Phase 3 Testing Plan

**Additional Tests:**
- Bulk operations (assign, export)
- Theme application
- Role-based feature access
- Security hardening validation
- Load testing (1000 concurrent users)

**Coverage Target:** Maintain 80%+

---

### Phase 3 Launch Checklist

- [ ] All features implemented
- [ ] Security audit passed
- [ ] Load testing completed (1000 users)
- [ ] All documentation finalized
- [ ] Beta testing with 10+ enterprise clients
- [ ] Support team trained
- [ ] Runbooks validated
- [ ] Production deployment successful
- [ ] Monitoring dashboards configured

---

## Cross-Phase Considerations

### 1. Testing Strategy

**Continuous Testing:**
- Unit tests run on every commit (CI)
- Integration tests on every PR
- E2E tests nightly on staging
- Security scans weekly
- Load tests before each phase launch

**Test Environments:**
- **Dev:** Local Supabase instance
- **Staging:** Supabase staging project + Vercel preview
- **Production:** Supabase production + Vercel production

---

### 2. Deployment Strategy

**Phase 1:**
- Feature flags off by default
- Gradual rollout to 10% → 50% → 100%
- Monitor error rates, performance

**Phase 2:**
- Deploy to beta clients first
- Monitor API costs (Zillow, MLS)
- Rollback plan if costs exceed budget

**Phase 3:**
- Enterprise rollout with dedicated support
- White-glove onboarding for AMCs

---

### 3. Monitoring & Observability

**Metrics to Track:**
- Auth success/failure rates
- Page load times (P95)
- API response times
- Error rates (Sentry)
- Real-time connection health
- Storage usage growth
- API call costs (Zillow, MLS)
- User engagement (active users, sessions)

**Alerts:**
- Error rate > 1%
- API response time > 5s
- Auth failures spike
- Storage approaching limits
- External API failures

---

### 4. Documentation & Training

**User Documentation:**
- In-app tooltips and tours
- Video tutorials (Loom)
- Knowledge base articles
- FAQ

**Technical Documentation:**
- API documentation (OpenAPI/Swagger)
- Database schema diagrams
- Architecture diagrams
- Runbooks for common operations

**Training:**
- Live training sessions for key clients
- Recorded webinars
- Office hours for support questions

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **External API costs exceed budget** | Medium | High | Implement aggressive caching, set usage alerts, have kill switch |
| **Performance issues at scale** | Medium | High | Load testing before launch, implement pagination, optimize queries |
| **Security vulnerability discovered** | Low | Critical | Security audits each phase, bug bounty program, rapid patch process |
| **Scope creep delays launch** | High | Medium | Strict phase gates, MVP-first approach, defer P2 features |
| **USPAP compliance gap** | Low | Critical | Legal review before Phase 1 launch, audit trail on all actions |
| **User adoption low** | Medium | High | Beta testing, user feedback loops, iterate on UX |

---

## Success Metrics (KPIs)

### Phase 1
- ✅ 50+ clients onboarded
- ✅ 100+ borrower logins/week
- ✅ <2s average dashboard load time
- ✅ Zero USPAP compliance violations
- ✅ 80%+ test coverage

### Phase 2
- ✅ Pre-orders account for 30%+ of new orders
- ✅ External data available for 90%+ properties
- ✅ <$500/month API costs (Zillow + MLS)

### Phase 3
- ✅ 5+ AMCs with custom themes
- ✅ Bulk actions used by 50%+ lenders
- ✅ Zero security incidents
- ✅ 95% uptime SLA met

---

## Dependencies & Blockers

### External Dependencies
- ✅ Zillow API access (Phase 2)
- ✅ MLS data feed subscription (Phase 2)
- ✅ Google Maps API key (Phase 1)
- ✅ Sentry account (Phase 3)
- ✅ Upstash Redis (Phase 3)

### Internal Dependencies
- ✅ Existing orders, clients, properties data (Phase 1)
- ✅ Supabase project with adequate quota (All phases)
- ✅ Design system (shadcn/ui components) (Phase 1)

---

## Conclusion

This phased approach ensures:
1. **Incremental Value:** Each phase delivers working features
2. **Risk Mitigation:** Test and validate before expanding
3. **Flexibility:** Adjust priorities based on feedback
4. **Quality:** Maintain 80%+ test coverage throughout
5. **Compliance:** USPAP requirements embedded from Phase 1

**Recommended Start:** Phase 1 Feature 1.1 (Multi-Tenant Auth)

---

**Next Document:** [Task Stubs with Testing Requirements](./CLIENT-LOGIN-TASK-STUBS.md)
