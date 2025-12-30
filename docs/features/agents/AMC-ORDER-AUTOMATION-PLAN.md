# AMC Order Automation System - Implementation Plan

**Status:** Planning Complete - Pending Implementation
**Created:** 2025-12-30
**Author:** Claude Code

---

## Overview

Build an autonomous system that processes incoming AMC order emails through a decision pipeline: client approval check → geographic coverage → due date feasibility → bid calculation → price comparison → order acceptance.

## User's Decision Flow

```
New Order Email
    │
    ▼
┌─────────────────────────────────┐
│ 1. Is Client Approved?          │
│    YES → continue               │
│    NO  → Route to AMC Manager   │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 2. Is Order In Our Area?        │
│    YES → continue               │
│    NO  → Decline (out of area)  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 3. Can We Meet Due Date?        │
│    YES → continue               │
│    NO  → Decline (can't meet)   │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 4. Calculate Our Bid            │
│    - Base product scope         │
│    - Property feature modifiers │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 5. Is AMC Price Within $50?     │
│    YES → Accept                 │
│    NO  → Accept with Counter    │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 6. Execute Acceptance           │
│    Try: Email Link              │
│    Try: Portal Login            │
│    Try: Email Reply             │
│    Fallback: Manual Task        │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 7. Create Order & Notify        │
│    - Create order in system     │
│    - Create production card     │
│    - Notify admin staff         │
└─────────────────────────────────┘
```

---

## Phased Implementation

### Phase 1: Foundation (Database + Config)

#### Migration 1: AMC Client Approval

**File:** `supabase/migrations/20251230000001_add_amc_approval_fields.sql`

Add to `clients` table:
- `is_approved_amc` BOOLEAN DEFAULT false
- `amc_approved_at` TIMESTAMPTZ
- `amc_approved_by` UUID
- `amc_portal_config_id` UUID (links to vendor_portal_configs)

#### Migration 2: AMC Automation Config

**File:** `supabase/migrations/20251230000002_create_amc_automation_config.sql`

**Tables to create:**

1. **amc_automation_config** (tenant-level settings)
   - `is_enabled` BOOLEAN - Master toggle
   - `auto_accept_enabled` BOOLEAN - Fully autonomous acceptance
   - `auto_decline_enabled` BOOLEAN - Auto-decline out-of-area/infeasible
   - `price_tolerance_dollars` DECIMAL (default $50)
   - `max_capacity_percent` INTEGER (default 80%)
   - `min_days_before_due` INTEGER (default 2)

2. **amc_order_decisions** (audit trail)
   - Links to: gmail_message, kanban_card, order, client
   - Stores: extracted_data, client_check, geographic_check, due_date_check
   - Stores: bid_calculation, price_comparison, decision, acceptance_result

3. **amc_decline_templates** (response templates)
   - `decline_reason`: out_of_area, due_date_infeasible, capacity_full
   - `subject_template`, `body_template` with {{variables}}

#### Admin UI

**Files to create:**
- `src/app/(app)/admin/amc-automation/page.tsx` - Settings page
- `src/components/admin/amc-automation-settings.tsx` - Config form
- `src/components/clients/amc-approval-toggle.tsx` - Client approval UI

---

### Phase 2: Decision Pipeline Core

#### Entity Extractor

**File:** `src/lib/amc-automation/entity-extractor.ts`

Extract from email:
```typescript
interface AmcOrderEntities {
  orderNumber?: string;
  propertyAddress?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  amcFee?: number;
  dueDate?: Date;
  orderType?: 'purchase' | 'refinance' | 'home_equity' | 'other';
  scope?: 'full_interior' | 'exterior_only' | 'desktop' | 'drive_by';
  loanNumber?: string;
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  portalLink?: string;
  acceptanceDeadline?: Date;
}
```

#### Decision Engine

**File:** `src/lib/amc-automation/decision-engine.ts`

Main function:
```typescript
export async function processAmcOrderEmail(
  tenantId: string,
  gmailMessageId: string,
  classification: EmailClassification
): Promise<AmcOrderDecision>
```

Pipeline steps:
1. `checkClientApproval()` - Lookup client by sender email, check `is_approved_amc`
2. `checkGeographicCoverage()` - Query `service_territories.zip_codes`
3. `checkDueDateFeasibility()` - Calculate researcher capacity
4. `calculateBid()` - Use products system for pricing
5. `comparePrice()` - Check if within tolerance
6. `executeAcceptance()` - Try acceptance methods in order

#### Coverage Checker

**File:** `src/lib/amc-automation/coverage-checker.ts`

```typescript
export async function checkZipCodeCoverage(
  tenantId: string,
  zipCode: string
): Promise<{
  inCoverage: boolean;
  matchingTerritories: Territory[];
  nearestTerritory?: Territory;
}>
```

Query:
```sql
SELECT * FROM service_territories
WHERE org_id IN (SELECT id FROM profiles WHERE tenant_id = $1)
AND $2 = ANY(zip_codes)
AND is_active = true
```

#### Capacity Analyzer

**File:** `src/lib/amc-automation/capacity-analyzer.ts`

```typescript
export async function analyzeResearcherCapacity(
  tenantId: string,
  targetDate: Date
): Promise<{
  overallCapacityPercent: number;
  researcherCapacity: ResourceCapacity[];
  canAcceptOrder: boolean;
  estimatedCompletionDate?: Date;
}>
```

Query researcher workload from `production_resources` and `production_tasks`.

Calculate:
```
capacityPercent = max(taskCount/maxDailyTasks, hours/maxWeeklyHours) × 100
```

---

### Phase 3: Bid Calculation

#### Bid Calculator

**File:** `src/lib/amc-automation/bid-calculator.ts`

Logic:
1. Determine scope from email (full_interior, exterior_only, desktop)
2. Look up core product for scope
3. Apply modifiers (site influence, acreage, complex)
4. Use `calculate_product_price()` for SF-based pricing
5. Sum all line items for total bid

```typescript
export async function calculateOrderBid(
  tenantId: string,
  orderDetails: {
    scope: 'full_interior' | 'exterior_only' | 'desktop' | 'drive_by';
    squareFootage?: number;
    lotSize?: number;
    propertyType?: string;
    modifiers?: {
      siteInfluence?: boolean;
      acreage?: boolean;
      complex?: boolean;
    };
  }
): Promise<{
  totalBid: number;
  breakdown: PriceBreakdown[];
  products: Product[];
}>
```

#### API Endpoint

**File:** `src/app/api/amc-automation/calculate-bid/route.ts`

```
POST /api/amc-automation/calculate-bid
Body: { scope, squareFootage?, propertyType?, modifiers }
Response: { totalBid, breakdown, products }
```

---

### Phase 4: Order Acceptance

#### Acceptance Executor

**File:** `src/lib/amc-automation/acceptance-executor.ts`

Try methods in order:
1. **Email Link** - Parse accept link from email body, simulate click
2. **Portal Automation** - Use existing `acceptOrder()` from P2 browser automation
3. **Email Reply** - Send templated acceptance email
4. **Manual Task** - Create kanban card for human intervention

```typescript
export async function executeOrderAcceptance(
  tenantId: string,
  decision: AmcOrderDecision,
  emailContent: GmailMessage
): Promise<AcceptanceResult>
```

#### Integration Point

**File:** `src/lib/agent/email-to-card.ts` (MODIFY lines 309-334)

```typescript
case 'AMC_ORDER':
  const config = await getAmcAutomationConfig(tenantId);
  if (config?.is_enabled) {
    // Queue for automated processing
    await processAmcOrderEmail(tenantId, gmailMessageId, classification);
    return {
      cardType: 'create_task',
      state: 'executing',  // Show automation in progress
      priority: 'high',
      autoExecute: false,
    };
  }
  // Fallback to manual review (existing behavior)
  return { cardType: 'create_task', state: 'in_review', priority: 'high', autoExecute: false };
```

---

### Phase 5: Order Creation & Notifications

#### Auto-Create Order

After successful acceptance:
1. Call existing `createOrder` tool with extracted data
2. Create `production_card` for workflow
3. Log activity linking email → order

#### Notifications (Future Enhancement)

- Teams/Slack webhook (defer for now)
- Create task for admin staff (use existing kanban system)
- Email notification to user

---

## Files Summary

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/agent/email-to-card.ts:309-334` | Add AMC automation check before creating card |
| `src/lib/agent/email-classifier.ts` | Enhance entity extraction for AMC fields |

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/20251230000001_add_amc_approval_fields.sql` | Client approval field |
| `supabase/migrations/20251230000002_create_amc_automation_config.sql` | Config tables |
| `src/lib/amc-automation/decision-engine.ts` | Main orchestration |
| `src/lib/amc-automation/entity-extractor.ts` | Parse email for order data |
| `src/lib/amc-automation/coverage-checker.ts` | Geographic check |
| `src/lib/amc-automation/capacity-analyzer.ts` | Researcher workload check |
| `src/lib/amc-automation/bid-calculator.ts` | Price calculation |
| `src/lib/amc-automation/acceptance-executor.ts` | Multi-strategy acceptance |
| `src/lib/amc-automation/types.ts` | TypeScript interfaces |
| `src/lib/amc-automation/index.ts` | Module exports |
| `src/app/api/amc-automation/config/route.ts` | Config API |
| `src/app/api/amc-automation/process-order/route.ts` | Process API |
| `src/app/api/amc-automation/calculate-bid/route.ts` | Bid API |
| `src/app/api/amc-automation/check-coverage/route.ts` | Coverage API |
| `src/app/(app)/admin/amc-automation/page.tsx` | Admin settings UI |
| `src/components/admin/amc-automation-settings.tsx` | Settings form |
| `src/components/clients/amc-approval-toggle.tsx` | Client approval toggle |

---

## Existing Infrastructure to Leverage

| Component | Location | Usage |
|-----------|----------|-------|
| Service Territories | `service_territories.zip_codes[]` | Geographic coverage lookup |
| Products/Pricing | `products` table + `calculate_product_price()` | Bid calculation |
| Production Resources | `production_resources` + workload hooks | Capacity check |
| Browser Automation | `src/lib/browser-automation/order-acceptor.ts` | Portal acceptance |
| Credential Vault | `credential_vault` table | Portal login credentials |
| Email Classification | `email-classifier.ts` | Entity extraction base |
| Order Creation Tool | `anthropic-tool-executor.ts:createOrder` | Order record creation |

---

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `is_enabled` | false | Master toggle for automation |
| `auto_accept_enabled` | false | Allow fully autonomous acceptance |
| `auto_decline_enabled` | true | Auto-decline out-of-area/infeasible |
| `price_tolerance_dollars` | 50.00 | Accept if within $X of bid |
| `max_capacity_percent` | 80 | Decline if researchers over X% |
| `min_days_before_due` | 2 | Minimum business days lead time |
| `default_fallback_action` | create_task | What to do if automation fails |

---

## Suggested Build Order

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | Migrations + Admin UI for config |
| 2 | Pipeline Start | Entity extraction + Client approval + Geographic check |
| 3 | Feasibility | Capacity analyzer + Due date check |
| 4 | Pricing | Bid calculator + Price comparison |
| 5 | Acceptance | Acceptance executor + email-to-card integration |
| 6 | Polish | Testing + Documentation + Edge cases |

---

## Success Criteria

- [ ] AMC emails from approved clients auto-process without human intervention
- [ ] Out-of-area orders auto-decline with templated response
- [ ] Infeasible due dates auto-decline with explanation
- [ ] Bids calculated accurately using products system
- [ ] Price comparison triggers accept or counter-offer
- [ ] Orders created automatically on acceptance
- [ ] Full audit trail in `amc_order_decisions` table
- [ ] Admin UI to configure thresholds and templates
- [ ] Manual fallback works when automation fails

---

## Resources Needed (from User's List)

| Resource | Implementation |
|----------|----------------|
| List of Covered Zip Codes | Use existing `service_territories.zip_codes[]` |
| Bid Parameters | Products table + modifiers |
| Logins to Client Websites | Credential vault (P2) |
| Database with approved clients | Add `is_approved_amc` to clients table |
| Billing Manager (credit limits) | Existing client credit system |

---

## Notes

- Teams/Slack notifications deferred - can add webhook integration later
- Property research for bid calculation may require additional API calls (county records, etc.)
- Portal automation depends on P2 browser automation being operational
- Start with single AMC for testing, then expand to all approved AMCs
