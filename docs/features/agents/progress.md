---
status: current
last_verified: 2025-12-17
updated_by: Claude Code
last_updated: 2025-12-17
---

# vNext Autonomous Agent - Implementation Progress

## Overview

This document tracks the implementation progress of the vNext Autonomous Agent System, operating on an hourly **Plan → Act → React → Reflect** cycle. The system is designed to relentlessly pursue **Order + Revenue goals**, maintain **21-day engagement compliance**, process **new orders correctly** (pricing + credit approval + requirements), aggressively work **Deals/Opportunities** and **Quotes/Bids**, and remain "information hungry" (Gmail + documents ingestion, contact enrichment, and pattern discovery).

---

### Hard Guardrails (Prohibited Behaviors)

1. **Do not create human tasks unless client explicitly requested it.**
   - Allowed: "Can you call me Thursday?" → create_task
   - Blocked: "We should call them" (no explicit request)

2. **Do not run research until the current engagement/follow-up list is exhausted.**
   - Research is allowed only when engagement compliance is met and goals/pipeline conditions require it.

3. **No spam behaviors.**
   - Rate limits + suppression/bounce checks + opt-out compliance are mandatory.

### Operating Loop (Hourly)

- **Plan**: Pull goals, new orders, order exceptions, deals/opps, bids/quotes, engagement compliance, quarterly compliance due, Gmail updates, broadcast triggers.
- **Act**: Execute only policy-allowed actions (system actions default; human actions rare).
- **React**: Ingest outcomes (replies, bounces, order updates, credit failures, bid outcomes).
- **Reflect**: Write run record (what changed, what moved metrics, blocks, next-hour hints).

---

## Phase 0 (P0): Core Autonomous Infrastructure ✅ IMPLEMENTED (Needs Validation)

**Status**: Implemented and pushed to `claude/autonomous-agent-loop-fJMWb`

### P0.1: Hourly Autonomous Scheduler ✅

**Files Created**:
- `src/lib/agent/tenant-lock.ts` - Per-tenant locking mechanism
- `src/lib/agent/autonomous-cycle.ts` - Plan → Act → React → Reflect loop
- `src/app/api/cron/agent/route.ts` - Vercel cron endpoint (hourly)

**Features**:
- [x] Tenant lock acquisition with automatic expiration
- [x] Lock extension for long-running cycles
- [x] Expired lock cleanup
- [x] Cycle number tracking per tenant
- [x] Phase tracking (plan/act/react/reflect)
- [x] Work block record creation
- [x] Metrics collection (duration, actions, etc.)
- [x] Error handling and recovery

**Cron Schedule**: `0 * * * *` (every hour at minute 0)

### P0.2: Always-On Gmail Ingestion ✅

**Files Created**:
- `src/app/api/cron/gmail/route.ts` - Gmail polling cron endpoint

**Features**:
- [x] Polls all tenants with Gmail sync enabled
- [x] Runs independently of browser/UI
- [x] Processes messages and creates cards
- [x] Contact extraction from emails
- [x] Email classification and routing

**Cron Schedule**: `*/5 * * * *` (every 5 minutes)

**Enhancements Needed (vNext)**:
- [ ] Extract and persist all contact info from email headers/signatures
- [ ] Infer/store roles/titles where possible
- [ ] Link messages to Accounts/Deals/Orders (best-effort)
- [ ] Enforce message-id dedupe + idempotency

### P0.3: Policy Enforcement Engine ✅

**Files Created**:
- `src/lib/agent/policy-engine.ts` - Policy validation system

**Policies Implemented**:
- [x] **No Human Tasks Unless Requested**: Blocks `create_task` actions unless:
  - Client explicitly requested it in an email
  - Compliance deadline is due
  - Safety escalation is required
- [x] **Research After Exhaustion**: Blocks research unless:
  - All engagement compliance is met (no 21-day violations)
  - Goals are behind pace OR pipeline is thin
  - Exception: Contact discovery is always allowed
- [x] **Rate Limiting**: Prevents spam (handled in context builder)
- [x] **Sensitive Action Restrictions**: Blocks actions with dangerous patterns

**Audit Trail**:
- Policy violations logged to `agent_policy_violations` table
- Includes action data, reason, and whether blocked

### P0.4: 21-Day Engagement Engine ✅

**Files Created**:
- `src/lib/agent/engagement-engine.ts` - Engagement compliance tracking

**Features**:
- [x] Engagement clock per contact/account
- [x] Last touch tracking (type, date, by whom)
- [x] Next touch due calculation
- [x] Compliance status (compliant/overdue)
- [x] Days overdue tracking
- [x] Priority scoring for contact selection
- [x] Violation detection and reporting
- [x] Engagement statistics

**Key Functions**:
- `getEngagementViolations()` - Get all overdue contacts
- `selectNextContactsToTouch()` - Prioritized contact list
- `recordEngagementTouch()` - Update clock after touch
- `refreshEngagementCompliance()` - Recalculate compliance
- `getEngagementStats()` - Get tenant statistics

### P0.5: Order Processing Workflow ✅

**Files Created**:
- `src/lib/agent/order-processor.ts` - Automated order validation

**Validation Checks**:
- [x] **Pricing Validation**:
  - Fee amount > 0
  - Total >= Fee
  - Tech fee >= 0
  - Comparison against product catalog
- [x] **Credit Approval** (for bill orders):
  - Client is active
  - Credit limit check
  - Outstanding balance calculation
  - Available credit verification
- [x] **Requirements Validation**:
  - Property address required
  - Borrower contact info
  - Property contact for inspections

**Auto-Fix Capability**:
- [x] Safe pricing corrections (total_amount, tech_fee)
- [x] Auto-fix tracking and reporting

### Database Migration ✅

**File**: `supabase/migrations/20251217000000_autonomous_agent_system.sql`

**Tables Created**:
| Table | Purpose |
|-------|---------|
| `agent_autonomous_runs` | Track hourly cycle execution |
| `agent_tenant_locks` | Prevent concurrent runs |
| `engagement_clocks` | 21-day compliance tracking |
| `agent_policy_violations` | Audit trail for blocked actions |
| `order_processing_queue` | Order validation queue |
| `order_processing_exceptions` | Order validation issues |
| `warehouse_events` | Event store for analytics |
| `client_patterns` | Discovered client behavior patterns |
| `success_strategies` | AI-recommended strategies |
| `agent_hourly_reflections` | Detailed cycle reflections |

**Helper Functions Created**:
- `acquire_tenant_lock()` - Atomic lock acquisition
- `release_tenant_lock()` - Lock release
- `update_engagement_clock()` - Record touch
- `refresh_engagement_compliance()` - Update compliance status

### Configuration Updates ✅

**File**: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/agent", "schedule": "0 * * * *" },
    { "path": "/api/cron/gmail", "schedule": "*/5 * * * *" },
    { "path": "/api/agent/chat/cleanup", "schedule": "0 2 * * *" }
  ]
}
```

### Environment Variables Required

```bash
CRON_SECRET=your-secret-here  # For authenticating cron requests
```

### P0.6: Hardening & Proof (Before "True Autonomy") 🔲 REQUIRED

Before enabling autonomous operation in production, these safety measures must be implemented:

- [ ] Idempotency + dedupe guarantees (emails processed once; cards created once per source)
- [ ] Global kill switch + per-tenant disable flag
- [ ] Centralized rate limits (email sends, research runs, sandbox runs)
- [ ] RLS + tenant isolation verification across new tables
- [ ] Serverless resilience (checkpointing + avoid long single-run work)
- [ ] Observability wired to real alerts/dashboards

---

## Phase 1 (P1): Scale the Intelligence 🔲 NOT STARTED

### P1.1: Documents Library

**Goal**: Ingest and index documents for RAG retrieval

**Required Components**:
- [ ] `documents` table with embeddings column
- [ ] `src/lib/documents/document-service.ts` - CRUD operations
- [ ] `src/lib/documents/document-ingester.ts` - Parse & extract text
- [ ] `src/lib/documents/document-embedder.ts` - Generate embeddings
- [ ] `src/lib/documents/document-retriever.ts` - RAG retrieval

**Document Types to Support**:
- Contracts
- Invoices
- SOPs
- Bid templates
- Email attachments

**Features Needed**:
- [ ] Auto-ingest attachments from emails
- [ ] Auto-ingest documents from orders
- [ ] Text extraction (PDF, DOCX, etc.)
- [ ] Embedding generation
- [ ] Semantic search
- [ ] Source attribution

**Implementation Note**: Heavy parsing (PDF/DOCX extraction) should run via **P2.2 Utility Sandbox (Script Runner)** to avoid cron/API timeouts and to keep isolation.

### P1.2: Broadcast Audiences & Templates

**Goal**: Send targeted broadcasts to segmented audiences

**Required Components**:
- [ ] `audience_segments` table
- [ ] `broadcast_templates` table
- [ ] `broadcasts` table
- [ ] `src/lib/broadcasts/audience-builder.ts`
- [ ] `src/lib/broadcasts/template-manager.ts`
- [ ] `src/lib/broadcasts/broadcast-executor.ts`

**Audience Rule Types**:
- Client type (enterprise, SMB, etc.)
- Revenue band
- Order recency
- Engagement status
- Deal stage
- Geographic location

**Features Needed**:
- [ ] Rule-based audience definition
- [ ] Dynamic audience computation
- [ ] Template management with variables
- [ ] Approval workflow
- [ ] Opt-out compliance
- [ ] Bounce/suppression handling
- [ ] Open/click tracking

### P1.3: Feedback Automation

**Goal**: Automatically collect feedback 7 days after delivery

**Required Components**:
- [ ] `src/lib/agent/feedback-engine.ts`
- [ ] `src/lib/agent/feedback-templates.ts`
- [ ] `src/lib/agent/sentiment-analyzer.ts`

**Workflow**:
1. [ ] Trigger: 7 days after order delivery
2. [ ] Check: No open cases for this order
3. [ ] Send: Feedback request email
4. [ ] Analyze: Response sentiment
5. [ ] Action: If negative → open case + service recovery
6. [ ] Store: Feedback + associate to order/client

**Features Needed**:
- [ ] Delivery date tracking
- [ ] Open case detection
- [ ] Email template for feedback request
- [ ] Response monitoring
- [ ] Sentiment analysis
- [ ] Automatic case creation
- [ ] Service recovery workflow

### P1.4: Deals / Opportunities Engine

**Goal**: Aggressively work deals to close (stalled detection, next-step follow-ups, stage progression).

**Rules**:
- `send_email` / `follow_up` actions allowed autonomously
- `create_task` only when client explicitly requests

**Required Components**:
- [ ] `src/lib/agent/deals-engine.ts` - Deal progression logic
- [ ] Stalled deal detection (no movement in X days)
- [ ] Automatic follow-up scheduling
- [ ] Stage advancement triggers
- [ ] Win/loss tracking

### P1.5: Quotes / Bids Engine

**Goal**: Follow bid process end-to-end (intel request, competitive bid, follow-up until win/loss, reason capture).

**Required Components**:
- [ ] `src/lib/agent/bids-engine.ts` - Bid workflow automation
- [ ] Bid submission confirmation
- [ ] Intel gathering from submitter
- [ ] Competitive bid generation
- [ ] Follow-up until outcome
- [ ] Win/loss reason capture + pattern storage

### P1.6: "Information Hungry" Contact Enrichment

**Goal**: Save all contact info from emails, enrich contacts with roles, detect opportunities to serve (complaints/urgency/renewal/upsell).

**Required Components**:
- [ ] `src/lib/agent/contact-enricher.ts` - Contact data enhancement
- [ ] Email signature parsing
- [ ] Role/title inference
- [ ] Opportunity signal detection
- [ ] Complaint/urgency flagging

### P1.7: Account/Vendor Compliance (Quarterly)

**Goal**: Quarterly vendor manager profile check + update workflow, with escalation if access/data missing.

**Required Components**:
- [ ] `src/lib/agent/compliance-engine.ts` - Quarterly compliance checks
- [ ] Vendor manager status field verification
- [ ] Missing data detection
- [ ] Reminder/notification triggers
- [ ] Escalation workflow

---

## Phase 2 (P2): Compound Advantage 🔲 NOT STARTED

### P2.1: Data Warehouse & Insights Engine

**Goal**: Pattern detection and success strategy recommendations

**Required Components**:
- [ ] `src/lib/insights/warehouse-writer.ts` - Write events
- [ ] `src/lib/insights/pattern-detector.ts` - Find patterns
- [ ] `src/lib/insights/strategy-recommender.ts` - Generate recommendations
- [ ] Insight job scheduler

**Event Types to Capture**:
- Orders (status changes, amounts)
- Revenue
- Deal stages
- Bids (win/loss + reason)
- Engagement touches
- Email interactions
- Compliance events
- Feedback

**Insight Jobs**:
- [ ] **Hourly**: What changed since last hour?
- [ ] **Daily**: Summaries + anomalies
- [ ] **Weekly**: Patterns + playbooks

**Outputs**:
- [ ] Client Pattern records
- [ ] Success Strategy recommendations
- [ ] Anomaly alerts

### P2.2: Utility Sandbox (Script Runner)

**Goal**: Give the agent a safe coding tool to run scripts for everyday tasks (parsing, data transforms, document processing).

**Non-goals**: Not for deploying production applications.

#### P2.2.1: MVP (Template-based Scripts Only) 🔲

**Required Components**:
- [ ] `sandbox_jobs` table (tenant_id, script_name, params, input_file_ids, status, logs, created_at, completed_at)
- [ ] `sandbox_artifacts` table (job_id, artifact_type, file_id/path, metadata)
- [ ] `src/lib/sandbox/script-registry.ts` (allowlisted scripts + schemas)
- [ ] `src/lib/sandbox/sandbox-service.ts` (submit job → run → return artifacts)
- [ ] API route: `/api/sandbox/run` (or worker) to execute a job

**V1 Script Templates**:
- [ ] `parse_pdf_to_text`
- [ ] `parse_docx_to_text`
- [ ] `extract_contacts_from_text_or_email`
- [ ] `clean_csv_dedupe_contacts`
- [ ] `normalize_orders_export`
- [ ] `bid_comparison_table`
- [ ] `engagement_compliance_report`
- [ ] `invoice_line_item_extractor`

#### P2.2.2: Constrained Custom Code (Python recommended) 🔲

**Guardrails**:
- [ ] No network by default (or strict allowlist only)
- [ ] No secrets mounted/exposed
- [ ] Workspace-only file access (explicit inputs)
- [ ] Library allowlist (pandas/openpyxl/python-docx/PDF parser)
- [ ] Block dangerous ops (subprocess/shell/env reads/out-of-workspace writes)
- [ ] Hard limits (timeout/memory/CPU)
- [ ] Full audit log (stdout/stderr/exit code + artifact refs)

#### P2.2.3: Integration into Hourly Loop 🔲

- [ ] New action/card type: `sandbox_job` / `run_script`
- [ ] Policy checks + per-tenant rate limits
- [ ] Store structured outputs to `warehouse_events` when relevant
- [ ] Attach artifacts back to Documents Library (once P1.1 exists)

### P2.3: Browser Automation for Order Acceptance

**Goal**: Accept orders from vendor portals automatically

**Required Components**:
- [ ] Playwright integration
- [ ] Domain allowlist
- [ ] Workflow recorder
- [ ] Trace storage

**Security Requirements**:
- [ ] Allow-listed domains only
- [ ] Full trace recording (screenshots/logs)
- [ ] Human approval for first-time workflows
- [ ] Credential management (no plaintext)

**Workflow**:
1. [ ] Detect new order notification
2. [ ] Navigate to vendor portal
3. [ ] Authenticate (secure credential storage)
4. [ ] Accept/confirm order
5. [ ] Capture confirmation ID
6. [ ] Store receipt/trace
7. [ ] Update order status

### P2.4: Credential / Password Manager Integration 🔲

**Goal**: Support vendor portal automation without plaintext credentials.

**Requirements**:
- [ ] Least-privilege access (only what's needed for each workflow)
- [ ] Audit logs for credential use (who/when/what)
- [ ] Rotate/revoke support
- [ ] No credentials exposed to LLM context
- [ ] Integration with secrets manager (e.g., Vault, AWS Secrets Manager)

---

## Implementation Timeline (Suggested)

### Week 0: P0.6 Hardening & Proof (REQUIRED FIRST)
- Implement idempotency/dedupe guarantees
- Add global kill switch + per-tenant disable
- Set up centralized rate limits
- Verify RLS/tenant isolation
- Configure observability + alerts

### Week 1-2: P1.1 (Documents Library) + P2.2.1 (Sandbox MVP)
- Set up document ingestion pipeline
- Implement text extraction via sandbox scripts
- Add embedding generation
- Create retrieval API
- Build sandbox job runner with V1 templates

### Week 3-4: Complete P1.2 (Broadcasts) + P1.4-P1.5 (Deals/Bids)
- Build audience segmentation
- Create template system
- Implement broadcast executor
- Add compliance features
- Wire up deals/bids engines

### Week 5: Complete P1.3 (Feedback) + P1.6-P1.7 (Enrichment/Compliance)
- Implement feedback triggers
- Add sentiment analysis
- Create service recovery workflow
- Build contact enrichment pipeline
- Add quarterly compliance checks

### Week 6-7: Complete P2.1 (Insights)
- Set up warehouse events
- Implement pattern detection
- Build recommendation engine

### Week 8+: P2.2.2 + P2.3 + P2.4 (Advanced)
- Constrained custom code execution
- Browser automation for vendor portals
- Credential manager integration

---

## Testing Checklist

### P0 Testing (Current)

- [ ] Run database migration on staging
- [ ] Verify cron endpoints respond correctly
- [ ] Test tenant locking mechanism
- [ ] Verify autonomous cycle completes for single tenant
- [ ] Test multi-tenant concurrent execution
- [ ] Verify policy enforcement blocks violations
- [ ] Test engagement clock updates
- [ ] Verify order processing validation
- [ ] Test Gmail polling cron

### P0.6 Hardening Tests (Required for Production)

- [ ] Verify email dedupe/idempotency (message-id checkpointing)
- [ ] Verify kill switch disables autonomous actions
- [ ] Verify centralized rate limits are enforced
- [ ] Verify RLS/tenant isolation for new tables
- [ ] Confirm no cross-tenant data leakage
- [ ] Test serverless checkpointing on timeout

### Integration Testing

- [ ] Full hourly cycle with real tenant data
- [ ] Gmail integration with actual inbox
- [ ] Email sending via executor
- [ ] Reflection record creation
- [ ] Policy violation logging

---

## Monitoring & Observability

### Metrics to Track

| Metric | Description |
|--------|-------------|
| `agent.cycles.completed` | Successful hourly cycles |
| `agent.cycles.failed` | Failed hourly cycles |
| `agent.actions.planned` | Actions generated per cycle |
| `agent.actions.executed` | Actions successfully executed |
| `agent.actions.blocked` | Actions blocked by policy |
| `agent.engagement.compliance_rate` | % contacts within 21 days |
| `agent.orders.processed` | Orders validated |
| `agent.orders.exceptions` | Order validation failures |
| `gmail.messages.processed` | Emails processed |
| `gmail.cards.created` | Cards created from emails |
| `agent.sandbox.jobs_count` | Sandbox jobs executed |
| `agent.sandbox.fail_rate` | Sandbox job failure rate |

### Alerts to Configure

- Cycle failure rate > 20%
- Lock contention (same tenant locked > 1 hour)
- Policy violation spike
- Engagement compliance < 80%
- Order exception rate > 10%

---

## Files Created in P0

```
src/lib/agent/
├── autonomous-cycle.ts      # Plan → Act → React → Reflect loop
├── tenant-lock.ts           # Per-tenant locking
├── policy-engine.ts         # Action validation guardrails
├── engagement-engine.ts     # 21-day compliance tracking
├── order-processor.ts       # Order validation workflow
├── (existing files...)

src/app/api/cron/
├── agent/route.ts           # Hourly autonomous cycle
├── gmail/route.ts           # 5-minute Gmail polling

supabase/migrations/
├── 20251217000000_autonomous_agent_system.sql

docs/features/agents/
├── vnext-autonomous-agent-spec.md
├── progress.md              # This file
```

---

## Git History

| Commit | Description |
|--------|-------------|
| `753f130` | feat: Implement vNext autonomous agent system (P0) |

Branch: `claude/autonomous-agent-loop-fJMWb`
