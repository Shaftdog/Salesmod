---
status: current
last_verified: 2025-12-17
updated_by: Claude Code
---

# vNext Autonomous Agent Implementation Spec

## Executive Summary

This document outlines the implementation plan for transforming the current agent system into a fully autonomous, always-on AI Account Manager. The system will operate on an hourly Plan → Act → React → Reflect cycle with comprehensive policy guardrails.

## Current State Analysis

### What Exists
| Component | Status | Location |
|-----------|--------|----------|
| Agent Orchestrator | ✅ Working | `src/lib/agent/orchestrator.ts` |
| Context Builder | ✅ Working | `src/lib/agent/context-builder.ts` |
| AI Planner | ✅ Working | `src/lib/agent/planner.ts` |
| Card Executor | ✅ Working | `src/lib/agent/executor.ts` |
| Gmail Poller | ✅ Working (manual trigger) | `src/lib/agent/gmail-poller.ts` |
| Job System | ✅ Working | `src/lib/agent/job-planner.ts` |
| Card Scheduler | ✅ Basic (promotes scheduled cards) | `src/lib/agent/scheduler.ts` |
| Reflection System | ⚠️ Exists but not wired | DB tables exist |
| Agent Memories | ⚠️ Basic storage only | No TTL/pruning |

### What's Missing
- **No autonomous scheduler** - Requires manual API calls
- **No always-on Gmail** - Only runs when UI is open
- **No policy enforcement** - Missing guardrails for task creation
- **No 21-day engagement engine** - Not tracking touch compliance
- **No hourly Plan→Act→React→Reflect cycle**
- **No order processing automation** - Pricing/credit validation
- **No document library** - No RAG for documents
- **No data warehouse/insights engine**

---

## Implementation Phases

### Phase 0 (P0): Make It Truly Autonomous

**Priority: CRITICAL - Foundation for all other features**

#### P0.1: Hourly Autonomous Scheduler

**Goal**: Agent runs every hour without human intervention

**New Files to Create**:
```
src/lib/agent/autonomous-scheduler.ts   # Core scheduler logic
src/app/api/cron/agent/route.ts         # Vercel cron endpoint
src/lib/agent/tenant-lock.ts            # Per-tenant locking
```

**Database Changes**:
```sql
-- New table for tracking autonomous runs
CREATE TABLE agent_autonomous_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cycle_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  phase TEXT NOT NULL, -- 'plan', 'act', 'react', 'reflect'
  status TEXT NOT NULL DEFAULT 'running',
  metrics JSONB DEFAULT '{}',
  work_block JSONB DEFAULT '{}', -- The traceable work block record
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lock table for preventing concurrent runs
CREATE TABLE agent_tenant_locks (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
  locked_at TIMESTAMPTZ NOT NULL,
  locked_by TEXT NOT NULL, -- Instance ID
  expires_at TIMESTAMPTZ NOT NULL
);
```

**vercel.json Addition**:
```json
{
  "crons": [
    {
      "path": "/api/cron/agent",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/gmail",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Implementation**:
```typescript
// src/lib/agent/autonomous-scheduler.ts
export interface WorkBlock {
  id: string;
  tenantId: string;
  cycleNumber: number;
  startedAt: Date;
  phase: 'plan' | 'act' | 'react' | 'reflect';
  planOutput?: PlanOutput;
  actOutput?: ActOutput;
  reactOutput?: ReactOutput;
  reflectOutput?: ReflectOutput;
}

export async function runAutonomousCycle(tenantId: string): Promise<WorkBlock> {
  // 1. Acquire lock (prevent overlapping runs)
  // 2. Check for missed hours (catch-up behavior)
  // 3. Run Plan → Act → React → Reflect
  // 4. Write work block record
  // 5. Release lock
}
```

#### P0.2: Always-On Gmail Ingestion

**Goal**: Gmail syncs continuously even without browser open

**Option A: Gmail Push (Recommended)**
```
src/app/api/webhooks/gmail/route.ts     # Gmail push webhook
src/lib/gmail/watch-manager.ts          # Manage Gmail watches
```

**Option B: Polling Fallback**
```
src/app/api/cron/gmail/route.ts         # Cron-based polling
```

**Implementation Details**:
- Gmail Watch → Google Pub/Sub → webhook → agent inbox handler
- Fallback: historyId-based incremental sync every 5 minutes
- Auto-renew watch before 7-day expiration

**Required Behaviors**:
1. Save all contact info from emails automatically
2. Extract roles/titles when possible
3. Create/update contacts automatically
4. Link emails to Accounts/Deals/Orders where possible

#### P0.3: Policy Enforcement Engine

**Goal**: Enforce guardrails on all agent actions

**New Files**:
```
src/lib/agent/policy-engine.ts          # Policy validator
src/lib/agent/policy-rules.ts           # Rule definitions
```

**Policy Rules**:

```typescript
// src/lib/agent/policy-rules.ts
export const POLICY_RULES = {
  // Rule 1: No human tasks unless client-requested
  NO_HUMAN_TASKS_UNLESS_REQUESTED: {
    id: 'no-human-tasks',
    validate: (action: ProposedAction, context: ActionContext) => {
      if (action.type !== 'create_task') return { valid: true };

      // Allow only if:
      // 1. Inbound email contains explicit ask
      // 2. Compliance deadline is due
      // 3. Safety escalation required
      return checkTaskJustification(action, context);
    }
  },

  // Rule 2: Research only after contacts exhausted
  RESEARCH_AFTER_EXHAUSTION: {
    id: 'research-after-exhaustion',
    validate: (action: ProposedAction, context: ActionContext) => {
      if (action.type !== 'research') return { valid: true };

      // Allow research only if:
      // 1. Engagement compliance is met (no 21-day violations)
      // 2. Goals are behind pace OR pipeline coverage is thin
      return checkResearchEligibility(action, context);
    }
  }
};
```

**Integration Point**:
- Add policy validation before card creation in orchestrator
- Log policy violations to `agent_policy_violations` table
- Block actions that fail policy validation

#### P0.4: 21-Day Engagement Engine

**Goal**: Ensure every contact is touched at least every 21 days

**Database Changes**:
```sql
-- Engagement clock per contact/account
CREATE TABLE engagement_clocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL, -- 'contact' or 'account'
  entity_id UUID NOT NULL,
  last_touch_at TIMESTAMPTZ,
  last_touch_type TEXT, -- 'email', 'call', 'meeting', etc.
  last_touch_by TEXT, -- 'agent' or user_id
  next_touch_due TIMESTAMPTZ,
  touch_count_30d INTEGER DEFAULT 0,
  priority_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, entity_id)
);

CREATE INDEX idx_engagement_clocks_due ON engagement_clocks(tenant_id, next_touch_due);
```

**New Files**:
```
src/lib/agent/engagement-engine.ts      # 21-day compliance engine
```

**Implementation**:
```typescript
export async function selectNextContactsToTouch(
  tenantId: string,
  limit: number = 10
): Promise<EngagementTarget[]> {
  // Priority scoring:
  // 1. High value clients
  // 2. High churn risk
  // 3. Active orders/deals
  // 4. Missed engagement (>21 days)

  // Returns prioritized list of contacts needing touch
}

export async function updateEngagementClock(
  tenantId: string,
  entityType: 'contact' | 'account',
  entityId: string,
  touchType: string
): Promise<void> {
  // Update last_touch_at, calculate next_touch_due
}
```

#### P0.5: Order Processing Workflow

**Goal**: Automatically process new orders with validation

**New Files**:
```
src/lib/agent/order-processor.ts        # Order validation & processing
src/lib/agent/pricing-validator.ts      # Pricing validation
src/lib/agent/credit-checker.ts         # Credit approval logic
```

**Required Checks**:
1. Validate pricing (correct service/product + rate)
2. Check credit approval for bills
3. Confirm vendor/client requirements (attachments, insurance)
4. Create structured exception record if anything fails

---

### Phase 1 (P1): Scale the Intelligence

#### P1.1: Documents Library

**Goal**: Ingest and index documents for RAG retrieval

**Database Changes**:
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- 'contract', 'invoice', 'sop', 'bid', 'attachment'
  source_type TEXT, -- 'email', 'order', 'upload'
  source_id UUID,
  vendor_id UUID REFERENCES clients(id),
  client_id UUID REFERENCES clients(id),
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  content_text TEXT, -- Extracted text
  content_embedding VECTOR(1536), -- For RAG
  effective_date DATE,
  expiration_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**New Files**:
```
src/lib/documents/document-service.ts   # CRUD operations
src/lib/documents/document-ingester.ts  # Parse & extract text
src/lib/documents/document-embedder.ts  # Generate embeddings
src/lib/documents/document-retriever.ts # RAG retrieval
```

#### P1.2: Broadcast Audiences & Templates

**Goal**: Send targeted broadcasts to segmented audiences

**Database Changes**:
```sql
CREATE TABLE audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL, -- Filter rules
  contact_count INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE broadcast_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Available merge fields
  requires_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_id UUID REFERENCES broadcast_templates(id),
  audience_id UUID REFERENCES audience_segments(id),
  status TEXT NOT NULL DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Audience Rule Examples**:
```json
{
  "rules": [
    {"field": "client_type", "operator": "equals", "value": "enterprise"},
    {"field": "revenue_band", "operator": "gte", "value": 50000},
    {"field": "order_recency_days", "operator": "lte", "value": 90},
    {"field": "engagement_status", "operator": "equals", "value": "active"}
  ]
}
```

#### P1.3: Feedback Automation

**Goal**: Automatically request feedback 7 days after delivery

**New Files**:
```
src/lib/agent/feedback-engine.ts        # Feedback orchestration
src/lib/agent/feedback-templates.ts     # Email templates
src/lib/agent/sentiment-analyzer.ts     # Analyze responses
```

**Logic**:
1. Trigger: 7 days after delivery, unless there's an open case
2. Send feedback request email
3. If negative sentiment in response: open case + service recovery
4. Store feedback + associate to order/client

---

### Phase 2 (P2): Compound Advantage

#### P2.1: Data Warehouse & Insights Engine

**Goal**: Pattern detection and success strategy recommendations

**Database Changes**:
```sql
CREATE TABLE warehouse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE client_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id),
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence DECIMAL(5,4),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE success_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  strategy_type TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB NOT NULL,
  effectiveness_score DECIMAL(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Insight Jobs**:
- **Hourly**: "What changed since last hour?"
- **Daily**: Summaries + anomalies
- **Weekly**: Patterns + playbooks

#### P2.2: Sandbox Code Execution

**Goal**: Agent can prototype solutions safely

**Security Requirements**:
- Isolated container/sandbox
- Strict time/memory limits (30s, 512MB)
- No secrets exposed
- Whitelisted libraries only
- Audited input/output

**Use Cases**:
- Data transforms
- Generating exports
- Validation scripts
- Quick utilities

#### P2.3: Browser Automation for Order Acceptance

**Goal**: Accept orders from vendor portals automatically

**Requirements**:
- Headless browser (Playwright)
- Allow-listed domains only
- Full trace recording (screenshots/logs)
- Human approval for first-time workflows

---

## Core Workstreams Implementation

### D1: New Orders Processing

```typescript
// src/lib/agent/order-processor.ts
export async function processNewOrder(orderId: string): Promise<OrderProcessingResult> {
  const order = await getOrder(orderId);

  // Step 1: Validate pricing
  const pricingResult = await validatePricing(order);
  if (!pricingResult.valid) {
    return createException('pricing_error', pricingResult.errors);
  }

  // Step 2: Check credit approval for bills
  if (order.isBill) {
    const creditResult = await checkCreditApproval(order.clientId);
    if (!creditResult.approved) {
      return createException('credit_hold', creditResult.reason);
    }
  }

  // Step 3: Validate requirements
  const reqResult = await validateRequirements(order);
  if (!reqResult.complete) {
    return createException('missing_requirements', reqResult.missing);
  }

  // Step 4: Process order
  return await finalizeOrder(order);
}
```

### D2: Deals/Opportunities

**Hourly Actions**:
1. Identify stalled deals (no movement in X days)
2. Send follow-ups
3. Create/advance deals when signals indicate opportunity
4. Ask for next step

**KPIs to Track**:
- Deal aging reduction
- Stage progression
- Close rate

### D3: Quotes/Bids

**End-to-End Process**:
1. Confirm bid submission receipt
2. Contact bid submitter for intel
3. Produce competitive bid
4. Follow up until win/loss
5. On loss: capture reason + store pattern

### D4: Account Compliance (Quarterly)

**Required Behaviors**:
1. Identify accounts due this quarter
2. Check vendor manager status fields
3. Update missing items
4. Trigger reminders/notifications

---

## Hourly Operating Loop

```typescript
// src/lib/agent/autonomous-cycle.ts
export async function runHourlyCycle(tenantId: string): Promise<CycleResult> {
  const workBlock = await initWorkBlock(tenantId);

  try {
    // PLAN: Gather inputs and prioritize actions
    const planOutput = await planPhase(tenantId, {
      orderGoalsStatus: await getGoalStatus(tenantId),
      newOrders: await getNewOrders(tenantId),
      pendingOrders: await getPendingOrders(tenantId),
      staleDeals: await getStaleDeals(tenantId),
      pendingQuotes: await getPendingQuotes(tenantId),
      engagementViolations: await get21DayViolations(tenantId),
      emailUpdates: await getNewEmails(tenantId),
      vendorCompliance: await getComplianceDue(tenantId),
    });

    // ACT: Execute prioritized actions
    const actOutput = await actPhase(tenantId, planOutput.actionQueue);

    // REACT: Process outcomes from actions
    const reactOutput = await reactPhase(tenantId, actOutput.results);

    // REFLECT: Write reflection record
    const reflectOutput = await reflectPhase(tenantId, {
      whatWeDid: actOutput.summary,
      whatMovedMetrics: reactOutput.metricChanges,
      whatGotBlocked: actOutput.blockers,
      whatWeWillTryNext: planOutput.deferredActions,
      hypotheses: await generateHypotheses(planOutput, actOutput, reactOutput),
    });

    return { success: true, workBlock };
  } catch (error) {
    await recordCycleError(workBlock.id, error);
    return { success: false, error };
  }
}
```

---

## Action Classification

### System Actions (Autonomous)
These execute without human intervention:
- Process new orders (validate pricing, credit check)
- Create/update CRM entities
- Enrich contacts
- Update engagement timestamps
- Trigger feedback workflow
- Run research when eligible

### Human Actions (Require Approval)
Only created when explicitly client-requested:
- "Client asked for a call Thursday" → schedule task
- "Client asked for a revised bid by 3PM" → task

---

## Migration Path

### Week 1: P0.1 + P0.2
- Implement hourly scheduler with Vercel cron
- Add tenant locking mechanism
- Implement Gmail push webhooks

### Week 2: P0.3 + P0.4
- Build policy enforcement engine
- Implement 21-day engagement engine
- Wire engagement tracking to context builder

### Week 3: P0.5
- Order processing workflow
- Pricing validation
- Credit check integration

### Week 4: Testing & Stabilization
- End-to-end testing
- Load testing for multiple tenants
- Error handling refinement

---

## Monitoring & Observability

### Metrics to Track
- Cycles completed per hour
- Actions executed per cycle
- Policy violations blocked
- Engagement compliance rate
- Order processing success rate
- Email send rate and deliverability

### Alerts
- Cycle failures
- Lock contention
- Policy violation spikes
- Engagement compliance drops below threshold

---

## File Structure Summary

```
src/lib/agent/
├── autonomous-scheduler.ts     # P0.1: Hourly scheduler
├── tenant-lock.ts              # P0.1: Tenant locking
├── autonomous-cycle.ts         # P0.1: Plan→Act→React→Reflect
├── policy-engine.ts            # P0.3: Policy enforcement
├── policy-rules.ts             # P0.3: Rule definitions
├── engagement-engine.ts        # P0.4: 21-day compliance
├── order-processor.ts          # P0.5: Order validation
├── pricing-validator.ts        # P0.5: Pricing checks
├── credit-checker.ts           # P0.5: Credit approval
├── feedback-engine.ts          # P1.3: Feedback automation
├── sentiment-analyzer.ts       # P1.3: Response analysis
└── insights-engine.ts          # P2.1: Pattern detection

src/lib/documents/
├── document-service.ts         # P1.1: CRUD
├── document-ingester.ts        # P1.1: Text extraction
├── document-embedder.ts        # P1.1: Embeddings
└── document-retriever.ts       # P1.1: RAG

src/lib/gmail/
├── watch-manager.ts            # P0.2: Gmail push
└── gmail-service.ts            # Existing

src/app/api/cron/
├── agent/route.ts              # P0.1: Hourly agent cron
└── gmail/route.ts              # P0.2: Gmail polling cron

src/app/api/webhooks/
└── gmail/route.ts              # P0.2: Gmail push webhook
```

---

## Success Criteria

### P0 Complete When:
- [ ] Agent runs hourly without human intervention
- [ ] Gmail syncs continuously (push or 5-min poll)
- [ ] No human tasks created unless client-requested
- [ ] All contacts touched at least every 21 days
- [ ] New orders validated automatically

### P1 Complete When:
- [ ] Documents ingested and searchable via RAG
- [ ] Broadcasts sent to targeted audiences
- [ ] Feedback collected 7 days post-delivery

### P2 Complete When:
- [ ] Patterns detected and strategies recommended
- [ ] Code execution available in sandbox
- [ ] Orders accepted from vendor portals automatically
