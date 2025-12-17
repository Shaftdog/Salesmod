---
status: current
last_verified: 2025-12-17
updated_by: Claude Code
---

# vNext Autonomous Agent - Implementation Progress

## Overview

This document tracks the implementation progress of the vNext Autonomous Agent System, which transforms the current manual-trigger agent into a fully autonomous, always-on AI Account Manager operating on an hourly Plan → Act → React → Reflect cycle.

---

## Phase 0 (P0): Core Autonomous Infrastructure ✅ COMPLETE

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

### P2.2: Sandbox Code Execution

**Goal**: Agent can prototype solutions safely

**Required Components**:
- [ ] Sandbox execution environment
- [ ] Code validation and sanitization
- [ ] Resource limits (time, memory)
- [ ] Audit logging

**Security Requirements**:
- [ ] Isolated container/sandbox
- [ ] 30-second timeout
- [ ] 512MB memory limit
- [ ] No secrets exposure
- [ ] Whitelisted libraries only
- [ ] Input/output audit trail

**Use Cases**:
- Data transforms
- Report generation
- Export creation
- Validation scripts
- Quick utilities

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

---

## Implementation Timeline (Suggested)

### Week 1-2: Complete P1.1 (Documents Library)
- Set up document ingestion pipeline
- Implement text extraction
- Add embedding generation
- Create retrieval API

### Week 3-4: Complete P1.2 (Broadcasts)
- Build audience segmentation
- Create template system
- Implement broadcast executor
- Add compliance features

### Week 5: Complete P1.3 (Feedback)
- Implement feedback triggers
- Add sentiment analysis
- Create service recovery workflow

### Week 6-7: Complete P2.1 (Insights)
- Set up warehouse events
- Implement pattern detection
- Build recommendation engine

### Week 8+: P2.2 and P2.3 (Advanced)
- Sandbox execution
- Browser automation

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
