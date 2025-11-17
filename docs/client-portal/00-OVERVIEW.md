# Client Portal - Project Overview

**Project:** Salesmod Client Portal (Multi-Tenant)
**Version:** 2.0 (Restructured)
**Last Updated:** 2025-11-09
**Status:** Planning / Pre-Implementation

---

## Executive Summary

The **Client Portal** extends Salesmod to provide secure, role-based access for external stakeholders (lenders, borrowers, investors, AMCs, attorneys, accountants) to view appraisal orders, reports, and property data.

### Vision

Enable **multi-tenant client access** where:
- Lenders manage orders and invite borrowers
- Borrowers view authorized reports (USPAP compliant)
- AMCs operate white-labeled portals
- Investors track portfolio valuations
- All stakeholders operate within secure, isolated tenants

---

## Business Objectives

### Primary Goals
1. **Reduce Support Burden** - Self-service order status and document access
2. **Improve Client Satisfaction** - Real-time updates, transparency
3. **USPAP Compliance** - Audit trails for borrower report access
4. **Revenue Growth** - Enable AMC partnerships with white-label portals
5. **Competitive Advantage** - Modern, real-time client experience

### Success Metrics
- **Phase 1:** 50+ clients onboarded, <2s dashboard load time, zero USPAP violations
- **Phase 2:** 30% of orders start as pre-orders, 90% property data coverage
- **Phase 3:** 5+ AMC partnerships, 95% uptime, zero security breaches

---

## Scope

### In Scope
✅ Multi-tenant authentication and authorization
✅ Client dashboards with order management
✅ Borrower sub-access with lender authorization
✅ Document upload/download with access control
✅ Real-time order status updates
✅ Pre-order submission workflow
✅ External data integration (Zillow, MLS) *pending feasibility*
✅ AMC white-label theming
✅ Role-specific dashboards (investor, accountant, attorney)

### Out of Scope (Future Phases)
❌ Mobile apps (Phase 4+)
❌ Payment processing (Phase 4+)
❌ Client-to-client collaboration (Phase 4+)
❌ Advanced analytics / BI dashboards (Phase 5+)

---

## Key Stakeholders

| Role | Stakeholder | Responsibility |
|------|------------|----------------|
| **Product Owner** | TBD | Prioritization, acceptance |
| **Tech Lead** | TBD | Architecture decisions |
| **Backend Dev** | TBD | API routes, database, RLS |
| **Frontend Dev** | TBD | UI components, dashboards |
| **QA Lead** | TBD | Test strategy, coverage |
| **Security** | TBD | USPAP compliance, audits |
| **DevOps** | TBD | Deployment, monitoring |

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript | Modern, SSR, type safety |
| **UI Framework** | Tailwind CSS, shadcn/ui | Consistent design system |
| **State** | React Query, Zustand | Server state caching, client state |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Database** | Supabase (PostgreSQL) | Existing, managed, real-time |
| **Auth** | Supabase Auth | JWT, RLS, MFA built-in |
| **Storage** | Supabase Storage | Integrated, RLS policies |
| **Real-time** | Supabase Realtime | WebSocket subscriptions |
| **API** | Next.js API Routes | Server-side logic |
| **Deployment** | Vercel / Firebase App Hosting | Existing infrastructure |
| **Monitoring** | Sentry, Vercel Analytics | Error tracking, performance |

**Key Constraint:** No Prisma - using Supabase client directly with SQL migrations.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Lender  │  │ Borrower │  │   AMC    │  │  Investor   │ │
│  │  Portal  │  │  Portal  │  │  Portal  │  │  Dashboard  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js 15 (App Router)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes + Server Components + Client Components │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Platform                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │ PostgreSQL │  │ Auth (JWT) │  │ Storage + Realtime │    │
│  │  + RLS     │  │  + MFA     │  │                    │    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Integrations                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  Zillow  │  │   MLS    │  │  Google Maps / Geocoding │  │
│  │   API    │  │   APIs   │  │                          │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Decisions Requiring Resolution

### 🚨 Decision 1: Multi-Tenant Migration Strategy
**Issue:** Current schema uses `org_id = auth.uid()` (single-user orgs). Migrating to shared tenants requires backfilling all tables and rewriting dozens of RLS policies.

**Options:**
- **A.** Full migration (all tables, all policies) - **Complex, high risk**
- **B.** Phased migration (start with new clients only) - **Simpler, dual-mode**
- **C.** Keep `org_id` as-is, add `tenant_id` for new features only - **Minimal disruption**

**Status:** ⏳ **UNRESOLVED** - See [02-ARCHITECTURE.md](./02-ARCHITECTURE.md#multi-tenant-strategy)

---

### 🚨 Decision 2: Borrower Identity Model
**Issue:** How do borrowers authenticate? Are they Supabase users or custom auth?

**Options:**
- **A.** Magic links (recommended) - Email-based, no password, Supabase managed
- **B.** Custom tokens - Simple but less secure, manual session management
- **C.** Full Supabase users - Most secure but adds user management overhead

**Status:** ⏳ **UNRESOLVED** - See [02-ARCHITECTURE.md](./02-ARCHITECTURE.md#borrower-identity-model)

---

### 🚨 Decision 3: External Data Feasibility
**Issue:** Zillow API shut down in 2021. MLS data requires licenses and is fragmented.

**Options:**
- **A.** Proceed with RapidAPI screen-scrapers - **Legal risk, unreliable**
- **B.** Partner with data aggregators (ATTOM, CoreLogic) - **Expensive ($1k+/mo)**
- **C.** Skip external data, use user-uploaded comps - **Safe, lower value**

**Status:** ⏳ **REQUIRES DISCOVERY** - See [03-ROADMAP.md](./03-ROADMAP.md#phase-2-0-discovery)

---

## USPAP Compliance Requirements

All features must adhere to **Uniform Standards of Professional Appraisal Practice**:

1. **Audit Trails** - Log all document access, especially borrower downloads
2. **Data Attribution** - Cite sources for external data (Zillow, MLS)
3. **Confidentiality** - Borrower access restricted to lender-authorized content
4. **Prior Work Disclosure** - Track appraisals on same property (3-year lookback)
5. **Adjustment Documentation** - Justify all comparable adjustments
6. **Independence** - Appraiser selection free from client influence

**Compliance Owner:** Security stakeholder + Legal review required

---

## Risks and Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Multi-tenant migration breaks existing data** | Medium | Critical | Phase 0 with extensive testing, rollback plan |
| **RLS policies too complex to maintain** | Medium | High | Automated testing, policy generator scripts |
| **External API costs exceed budget** | High | High | Discovery phase first, strict caching, usage caps |
| **Borrower auth bypass vulnerability** | Low | Critical | Security audit, penetration testing |
| **USPAP compliance violation** | Low | Critical | Legal review, automated audit logging |
| **Performance degradation at scale** | Medium | High | Load testing, query optimization, caching |

---

## Project Timeline (Estimated)

```
Phase 0: Multi-Tenant Migration ────────────── 2-3 weeks
Phase 1: MVP (Auth + Dashboards) ──────────── 4-6 weeks
Phase 2.0: External Data Discovery ────────── 1-2 weeks
Phase 2.1: Pre-Orders + Integrations ───────── 2-3 weeks
Phase 3: Enterprise Features ──────────────── 3-4 weeks
                                    ─────────────────────
                                    Total: 12-18 weeks
```

**Contingency:** +25% (3-4 weeks) for unknowns = **15-22 weeks (3.5-5 months)**

---

## Document Structure

This overview is part of a comprehensive documentation set:

```
docs/client-portal/
├── 00-OVERVIEW.md ◄ YOU ARE HERE
├── 01-REQUIREMENTS.md        # Functional & non-functional requirements
├── 02-ARCHITECTURE.md        # Tech decisions, data models, RLS design
├── 03-ROADMAP.md             # Phases, timeline, dependencies
└── 04-TASKS/                 # Implementation tasks by phase
    ├── phase-0/              # Migration tasks
    ├── phase-1/              # MVP tasks
    ├── phase-2/              # Integration tasks
    └── phase-3/              # Enterprise tasks
```

---

## Next Steps

1. **Resolve critical decisions** (multi-tenant, borrower auth, external data)
2. **Review requirements** - Read [01-REQUIREMENTS.md](./01-REQUIREMENTS.md)
3. **Review architecture** - Read [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)
4. **Approve roadmap** - Read [03-ROADMAP.md](./03-ROADMAP.md)
5. **Begin Phase 0** - Multi-tenant migration planning

---

**Questions or feedback?** Contact project stakeholders listed above.
