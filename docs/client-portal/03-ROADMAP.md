# Client Portal - Implementation Roadmap

**References:**
- Requirements: [01-REQUIREMENTS.md](./01-REQUIREMENTS.md)
- Architecture: [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)

**Version:** 2.0
**Last Updated:** 2025-11-09

---

## Timeline Overview

```
Phase 0: Multi-Tenant Migration ────────────── 2-3 weeks  ██░░░░░░░░░░░░░
Phase 1: MVP (Auth + Dashboards) ──────────── 4-6 weeks  ░░██████░░░░░░░
Phase 2.0: External Data Discovery ────────── 1-2 weeks  ░░░░░░░░██░░░░░
Phase 2.1: Pre-Orders + Integrations ───────── 2-3 weeks  ░░░░░░░░░░███░░
Phase 3: Enterprise Features ──────────────── 3-4 weeks  ░░░░░░░░░░░░████
                                    ──────────────────────
                                    Total: 12-18 weeks (3-4.5 months)
                                    With 25% contingency: 15-23 weeks
```

---

## Phase 0: Multi-Tenant Migration (CRITICAL)

**Duration:** 2-3 weeks
**Priority:** P0 (Blocker for Phase 1)
**Goal:** Migrate existing single-user orgs to multi-tenant architecture without data loss or downtime.

### Why Phase 0 is Required

**Current Problem:** See [02-ARCHITECTURE.md#current-state](./02-ARCHITECTURE.md#current-state)
- Each user is their own "organization" (`org_id = auth.uid()`)
- No data sharing between users in same company
- Client Portal requires shared tenant access

**Migration Complexity:**
- 12 tables with `org_id` need `tenant_id` added
- 40+ RLS policies need updates
- All existing data needs backfill
- Cannot break existing functionality

### Requirements

**See:** [01-REQUIREMENTS.md](./01-REQUIREMENTS.md) (No additional functional requirements for Phase 0)

**Architecture:** [02-ARCHITECTURE.md#multi-tenant-strategy](./02-ARCHITECTURE.md#multi-tenant-strategy)

### Deliverables

#### 0.1: Migration Planning & Testing
**Tasks:** [04-TASKS/phase-0/0.1-migration-planning.md](./04-TASKS/phase-0/0.1-migration-planning.md)

- [ ] Inventory all tables with `org_id`
- [ ] Inventory all RLS policies
- [ ] Write migration scripts (SQL)
- [ ] Create test environment with production-like data
- [ ] Test migration scripts on staging
- [ ] Document rollback procedure

**Success Criteria:**
- [ ] All 12 tables identified
- [ ] All 40+ RLS policies catalogued
- [ ] Migration runs successfully on staging (10k+ records)
- [ ] Rollback tested and verified
- [ ] Zero data loss in test

#### 0.2: Database Migration Execution
**Tasks:** [04-TASKS/phase-0/0.2-database-migration.md](./04-TASKS/phase-0/0.2-database-migration.md)

- [ ] Create tenants for existing users
- [ ] Backfill `tenant_id` on all tables
- [ ] Update RLS policies (additive, not breaking)
- [ ] Verify data integrity
- [ ] Run automated tests

**Success Criteria:**
- [ ] All existing users have `tenant_id`
- [ ] All existing records have `tenant_id` backfilled
- [ ] Zero NULL `tenant_id` values
- [ ] All RLS policies functional
- [ ] All existing tests passing
- [ ] Performance: queries <2x slower (acceptable temporary overhead)

#### 0.3: Validation & Monitoring
**Tasks:** [04-TASKS/phase-0/0.3-validation-monitoring.md](./04-TASKS/phase-0/0.3-validation-monitoring.md)

- [ ] Run data consistency checks
- [ ] Monitor query performance
- [ ] Verify tenant isolation (security test)
- [ ] User acceptance testing (existing workflows)
- [ ] Document migration results

**Success Criteria:**
- [ ] Data integrity 100%
- [ ] Tenant isolation verified (user A cannot see tenant B data)
- [ ] All existing features working
- [ ] Performance within acceptable range
- [ ] Migration report documented

### Timeline

| Week | Activities | Owner |
|------|------------|-------|
| **Week 1** | Planning, script writing, staging setup | Backend Dev |
| **Week 2** | Staging migration, testing, refinement | Backend Dev + QA |
| **Week 3** | Production migration (off-peak hours), validation | Backend Dev + DevOps |

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Migration script fails mid-execution** | Critical | Transaction-wrapped, rollback tested |
| **Performance degrades >5x** | High | Query optimization, index tuning |
| **Data inconsistency** | Critical | Automated validation queries, manual spot checks |
| **Downtime exceeds 1 hour** | High | Rehearse on staging, staged rollout |

### Go/No-Go Criteria

**Before Production Migration:**
- ✅ Staging migration 100% successful
- ✅ Rollback procedure tested
- ✅ All stakeholders notified
- ✅ Backup verified
- ✅ Off-peak time window secured

**If NO-GO:** Phase 1 cannot proceed. Investigate failure and reschedule.

---

## Phase 1: MVP - Core Client Portal

**Duration:** 4-6 weeks
**Priority:** P0 (Critical for launch)
**Dependencies:** Phase 0 complete
**Goal:** Launch minimum viable client portal with auth, dashboards, and borrower access.

### Requirements

**Functional Requirements:**
- [FR-1: Multi-Tenant Authentication](./01-REQUIREMENTS.md#fr-1)
- [FR-2: Client Dashboard](./01-REQUIREMENTS.md#fr-2)
- [FR-3: Order Detail Page](./01-REQUIREMENTS.md#fr-3)
- [FR-4: Borrower Sub-Login Access](./01-REQUIREMENTS.md#fr-4)

**Non-Functional Requirements:**
- [NFR-1: Performance](./01-REQUIREMENTS.md#nfr-1) - Dashboard <2s, Order detail <3s
- [NFR-2: Scalability](./01-REQUIREMENTS.md#nfr-2) - Support 100 concurrent users
- [NFR-3: Availability](./01-REQUIREMENTS.md#nfr-3) - 99.5% uptime

**USPAP Compliance:**
- [USPAP-1: Audit Trails](./01-REQUIREMENTS.md#uspap-1)
- [USPAP-5: Confidentiality](./01-REQUIREMENTS.md#uspap-5)

**Architecture:**
- [Borrower Identity Model](./02-ARCHITECTURE.md#borrower-identity-model) - Magic links
- [RLS Policy Design](./02-ARCHITECTURE.md#rls-policy-design)
- [Service-Role Usage](./02-ARCHITECTURE.md#service-role-usage)

### Deliverables

#### 1.1: Enhanced Authentication
**Tasks:** [04-TASKS/phase-1/1.1-multi-tenant-auth.md](./04-TASKS/phase-1/1.1-multi-tenant-auth.md)
**Effort:** 8 story points (~1.5 weeks)

- [ ] Registration with tenant creation
- [ ] Email verification flow
- [ ] Password reset
- [ ] MFA enrollment (optional)
- [ ] Service-role integration for tenant creation

**Success Criteria:** All [FR-1](./01-REQUIREMENTS.md#fr-1) acceptance criteria met

#### 1.2: Client Dashboard
**Tasks:** [04-TASKS/phase-1/1.2-client-dashboard.md](./04-TASKS/phase-1/1.2-client-dashboard.md)
**Effort:** 5 story points (~1 week)

- [ ] Dashboard summary cards
- [ ] Filterable order list
- [ ] Search functionality
- [ ] Export to CSV
- [ ] Real-time updates

**Success Criteria:** All [FR-2](./01-REQUIREMENTS.md#fr-2) acceptance criteria met

#### 1.3: Order Detail Page
**Tasks:** [04-TASKS/phase-1/1.3-order-detail.md](./04-TASKS/phase-1/1.3-order-detail.md)
**Effort:** 8 story points (~1.5 weeks)

- [ ] Order information display
- [ ] Property map integration
- [ ] Document upload/download
- [ ] Comparables table
- [ ] Activity timeline
- [ ] Notes section

**Success Criteria:** All [FR-3](./01-REQUIREMENTS.md#fr-3) acceptance criteria met

#### 1.4: Borrower Sub-Login
**Tasks:** [04-TASKS/phase-1/1.4-borrower-access.md](./04-TASKS/phase-1/1.4-borrower-access.md)
**Effort:** 8 story points (~1.5 weeks)

- [ ] Lender access grant workflow
- [ ] Magic link generation
- [ ] Borrower restricted view
- [ ] Watermarked PDF downloads
- [ ] Audit logging

**Success Criteria:** All [FR-4](./01-REQUIREMENTS.md#fr-4) acceptance criteria met

### Testing Requirements

**See:** [01-REQUIREMENTS.md#testing](./01-REQUIREMENTS.md#testing)

- [ ] Unit tests (80% coverage)
- [ ] Integration tests (all API routes)
- [ ] E2E tests (critical journeys)
- [ ] Security tests (RLS isolation, auth bypass attempts)
- [ ] Performance tests (dashboard, order detail load times)

### Timeline

| Week | Sprint | Features | Owner |
|------|--------|----------|-------|
| **1** | Sprint 1 | Task 1.1 (Auth) | Backend + Frontend |
| **2** | Sprint 1 | Task 1.1 complete, testing | Backend + Frontend |
| **3** | Sprint 2 | Task 1.2 (Dashboard) | Frontend |
| **4** | Sprint 2 | Task 1.3 (Order Detail) start | Frontend |
| **5** | Sprint 3 | Task 1.3 complete, 1.4 (Borrower) start | Full team |
| **6** | Sprint 3 | Task 1.4 complete, UAT, bug fixes | Full team |

### Phase 1 Launch Checklist

- [ ] All deliverables 1.1-1.4 complete
- [ ] All acceptance criteria met
- [ ] Test coverage ≥80%
- [ ] Security audit passed
- [ ] USPAP compliance verified (legal review)
- [ ] Performance benchmarks met
- [ ] User acceptance testing with 3+ beta clients
- [ ] Deployment runbook documented
- [ ] Rollback plan ready
- [ ] Monitoring configured (Sentry, alerts)
- [ ] Support team trained

**Go-Live Decision:** Product owner + tech lead approval required

---

## Phase 2.0: External Data Discovery (GATE)

**Duration:** 1-2 weeks
**Priority:** P1 (Gate for Phase 2.1)
**Dependencies:** Phase 1 complete
**Goal:** Determine feasibility of Zillow/MLS integrations before building.

### Why Discovery Phase?

**Critical Questions to Answer:**
1. **Zillow:** Can we legally/reliably get Zestimates?
2. **MLS:** What does access cost per market?
3. **Alternatives:** Are there better/cheaper data sources?
4. **ROI:** Do benefits justify costs?

### Requirements

**See:** [FR-6: External Data Integration](./01-REQUIREMENTS.md#fr-6) (conditional implementation)

**Architecture:** [External Data Integration](./02-ARCHITECTURE.md#external-data-integration)

### Deliverables

#### 2.0.1: Zillow Data Evaluation
**Tasks:** [04-TASKS/phase-2/2.0.1-zillow-evaluation.md](./04-TASKS/phase-2/2.0.1-zillow-evaluation.md)

- [ ] Identify RapidAPI Zillow providers (3+ vendors)
- [ ] Test data accuracy (compare to internal comps)
- [ ] Calculate cost: requests/month × price/request
- [ ] Legal review: screen-scraping terms
- [ ] Measure reliability: uptime, error rates
- [ ] **Decision: GO / NO-GO / DEFER**

**Metrics:**
- Accuracy: >80% match with actual sale prices
- Cost: <$500/month for expected volume
- Uptime: >99% over 30-day test
- Legal: No prohibitions on commercial use

#### 2.0.2: MLS Data Evaluation
**Tasks:** [04-TASKS/phase-2/2.0.2-mls-evaluation.md](./04-TASKS/phase-2/2.0.2-mls-evaluation.md)

- [ ] Target markets identified (FL, CA, TX priority)
- [ ] Research MLS APIs per market (CRMLS, NWMLS, etc.)
- [ ] Check license requirements (broker license needed?)
- [ ] Get pricing quotes from aggregators (Trestle, Bridge, RESO)
- [ ] Review data redistribution terms
- [ ] **Decision: GO / NO-GO / DEFER (per market)**

**Metrics:**
- Coverage: >80% of target properties have MLS data
- Cost: <$2000/month for 3 markets
- Access: No broker license required OR workaround identified
- Legal: Redistribution permitted with attribution

#### 2.0.3: Alternative Data Sources
**Tasks:** [04-TASKS/phase-2/2.0.3-alternatives-evaluation.md](./04-TASKS/phase-2/2.0.3-alternatives-evaluation.md)

- [ ] Evaluate ATTOM Data Solutions
- [ ] Evaluate CoreLogic / First American
- [ ] Evaluate Regrid (parcel data)
- [ ] Design user-uploaded comps fallback UX
- [ ] **Recommendation: Best path forward**

### Decision Matrix

| Data Source | Accuracy | Cost | Legal Risk | Reliability | Recommendation |
|-------------|----------|------|------------|-------------|----------------|
| RapidAPI Zillow | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ Pending |
| MLS (FL) | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ Pending |
| ATTOM | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ Pending |
| User-uploaded | N/A | $0 | None | High | ✅ Fallback |

### Phase 2.0 Outcomes

**Scenario A: GO**
- All checks passed, cost justified
- Proceed to Phase 2.1 implementation
- Budget approved by stakeholders

**Scenario B: PARTIAL GO**
- Some sources approved (e.g., ATTOM yes, Zillow no)
- Implement approved sources only in Phase 2.1
- Design fallback for missing sources

**Scenario C: NO-GO**
- Costs too high or legal risk unacceptable
- Skip external data integration (Phase 2.1)
- Implement user-uploaded comps instead (cheaper, safer)
- Defer to future phase when economics improve

**Decision Maker:** Product owner + CFO (cost approval)

---

## Phase 2.1: Pre-Orders & Integrations

**Duration:** 2-3 weeks
**Priority:** P1 (Should Have)
**Dependencies:** Phase 1 complete, Phase 2.0 GO decision
**Goal:** Streamline order intake and enhance property insights.

### Requirements

**Functional Requirements:**
- [FR-5: Pre-Order Submission Workflow](./01-REQUIREMENTS.md#fr-5)
- [FR-6: External Data Integration](./01-REQUIREMENTS.md#fr-6) (IF Phase 2.0 approved)

**USPAP Compliance:**
- [USPAP-2: Data Source Attribution](./01-REQUIREMENTS.md#uspap-2) (if external data)

### Deliverables

#### 2.1.1: Pre-Order Workflow
**Tasks:** [04-TASKS/phase-2/2.1.1-pre-order-workflow.md](./04-TASKS/phase-2/2.1.1-pre-order-workflow.md)
**Effort:** 8 story points (~1.5 weeks)

- [ ] Client-facing pre-order wizard
- [ ] Validation rules
- [ ] Internal review dashboard
- [ ] Convert to full order action
- [ ] Client notifications

**Success Criteria:** All [FR-5](./01-REQUIREMENTS.md#fr-5) acceptance criteria met

#### 2.1.2: External Data Integration (CONDITIONAL)
**Tasks:** [04-TASKS/phase-2/2.1.2-external-data-integration.md](./04-TASKS/phase-2/2.1.2-external-data-integration.md)
**Effort:** 5 story points (~1 week)
**Status:** ⏳ Conditional on Phase 2.0 GO

- [ ] API clients for approved sources
- [ ] Caching layer (24hr TTL)
- [ ] Rate limiting & error handling
- [ ] Data source attribution (USPAP)
- [ ] Fallback UX

**Success Criteria:** All [FR-6](./01-REQUIREMENTS.md#fr-6) acceptance criteria met

### Timeline

| Week | Activities | Owner |
|------|------------|-------|
| **1** | Pre-order wizard, validation | Frontend + Backend |
| **2** | Review dashboard, conversion logic | Backend |
| **3** | External data (if approved), testing | Backend |

### Phase 2.1 Launch Checklist

- [ ] All deliverables complete
- [ ] Test coverage ≥80%
- [ ] Phase 1 features still working (regression)
- [ ] External API costs within budget (if applicable)
- [ ] USPAP attribution verified (if external data)

---

## Phase 3: Enterprise Features & Scale

**Duration:** 3-4 weeks
**Priority:** P2 (Nice to Have)
**Dependencies:** Phase 1, Phase 2 complete
**Goal:** Support AMC partnerships and scale to 1000+ concurrent users.

### Requirements

**Functional Requirements:**
- [FR-7: AMC Portal Enhancements](./01-REQUIREMENTS.md#fr-7)
- [FR-8: Role-Specific Dashboards](./01-REQUIREMENTS.md#fr-8)

**Non-Functional Requirements:**
- [NFR-2: Scalability](./01-REQUIREMENTS.md#nfr-2) - 1000 concurrent users
- [NFR-3: Availability](./01-REQUIREMENTS.md#nfr-3) - 99.9% uptime

### Deliverables

#### 3.1: AMC Portal Features
**Tasks:** [04-TASKS/phase-3/3.1-amc-portal.md](./04-TASKS/phase-3/3.1-amc-portal.md)
**Effort:** 8 story points (~1.5 weeks)

- [ ] White-label theming
- [ ] Custom SLA configuration
- [ ] Bulk order actions
- [ ] Batch report download

**Success Criteria:** All [FR-7](./01-REQUIREMENTS.md#fr-7) acceptance criteria met

#### 3.2: Role-Specific Features
**Tasks:** [04-TASKS/phase-3/3.2-role-dashboards.md](./04-TASKS/phase-3/3.2-role-dashboards.md)
**Effort:** 5 story points (~1 week)

- [ ] Investor portfolio analytics
- [ ] Accountant financial reports
- [ ] Attorney document access
- [ ] Feature flag system

**Success Criteria:** All [FR-8](./01-REQUIREMENTS.md#fr-8) acceptance criteria met

#### 3.3: Infrastructure Hardening
**Tasks:** [04-TASKS/phase-3/3.3-infrastructure.md](./04-TASKS/phase-3/3.3-infrastructure.md)
**Effort:** 5 story points (~1 week)

- [ ] Storage RLS policies finalized
- [ ] Rate limiting (all public routes)
- [ ] Security headers configured
- [ ] Sentry error monitoring
- [ ] GDPR compliance docs
- [ ] Backup/recovery tested

**Success Criteria:** All [Security Requirements](./01-REQUIREMENTS.md#security) met

#### 3.4: Operational Documentation
**Tasks:** [04-TASKS/phase-3/3.4-documentation.md](./04-TASKS/phase-3/3.4-documentation.md)
**Effort:** 3 story points (~0.5 weeks)

- [ ] User guides (lender, borrower, admin)
- [ ] API documentation
- [ ] Runbooks (deployment, incident response)
- [ ] SLA documentation
- [ ] Training materials

### Testing Requirements

- [ ] Load testing (1000 concurrent users)
- [ ] Penetration testing (external firm)
- [ ] Disaster recovery drill
- [ ] 30-day uptime monitoring (99.9% target)

### Timeline

| Week | Activities | Owner |
|------|------------|-------|
| **1** | AMC theming, bulk actions | Frontend + Backend |
| **2** | Role dashboards, feature flags | Frontend |
| **3** | Infrastructure, security audit | DevOps + Security |
| **4** | Documentation, UAT, launch prep | Full team |

### Phase 3 Launch Checklist

- [ ] All deliverables complete
- [ ] Load testing passed (1000 users)
- [ ] Security audit passed (external)
- [ ] GDPR compliance documented
- [ ] Backup recovery tested successfully
- [ ] 99.9% uptime achieved over 30 days
- [ ] All documentation complete
- [ ] 5+ AMC beta partners ready

---

## Cross-Phase Considerations

### Continuous Integration / Deployment

**Every Phase:**
- [ ] Code review (2+ approvals)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scans clean (OWASP ZAP, Snyk)
- [ ] Performance within targets
- [ ] Deployed to staging first
- [ ] UAT approval before production

**Deployment Strategy:**
- Phase 0: Maintenance window (off-peak hours)
- Phase 1-3: Feature flags, gradual rollout (10% → 50% → 100%)

### Monitoring & Alerting

**Metrics to Track (All Phases):**
- Error rate (target: <1%)
- API response time (P95: <500ms)
- Page load time (P95: <3s)
- Real-time connection health
- Auth success/failure rates
- Storage usage growth

**Alerts:**
- Error rate >1%: PagerDuty notification
- API response time >5s: Slack alert
- Database CPU >80%: Email notification
- Auth failures spike: Security team notification

### Documentation Updates

After each phase:
- [ ] Update this roadmap with actuals
- [ ] Document lessons learned
- [ ] Update architecture if deviations occurred
- [ ] Refine estimates for next phase

---

## Risk Management

### Overall Project Risks

| Risk | Phase | Probability | Impact | Mitigation |
|------|-------|------------|--------|------------|
| **Phase 0 migration breaks production** | 0 | Medium | Critical | Staged rollout, rollback tested, off-peak timing |
| **External API costs exceed budget** | 2.0 | High | High | Discovery phase (GO/NO-GO gate) |
| **Performance issues at 1000 users** | 3 | Medium | High | Load testing before launch, horizontal scaling ready |
| **USPAP compliance gap discovered** | All | Low | Critical | Legal review each phase, audit logging built-in |
| **Key developer leaves mid-project** | All | Low | Medium | Knowledge sharing, pair programming, documentation |

### Escalation Path

**Minor Issue (< 1 day delay):** Team resolves internally
**Major Issue (> 1 day delay):** Tech lead + product owner notified
**Critical Issue (blocks phase):** Stakeholder meeting, re-plan

---

## Success Metrics (KPIs)

### Phase 0
- ✅ Zero data loss
- ✅ Zero breaking changes to existing features
- ✅ Migration completes in <4 hours

### Phase 1
- ✅ 50+ clients onboarded
- ✅ 100+ borrower logins/week
- ✅ <2s dashboard load time (P95)
- ✅ Zero USPAP violations
- ✅ 80%+ test coverage

### Phase 2
- ✅ 30% of orders start as pre-orders
- ✅ External data available for 90%+ properties (if implemented)
- ✅ API costs <$500/month (if external data)

### Phase 3
- ✅ 5+ AMC partners with custom themes
- ✅ 1000 concurrent users supported
- ✅ 99.9% uptime over 30 days
- ✅ Zero security incidents

---

## Conclusion

This roadmap provides:
1. **Phase 0 (Critical):** Multi-tenant migration with safety controls
2. **Phase 1 (MVP):** Core features for client portal launch
3. **Phase 2.0 (Gate):** Discovery before committing to external data
4. **Phase 2.1 (Conditional):** Pre-orders + integrations (if approved)
5. **Phase 3 (Scale):** Enterprise features and hardening

**Total Timeline:** 12-18 weeks (3-4.5 months)
**With Contingency:** 15-23 weeks (3.5-5.5 months)

**Next Steps:**
1. Stakeholder approval of roadmap
2. Resource allocation (developers, QA, security)
3. Begin Phase 0 planning
4. Detailed task breakdown (see [04-TASKS/](./04-TASKS/))

---

**Document Status:** ✅ Ready for stakeholder review
**Next Update:** After Phase 0 completion
