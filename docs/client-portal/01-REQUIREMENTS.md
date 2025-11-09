# Client Portal - Requirements

**Single Source of Truth for All Requirements**
**Version:** 2.0
**Last Updated:** 2025-11-09

---

## Document Purpose

This document contains **all functional and non-functional requirements** for the Client Portal project. Other documents (roadmap, tasks) **reference** these requirements rather than duplicating them.

---

## Table of Contents

1. [Functional Requirements](#functional-requirements)
2. [Non-Functional Requirements](#non-functional-requirements)
3. [USPAP Compliance Requirements](#uspap-compliance-requirements)
4. [Security Requirements](#security-requirements)
5. [Testing Requirements](#testing-requirements)
6. [Acceptance Criteria](#acceptance-criteria)

---

## Functional Requirements

### FR-1: Multi-Tenant Authentication {#fr-1}

**Priority:** P0 (Critical)
**Dependencies:** None

#### FR-1.1: User Registration
- User can register with email, password, full name
- User must specify or create a tenant (company)
- User must select tenant type: lender, investor, AMC, attorney, accountant, borrower, internal
- Email verification required before full access
- Registration creates both user profile and tenant record (if new tenant)

#### FR-1.2: User Login
- User can login with email + password
- Support MFA (TOTP) as optional second factor
- Session persists across browser sessions
- Session expires after configurable period (default: 30 days)

#### FR-1.3: Password Management
- User can request password reset via email
- Password reset link expires after 1 hour
- Minimum password requirements: 8 characters, 1 uppercase, 1 number
- User can change password when logged in

#### FR-1.4: Multi-Factor Authentication (MFA)
- User can optionally enroll in TOTP-based MFA
- System generates QR code for authenticator apps
- System provides backup codes (10 codes, single-use)
- User can disable MFA (requires current password)

#### FR-1.5: Tenant Management
- Admin users can invite additional users to their tenant
- Invited users receive email with registration link
- Invited users auto-join the tenant upon registration
- Tenant settings stored in `tenants.settings` JSONB

**Acceptance Criteria:**
- [ ] User can complete registration flow end-to-end
- [ ] Email verification link works and activates account
- [ ] Login with correct credentials succeeds
- [ ] Login with incorrect credentials fails with clear error
- [ ] Password reset email arrives within 2 minutes
- [ ] MFA enrollment generates working QR code
- [ ] MFA login requires both password and code
- [ ] All validation errors display user-friendly messages

---

### FR-2: Client Dashboard {#fr-2}

**Priority:** P0 (Critical)
**Dependencies:** FR-1

#### FR-2.1: Dashboard Overview
- Display summary cards showing:
  - New orders count
  - In-progress orders count
  - Completed orders count (last 30 days)
  - Overdue orders count
  - Average turnaround time (days)
- Cards update in real-time as orders change status
- Clicking card filters order list by that status

#### FR-2.2: Order List
- Display paginated list of orders (20 per page)
- Default sort: Most recent first (ordered_date DESC)
- Show key fields: order number, property address, borrower name, status, due date
- Visual indicators for overdue orders (red badge/border)
- Clicking order navigates to order detail page

#### FR-2.3: Filtering
- Filter by status (new, assigned, in_progress, completed, delivered, cancelled)
- Filter by priority (rush, high, normal, low)
- Filter by date range (ordered_date, due_date, completed_date)
- Filter by property type
- Multiple filters can be combined (AND logic)
- Applied filters shown as removable chips
- "Clear all filters" button resets to default view

#### FR-2.4: Search
- Search across:
  - Order number (exact or partial match)
  - Property address (fuzzy match)
  - Borrower name (fuzzy match)
- Search executes on form submit (not live/debounced)
- Search results highlight matched terms
- "No results" state with suggestions to modify search

#### FR-2.5: Export
- "Export to CSV" button exports all filtered results
- CSV includes all order fields (not just visible columns)
- CSV filename includes client name and timestamp
- Export triggers browser download
- Large exports (>1000 rows) processed asynchronously with email notification

#### FR-2.6: Real-Time Updates
- New orders appear automatically without page refresh
- Status changes update order cards in real-time
- Visual notification (toast) when new order arrives
- Realtime connection status indicator (connected/disconnected)

**Acceptance Criteria:**
- [ ] Dashboard loads in <2 seconds with 1000 orders
- [ ] Summary cards show accurate counts
- [ ] Order list supports pagination
- [ ] Filters work individually and in combination
- [ ] Search returns relevant results
- [ ] Export generates valid CSV file
- [ ] Real-time updates appear within 5 seconds of change
- [ ] No duplicate orders displayed

---

### FR-3: Order Detail Page {#fr-3}

**Priority:** P0 (Critical)
**Dependencies:** FR-2

#### FR-3.1: Order Information
- Display all order metadata:
  - Order number, status, priority, dates
  - Client information
  - Property address with map
  - Borrower details
  - Lender/loan officer details
  - Assigned appraiser
  - Fee information
  - Special instructions

#### FR-3.2: Property Map
- Interactive map showing property location
- Map marker at property coordinates (lat/lng)
- Default zoom level shows property and immediate neighborhood
- Map controls: zoom in/out, fullscreen
- Fallback message if coordinates unavailable

#### FR-3.3: Document Management
- Display list of uploaded documents
- Each document shows: filename, type, size, uploaded by, upload date
- "Upload Document" button opens file picker
- Supported file types: PDF, JPG, PNG, DOCX (max 10MB per file)
- Upload shows progress bar
- Download button for each document
- Delete button for document owner or admin only
- Documents marked `is_public_to_borrower` have visibility indicator

#### FR-3.4: Comparable Properties
- Display table of comparables with:
  - Address, sale date, sale price
  - Distance from subject property
  - GLA (square feet)
  - Adjustments breakdown (location, condition, etc.)
  - Total adjustment
  - Adjusted value
- "Add Comparable" button for appraisers
- Adjustments must include justification text (USPAP requirement)
- Comparables sortable by distance or sale date

#### FR-3.5: Activity Timeline
- Chronological list of all order activities:
  - Order created
  - Status changes
  - Appraiser assigned
  - Documents uploaded
  - Notes added
  - Report delivered
- Each activity shows: timestamp, user, action, details
- Timeline auto-updates in real-time

#### FR-3.6: Notes
- Users can add notes to order
- Notes visible to all tenant users (not borrowers)
- Notes cannot be edited after posting (USPAP audit trail)
- Notes show author, timestamp, content

**Acceptance Criteria:**
- [ ] Page displays all order information accurately
- [ ] Map loads and shows correct property location
- [ ] Document upload succeeds for all supported file types
- [ ] Document download works and sends correct file
- [ ] Comparables table displays all adjustments
- [ ] Timeline shows all activities in order
- [ ] Notes post successfully and appear immediately
- [ ] Page loads in <3 seconds with 50 documents

---

### FR-4: Borrower Sub-Login Access {#fr-4}

**Priority:** P0 (Critical)
**Dependencies:** FR-3

#### FR-4.1: Access Grant (Lender Workflow)
- Lender can grant borrower access from order detail page
- Lender enters borrower email address
- System sends magic link to borrower email
- Magic link valid for 30 days (configurable)
- Lender can revoke access at any time
- Lender can view access log (who accessed, when)

#### FR-4.2: Borrower Login
- Borrower clicks magic link in email
- Link creates temporary session (no password needed)
- Session scoped to specific order only
- Session expires after 30 days or manual revoke

#### FR-4.3: Borrower View Restrictions
- Borrower can view:
  - Order status (high-level only)
  - Property address
  - Documents marked `is_public_to_borrower = true`
- Borrower cannot view:
  - Lender contact information
  - Fee amounts
  - Appraiser details
  - Internal notes
  - Non-public documents

#### FR-4.4: Report Download with Watermark
- Borrower can download final appraisal report (if authorized)
- PDF automatically watermarked with:
  - "Downloaded by [email] on [date]"
  - Watermark on all pages (diagonal, semi-transparent)
- Download triggers audit log entry

#### FR-4.5: Audit Logging
- All borrower actions logged:
  - Login (IP address, user agent, timestamp)
  - Order view
  - Document download
- Logs immutable (cannot be edited or deleted)
- Logs retained for 7 years (USPAP requirement)
- Lender can view borrower access history

**Acceptance Criteria:**
- [ ] Lender can grant borrower access in <30 seconds
- [ ] Borrower receives magic link email within 2 minutes
- [ ] Magic link login creates valid session
- [ ] Borrower view shows only authorized information
- [ ] Document download generates watermarked PDF
- [ ] All actions logged with complete audit trail
- [ ] Revoked access immediately blocks borrower login

---

### FR-5: Pre-Order Submission Workflow {#fr-5}

**Priority:** P1 (Should Have)
**Dependencies:** FR-1, FR-2

#### FR-5.1: Pre-Order Wizard (Client-Facing)
- Multi-step form:
  - Step 1: Property Information (address, type)
  - Step 2: Borrower Information (name, contact)
  - Step 3: Loan Information (loan type, amount - optional)
  - Step 4: Document Upload (supporting docs)
  - Step 5: Review & Submit
- Each step validates before proceeding
- User can navigate back to edit previous steps
- Progress indicator shows current step
- Form saves draft to localStorage (recover on browser close)

#### FR-5.2: Pre-Order Validation
- Automated checks run on submission:
  - Address validation (via geocoding API)
  - Client approval status check
  - Required documents present
- Validation results displayed to user
- Failed validations block submission or show warnings

#### FR-5.3: Internal Review Dashboard
- Staff see pending pre-orders in admin panel
- Pre-orders sortable by submission date
- Pre-order detail page shows all submitted information
- Validation results highlighted (pass/fail/warning)
- "Approve & Convert" button creates full order
- "Reject" button with required rejection reason

#### FR-5.4: Conversion to Full Order
- Approved pre-order converts to standard order
- All pre-order data copied to order
- Order status starts as "new"
- Client notified via email of approval
- Pre-order marked as "converted" (historical record)

**Acceptance Criteria:**
- [ ] Wizard validates each step before proceeding
- [ ] Draft data persists across browser sessions
- [ ] Submission triggers validation checks
- [ ] Staff can view all pending pre-orders
- [ ] Approve & convert creates valid order
- [ ] Client receives approval email within 5 minutes

---

### FR-6: External Data Integration {#fr-6}

**Priority:** P2 (Nice to Have)
**Dependencies:** FR-3
**Status:** ⚠️ Pending feasibility study (Phase 2.0)

#### FR-6.1: Zillow Zestimate
- Fetch Zestimate for property address
- Display current estimate with valuation range
- Cache data for 24 hours (avoid repeat API calls)
- Show data source attribution ("Data provided by Zillow")
- Fallback message if data unavailable

#### FR-6.2: MLS Data
- Fetch MLS listing data for property
- Display: listing status, list price, days on market
- Cache data for 24 hours
- Show data source attribution ("Data provided by [MLS Name]")
- Fallback message if data unavailable

#### FR-6.3: Data Caching
- Store external data in `property_external_data` table
- TTL: 24 hours
- Automatic refresh on cache miss
- Manual refresh button for users

#### FR-6.4: Rate Limiting & Error Handling
- Implement rate limiting (max 100 requests/hour per API)
- Exponential backoff on API errors
- Circuit breaker pattern (stop calls if API down)
- User-friendly error messages
- Monitoring alerts for API failures

**Acceptance Criteria (IF implemented):**
- [ ] Zestimate displays for 90% of properties
- [ ] MLS data displays for target markets
- [ ] Data cached to minimize API costs
- [ ] API costs <$500/month
- [ ] Fallback UX works when APIs unavailable
- [ ] Data source properly attributed (USPAP)

**Note:** Implementation contingent on Phase 2.0 discovery results. See [03-ROADMAP.md](./03-ROADMAP.md#phase-2-0-discovery).

---

### FR-7: AMC Portal Enhancements {#fr-7}

**Priority:** P2 (Nice to Have)
**Dependencies:** FR-1, FR-2

#### FR-7.1: White-Label Theming
- AMC tenant can customize:
  - Primary brand color
  - Company logo (header, login page)
  - Company name override
- Theme settings stored in `tenants.theme_settings` JSONB
- Theme applies to all users in that tenant
- Preview mode shows changes before saving

#### FR-7.2: Custom SLA Configuration
- AMC can configure:
  - Standard turnaround time (days)
  - Rush turnaround time (days)
  - Notification timing (hours before due date)
- SLA settings stored in `tenants.sla_settings` JSONB
- Automated notifications triggered based on SLA

#### FR-7.3: Bulk Order Actions
- Select multiple orders via checkboxes
- Bulk actions available:
  - Assign to appraiser
  - Update status
  - Export to CSV
- Confirmation dialog before bulk action executes
- Progress indicator for large batches
- Summary report after completion

#### FR-7.4: Batch Report Download
- Select multiple completed orders
- "Download Reports" button generates ZIP file
- ZIP contains all final reports (PDFs)
- ZIP filename includes timestamp
- Large batches processed asynchronously

**Acceptance Criteria:**
- [ ] Theme settings apply throughout portal
- [ ] Logo upload supports PNG, JPG (max 2MB)
- [ ] SLA notifications sent on time
- [ ] Bulk assign works for 100+ orders
- [ ] Batch download creates valid ZIP

---

### FR-8: Role-Specific Dashboards {#fr-8}

**Priority:** P2 (Nice to Have)
**Dependencies:** FR-1, FR-2

#### FR-8.1: Investor Dashboard
- Portfolio analytics:
  - Total properties under appraisal
  - Average property value
  - Geographic distribution map
  - Valuation trends chart
- Export portfolio report (PDF or CSV)

#### FR-8.2: Accountant Dashboard
- Financial reports:
  - Total fees by period
  - Outstanding invoices
  - Payment history
- Export financial data (CSV, Excel)

#### FR-8.3: Attorney Dashboard
- Legal document access:
  - Deed copies
  - Title reports
  - Contract uploads
- Document organization by property

#### FR-8.4: Feature Flags
- Role-specific features controlled by `role_features` table
- Features can be enabled/disabled per role
- Graceful degradation if feature disabled

**Acceptance Criteria:**
- [ ] Investor sees portfolio analytics
- [ ] Accountant sees financial reports
- [ ] Attorney sees legal document section
- [ ] Feature flags correctly restrict access

---

## Non-Functional Requirements

### NFR-1: Performance {#nfr-1}

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Dashboard Load Time** | <2 seconds (P95) | With 1000 orders |
| **Order Detail Load Time** | <3 seconds (P95) | With 50 documents |
| **Search Response Time** | <1 second (P95) | 10,000 order database |
| **Real-time Update Latency** | <5 seconds | From event to UI update |
| **Document Upload Speed** | >1MB/second | 10MB file target |
| **API Response Time** | <500ms (P95) | All API routes |

**Testing:** Load tests required before each phase launch.

---

### NFR-2: Scalability {#nfr-2}

| Resource | Current | Phase 1 Target | Phase 3 Target |
|----------|---------|----------------|----------------|
| **Concurrent Users** | 10 | 100 | 1,000 |
| **Total Tenants** | 1 | 50 | 500 |
| **Orders** | 1,000 | 10,000 | 100,000 |
| **Documents** | 500 | 50,000 | 500,000 |
| **Database Size** | 1GB | 10GB | 100GB |

**Architecture:** Horizontal scaling via Supabase and Vercel.

---

### NFR-3: Availability {#nfr-3}

- **Uptime Target:** 99.5% (Phase 1), 99.9% (Phase 3)
- **Planned Maintenance:** <4 hours/month, announced 48 hours ahead
- **Incident Response:** <1 hour mean time to acknowledge (MTTA)
- **Disaster Recovery:** <24 hour recovery time objective (RTO)
- **Data Loss:** <1 hour recovery point objective (RPO)

**Monitoring:** Sentry for errors, Vercel Analytics for uptime.

---

### NFR-4: Usability {#nfr-4}

- **Accessibility:** WCAG 2.1 Level AA compliance
- **Mobile Responsive:** All pages functional on screens ≥375px width
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Error Messages:** User-friendly, actionable (not technical jargon)
- **Help:** In-app tooltips and links to knowledge base

**Testing:** Manual accessibility audit + automated Lighthouse scans.

---

### NFR-5: Maintainability {#nfr-5}

- **Code Coverage:** ≥80% across unit, integration, E2E tests
- **Documentation:** All public APIs documented (OpenAPI/Swagger)
- **Code Style:** TypeScript strict mode, ESLint + Prettier
- **Dependency Updates:** Monthly security patch cycle
- **Tech Debt:** <10% of sprint capacity allocated to refactoring

---

## USPAP Compliance Requirements {#uspap}

### USPAP-1: Audit Trails {#uspap-1}

**Requirement:** All actions that affect appraisal data or borrower access must be logged.

**Implementation:**
- `borrower_access_log` table records all borrower logins and document downloads
- Table fields: `id`, `borrower_access_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`
- Logs immutable (no UPDATE or DELETE permitted)
- Retention: 7 years minimum

**Acceptance:**
- [ ] All borrower logins logged
- [ ] All document downloads logged with IP address
- [ ] Logs cannot be modified or deleted
- [ ] Logs queryable by lender

---

### USPAP-2: Data Source Attribution {#uspap-2}

**Requirement:** External data sources (Zillow, MLS) must be clearly cited.

**Implementation:**
- All external data displays with source label
- Example: "Zestimate: $450,000 (Data provided by Zillow, updated 2025-11-08)"
- Source citation visible on screen and in exported reports

**Acceptance:**
- [ ] All external data shows source attribution
- [ ] Attribution persists in PDF exports

---

### USPAP-3: Prior Work Disclosure {#uspap-3}

**Requirement:** Appraisers must be aware of prior appraisals on same property.

**Implementation:**
- `property_prior_work_3y` view (already exists)
- Order detail page shows prior work alert if property appraised in last 3 years
- Alert includes: prior order ID, completion date, appraiser

**Acceptance:**
- [ ] Prior work alert displays when applicable
- [ ] Alert data accurate (3-year lookback)

---

### USPAP-4: Adjustment Justification {#uspap-4}

**Requirement:** All comparable adjustments must be documented.

**Implementation:**
- `comparables.adjustments` JSONB stores breakdown
- `comparables.notes` TEXT field required for justification
- UI forces appraiser to enter justification before saving

**Acceptance:**
- [ ] Comparable cannot be saved without justification
- [ ] Adjustments and justifications visible in order detail
- [ ] Data included in exported reports

---

### USPAP-5: Confidentiality {#uspap-5}

**Requirement:** Borrower access must be lender-authorized and restricted.

**Implementation:**
- `borrower_access` table requires `granted_by` (lender user)
- RLS policies enforce access only to authorized orders
- Borrower view excludes: fees, lender contact, appraiser details, internal notes

**Acceptance:**
- [ ] Borrower cannot access un-authorized orders
- [ ] Borrower view excludes confidential information
- [ ] Access grant requires lender approval

---

## Security Requirements {#security}

### SEC-1: Authentication {#sec-1}

- Passwords hashed with bcrypt (Supabase Auth default)
- Session tokens JWT-based with HMAC-SHA256
- MFA uses TOTP (RFC 6238)
- Password reset tokens valid for 1 hour, single-use
- Failed login attempts rate-limited (5 attempts per 15 minutes)

---

### SEC-2: Authorization {#sec-2}

- All database access controlled by Row-Level Security (RLS)
- API routes verify auth via `supabase.auth.getUser()`
- Service-role key usage limited to:
  - Tenant creation during registration
  - Automated system tasks
- All service-role calls logged

---

### SEC-3: Data Protection {#sec-3}

- Data encrypted at rest (Supabase default: AES-256)
- Data encrypted in transit (TLS 1.3)
- Sensitive fields (SSN, credit card) not stored
- File uploads scanned for malware (ClamAV or similar)
- PII access logged for GDPR compliance

---

### SEC-4: Input Validation {#sec-4}

- All API inputs validated with Zod schemas
- File uploads restricted: type whitelist, size limits (10MB)
- SQL injection prevented via parameterized queries (Supabase client)
- XSS prevented via React auto-escaping + CSP headers
- CSRF prevented via SameSite cookies + Origin checks

---

### SEC-5: Security Headers {#sec-5}

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
  }
];
```

---

## Testing Requirements {#testing}

### TEST-1: Unit Tests {#test-1}

**Coverage Target:** 80% of utility functions, validation schemas, business logic

**Examples:**
- Zod schema validation (auth, orders, filters)
- Adjustment calculations
- Date/time utilities
- Access control logic

**Tools:** Jest, @testing-library/react

---

### TEST-2: Integration Tests {#test-2}

**Coverage Target:** All API routes, database operations

**Examples:**
- Registration → tenant creation → user creation
- Order creation with RLS enforcement
- Document upload → storage → metadata save
- Borrower access grant → login → order view

**Tools:** Jest, Supertest, Supabase test client

---

### TEST-3: E2E Tests {#test-3}

**Coverage Target:** Critical user journeys

**Examples:**
- User registration → email verify → login → dashboard
- Lender grants borrower access → borrower logs in → downloads report
- Order creation → appraiser assigned → status updates → completion
- Pre-order submission → staff review → conversion

**Tools:** Playwright or Cypress

---

### TEST-4: Security Tests {#test-4}

**Coverage:** All security requirements (SEC-1 through SEC-5)

**Examples:**
- RLS tenant isolation (user A cannot access tenant B data)
- Auth bypass attempts (expired tokens, invalid signatures)
- XSS injection in text fields
- SQL injection in search queries
- CSRF attacks on state-changing endpoints

**Tools:** OWASP ZAP, manual penetration testing

---

### TEST-5: Performance Tests {#test-5}

**Coverage:** All NFR-1 performance targets

**Examples:**
- Dashboard load with 1000 orders
- Order detail with 50 documents
- Concurrent users (100, 500, 1000)
- Real-time update latency

**Tools:** k6, Lighthouse

---

## Acceptance Criteria {#acceptance}

### Phase 1 (MVP) Acceptance

- [ ] All FR-1 through FR-4 requirements met
- [ ] All NFR performance targets met
- [ ] All USPAP compliance requirements met
- [ ] All security requirements met
- [ ] Test coverage ≥80%
- [ ] Zero critical bugs
- [ ] User acceptance testing passed with 3+ clients
- [ ] Security audit passed
- [ ] Legal review approved (USPAP compliance)

### Phase 2 Acceptance

- [ ] All FR-5 requirements met (pre-orders)
- [ ] FR-6 implemented IF discovery phase approves
- [ ] External API costs within budget (<$500/mo)
- [ ] All Phase 1 requirements still met (regression)

### Phase 3 Acceptance

- [ ] All FR-7, FR-8 requirements met
- [ ] Load testing passed (1000 concurrent users)
- [ ] 99.9% uptime achieved over 30 days
- [ ] All documentation complete

---

## Requirement Traceability

All requirements in this document are traced in:
- **Architecture:** [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)
- **Roadmap:** [03-ROADMAP.md](./03-ROADMAP.md)
- **Tasks:** [04-TASKS/](./04-TASKS/)

**Do not duplicate requirements.** Link back to this document using section IDs.

---

**Document Status:** ✅ Approved for Implementation
**Next Review:** After Phase 0 completion
