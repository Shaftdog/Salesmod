# Email Bounce Handling - Test Flow Diagram

## System Flow & Test Coverage

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL BOUNCE HANDLING SYSTEM                 │
└─────────────────────────────────────────────────────────────────┘

                              INBOUND FLOW

┌─────────────────────────────────────────────────────────────────┐
│  1. EMAIL WEBHOOK EVENT (Resend)                                │
│     POST /api/email/webhook                                     │
│                                                                 │
│  Test Suite 1: Webhook Processing (7 tests)                    │
│  ├─ Test 1.1: Hard Bounce ✓                                    │
│  ├─ Test 1.2: Soft Bounce (1st) ✓                              │
│  ├─ Test 1.3: Soft Bounce (2nd) ✓                              │
│  ├─ Test 1.4: Soft Bounce (3rd - triggers suppression) ✓       │
│  ├─ Test 1.5: Unknown Contact ✓                                │
│  ├─ Test 1.6: Invalid Payload ✓                                │
│  └─ Test 1.7: Multiple Bounces ✓                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                   WEBHOOK PROCESSING LOGIC
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
    HARD BOUNCE                               SOFT BOUNCE
    (Permanent)                               (Transient)
        │                                           │
        ↓                                           ↓
┌──────────────────┐                     ┌──────────────────────┐
│ IMMEDIATE ACTION │                     │  TRACKING LOGIC      │
│                  │                     │                      │
│ 1. Tag Contact   │                     │ If count < 3:        │
│    ↓             │                     │   - Track only       │
│   email_bounced_ │                     │   - No tag           │
│   hard           │                     │   - No notification  │
│                  │                     │                      │
│ 2. Suppress      │                     │ If count >= 3:       │
│    ↓             │                     │   - Tag contact      │
│   reason:bounce  │                     │     ↓                │
│   type:Permanent │                     │    email_bounced_    │
│   count:1        │                     │    soft              │
│                  │                     │   - Suppress         │
│ 3. Notify        │                     │     ↓                │
│    ↓             │                     │    reason:bounce     │
│   type:          │                     │    type:Transient    │
│   bounce_hard    │                     │    count:3           │
│   is_read:false  │                     │   - Notify           │
│                  │                     │     ↓                │
└──────────────────┘                     │    type:             │
                                         │    bounce_soft       │
                                         └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DATABASE STATE (After Webhook)                                 │
│                                                                 │
│  Test Suite 2: Contact Tagging (5 tests)                       │
│  ├─ Test 2.1: Add Tag ✓                                        │
│  ├─ Test 2.2: Idempotent Add ✓                                 │
│  ├─ Test 2.3: Remove Tag ✓                                     │
│  ├─ Test 2.4: Has Tag Check ✓                                  │
│  └─ Test 2.5: Tag Persistence ✓                                │
│                                                                 │
│  Tables Updated:                                                │
│  ┌────────────────────┐  ┌──────────────────────┐              │
│  │ contacts           │  │ email_suppressions   │              │
│  ├────────────────────┤  ├──────────────────────┤              │
│  │ tags: [            │  │ contact_id           │              │
│  │   "email_bounced_  │  │ reason: "bounce"     │              │
│  │    hard"           │  │ bounce_type          │              │
│  │ ]                  │  │ bounce_count         │              │
│  └────────────────────┘  │ last_bounce_at       │              │
│                          └──────────────────────┘              │
│  ┌──────────────────────────────┐                              │
│  │ email_notifications          │                              │
│  ├──────────────────────────────┤                              │
│  │ type: "bounce_hard"          │                              │
│  │ title: "Hard Bounce: John D" │                              │
│  │ is_read: false               │                              │
│  │ metadata: { bounce_type,     │                              │
│  │             email_id }       │                              │
│  └──────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘

                              OUTBOUND FLOW

┌─────────────────────────────────────────────────────────────────┐
│  2. JOB CREATION (User creates email campaign)                  │
│     Job Orchestrator → Job Planner                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. JOB PLANNER - Contact Selection                             │
│     src/lib/agent/job-planner.ts (lines 688-729)                │
│                                                                 │
│  Test Suite 3: Job Planner Filtering (5 tests)                 │
│  ├─ Test 3.1: Exclude Hard Bounce ✓                            │
│  ├─ Test 3.2: Exclude Soft Bounce ✓                            │
│  ├─ Test 3.3: Check Suppressions ✓                             │
│  ├─ Test 3.4: Include Valid ✓                                  │
│  └─ Test 3.5: Logging Accuracy ✓                               │
│                                                                 │
│  FILTERING LOGIC:                                               │
│  ┌──────────────────────────────────────┐                      │
│  │ 1. Query contacts matching filter    │                      │
│  │    (e.g., client_type = 'AMC')       │                      │
│  │         ↓ (e.g., 100 contacts)       │                      │
│  │                                      │                      │
│  │ 2. Filter by tags                    │                      │
│  │    Exclude: email_bounced_hard       │                      │
│  │    Exclude: email_bounced_soft       │                      │
│  │         ↓ (e.g., 95 contacts)        │                      │
│  │                                      │                      │
│  │ 3. Check suppressions table          │                      │
│  │    Exclude: any contact_id in        │                      │
│  │             email_suppressions       │                      │
│  │         ↓ (e.g., 90 contacts)        │                      │
│  │                                      │                      │
│  │ 4. Check already processed           │                      │
│  │    Exclude: contact_id in            │                      │
│  │             kanban_cards (this job)  │                      │
│  │         ↓ (e.g., 90 contacts)        │                      │
│  │                                      │                      │
│  │ 5. Apply avoidance rules             │                      │
│  │    Exclude: pattern matches          │                      │
│  │         ↓ (e.g., 88 contacts)        │                      │
│  │                                      │                      │
│  │ 6. Limit to batch size               │                      │
│  │         ↓ (e.g., 10 contacts)        │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  RESULT: 10 VALID CONTACTS for card creation                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. CARD CREATION                                               │
│     10 kanban cards created (one per contact)                   │
│     State: "suggested" or "approved" (depending on job mode)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. EMAIL EXECUTOR - Send Protection                            │
│     src/lib/agent/executor.ts (lines 273-319)                   │
│                                                                 │
│  Test Suite 4: Executor Protection (5 tests)                   │
│  ├─ Test 4.1: Block Hard Bounce ✓                              │
│  ├─ Test 4.2: Block Soft Bounce ✓                              │
│  ├─ Test 4.3: Block Suppressed ✓                               │
│  ├─ Test 4.4: Allow Valid ✓                                    │
│  └─ Test 4.5: Error Messages ✓                                 │
│                                                                 │
│  EXECUTION LOGIC (per card):                                   │
│  ┌──────────────────────────────────────┐                      │
│  │ Card approved?                       │                      │
│  │   No → Return error                  │                      │
│  │   Yes ↓                              │                      │
│  │                                      │                      │
│  │ Get contact_id from card             │                      │
│  │         ↓                            │                      │
│  │                                      │                      │
│  │ Check contact.tags                   │                      │
│  │   Has email_bounced_hard?            │                      │
│  │     Yes → BLOCK (error)              │                      │
│  │   Has email_bounced_soft?            │                      │
│  │     Yes → BLOCK (error)              │                      │
│  │   No ↓                               │                      │
│  │                                      │                      │
│  │ Check email_suppressions             │                      │
│  │   Contact suppressed?                │                      │
│  │     Yes → BLOCK (error + reason)     │                      │
│  │   No ↓                               │                      │
│  │                                      │                      │
│  │ ✓ SEND EMAIL (via Resend API)       │                      │
│  │         ↓                            │                      │
│  │                                      │                      │
│  │ Log activity                         │                      │
│  │ Mark card as "done"                  │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  BLOCKED CARD STATES:                                           │
│  - Card state: "blocked"                                        │
│  - Card description: Updated with error message                 │
│  - Result: { success: false, error: "..." }                     │
└─────────────────────────────────────────────────────────────────┘

                        NOTIFICATIONS FLOW

┌─────────────────────────────────────────────────────────────────┐
│  6. NOTIFICATIONS API                                           │
│     src/app/api/notifications/route.ts                          │
│                                                                 │
│  Test Suite 5: Notifications (8 tests)                         │
│  ├─ Test 5.1: GET All ✓                                        │
│  ├─ Test 5.2: GET Unread ✓                                     │
│  ├─ Test 5.3: GET By Type ✓                                    │
│  ├─ Test 5.4: PATCH Mark Read ✓                                │
│  ├─ Test 5.5: PATCH Mark Unread ✓                              │
│  ├─ Test 5.6: POST Mark All Read ✓                             │
│  ├─ Test 5.7: DELETE Notification ✓                            │
│  └─ Test 5.8: Unauthorized Access ✓                            │
│                                                                 │
│  ENDPOINTS:                                                     │
│  ┌────────────────────────────────────────────┐                │
│  │ GET /api/notifications                     │                │
│  │   ?unread=true                             │                │
│  │   ?type=bounce_hard                        │                │
│  │   ?limit=50                                │                │
│  │   ↓                                        │                │
│  │   Returns: { notifications[], unread_cnt } │                │
│  │                                            │                │
│  │ PATCH /api/notifications                   │                │
│  │   Body: { id, is_read }                    │                │
│  │   ↓                                        │                │
│  │   Updates: is_read status                  │                │
│  │                                            │                │
│  │ POST /api/notifications/mark-all-read      │                │
│  │   ↓                                        │                │
│  │   Updates: all to is_read = true           │                │
│  │                                            │                │
│  │ DELETE /api/notifications?id=...           │                │
│  │   ↓                                        │                │
│  │   Removes: notification record             │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘

                    END-TO-END INTEGRATION

┌─────────────────────────────────────────────────────────────────┐
│  Test Suite 6: E2E Integration (5 tests)                       │
│                                                                 │
│  Test 6.1: Complete Hard Bounce Flow                           │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 1. Create contact                                 │         │
│  │ 2. Trigger hard bounce webhook                    │         │
│  │ 3. Verify: tag, suppression, notification         │         │
│  │ 4. Create job targeting this contact              │         │
│  │ 5. Run planner                                    │         │
│  │ 6. Verify: contact excluded (0 cards)             │         │
│  │ 7. If card exists, attempt execution              │         │
│  │ 8. Verify: send blocked                           │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  Test 6.2: Complete Soft Bounce Flow (3 attempts)              │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 1. Create contact                                 │         │
│  │ 2. Send 1st soft bounce                           │         │
│  │ 3. Verify: tracking only (no tag)                 │         │
│  │ 4. Send 2nd soft bounce                           │         │
│  │ 5. Verify: still tracking (no tag)                │         │
│  │ 6. Send 3rd soft bounce                           │         │
│  │ 7. Verify: tag, suppression, notification         │         │
│  │ 8. Run job planner                                │         │
│  │ 9. Verify: contact excluded                       │         │
│  │ 10. Attempt execution                             │         │
│  │ 11. Verify: send blocked                          │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  Test 6.3: Job Batch Exclusion                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 1. Create cadence job (2 batches)                │         │
│  │ 2. Run batch 1 → 5 cards created                 │         │
│  │ 3. Trigger hard bounce for contact #3            │         │
│  │ 4. Run batch 2 → 4 cards created (exclude #3)    │         │
│  │ 5. Verify: batch 2 missing contact #3            │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  Test 6.4: Mixed Bounce States                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │ Setup:                                            │         │
│  │   2 hard bounced                                  │         │
│  │   1 soft bounced (3x)                             │         │
│  │   1 soft bounced (1x - still valid)               │         │
│  │   2 valid contacts                                │         │
│  │ Expected:                                         │         │
│  │   Cards created: 3 (1 soft 1x + 2 valid)         │         │
│  │   Excluded: 3 (2 hard + 1 soft 3x)               │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  Test 6.5: Dashboard Notification UI (Playwright UI test)      │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 1. Trigger bounce                                 │         │
│  │ 2. Navigate to notifications page                │         │
│  │ 3. Verify notification displayed                 │         │
│  │ 4. Click "Mark as Read"                           │         │
│  │ 5. Verify badge count decreases                  │         │
│  └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘

                         EDGE CASES

┌─────────────────────────────────────────────────────────────────┐
│  Test Suite 7: Edge Cases (4 tests)                            │
│                                                                 │
│  Test 7.1: Array of Recipients                                 │
│    Webhook data.to = ["user1@...", "user2@..."]                │
│    → Extract first email, process normally                     │
│                                                                 │
│  Test 7.2: Orphaned Contact (no client)                        │
│    Contact with invalid client_id                              │
│    → Webhook logs error, gracefully fails                      │
│                                                                 │
│  Test 7.3: Concurrent Bounces                                  │
│    3 simultaneous webhooks for same contact                    │
│    → Database handles concurrency correctly                    │
│                                                                 │
│  Test 7.4: Large Notification List                             │
│    500 notifications in database                               │
│    → API pagination works, response < 500ms                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TEST SUMMARY                             │
│                                                                 │
│  Total Tests: 46                                                │
│  ├─ Suite 1 (Webhook): 7 tests                                 │
│  ├─ Suite 2 (Tagging): 5 tests                                 │
│  ├─ Suite 3 (Planner): 5 tests                                 │
│  ├─ Suite 4 (Executor): 5 tests                                │
│  ├─ Suite 5 (Notifications): 8 tests                           │
│  ├─ Suite 6 (E2E): 5 tests                                     │
│  └─ Suite 7 (Edge Cases): 4 tests                              │
│                                                                 │
│  Critical Path (Must Pass 100%): 18 tests                      │
│  High Priority (90%+ pass rate): 20 tests                      │
│  Medium/Low Priority (75%+ pass rate): 8 tests                 │
│                                                                 │
│  Coverage Targets:                                              │
│  - Webhook Handler: 95%+                                        │
│  - Job Planner: 90%+                                            │
│  - Email Executor: 95%+                                         │
│  - Notifications API: 85%+                                      │
│                                                                 │
│  Performance Benchmarks:                                        │
│  - Webhook: < 200ms                                             │
│  - Planner (1000 contacts): < 1s                                │
│  - Executor check: < 50ms                                       │
│  - Notifications API: < 300ms                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Test Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST EXECUTION PIPELINE                      │
└─────────────────────────────────────────────────────────────────┘

    PLAYWRIGHT-TESTER AGENT
            ↓
    ┌───────────────┐
    │ Phase 1       │ → Foundation Tests (Suites 1-2)
    │ Days 1-2      │    - Webhook processing
    └───────┬───────┘    - Database tagging
            │
            ↓ PASS
    ┌───────────────┐
    │ Phase 2       │ → Protection Tests (Suites 3-4)
    │ Day 3         │    - Planner filtering
    └───────┬───────┘    - Executor blocking
            │
            ↓ PASS
    ┌───────────────┐
    │ Phase 3       │ → API Tests (Suite 5)
    │ Day 4         │    - Notifications endpoints
    └───────┬───────┘
            │
            ↓ PASS
    ┌───────────────┐
    │ Phase 4       │ → Integration Tests (Suites 6-7)
    │ Days 5-6      │    - E2E flows
    └───────┬───────┘    - Edge cases
            │
            ↓ PASS
    ┌───────────────┐
    │ COMPLETE      │ → All 46 tests passing
    │ ✅ Ready      │    Coverage targets met
    └───────────────┘


    IF FAIL ❌
            │
            ↓
    DEBUGGER-SPECIALIST AGENT
            │
    ┌───────────────┐
    │ 1. Analyze    │ → Review failure
    │    Bug        │    Reproduce locally
    └───────┬───────┘
            │
            ↓
    ┌───────────────┐
    │ 2. Fix Bug    │ → Surgical fix
    │               │    Add logging
    └───────┬───────┘
            │
            ↓
    ┌───────────────┐
    │ 3. Verify     │ → Re-run test
    │    Fix        │    Check state
    └───────┬───────┘
            │
            ↓
    BACK TO PLAYWRIGHT-TESTER
            │
            ↓
    Re-test → PASS → Continue
```

---

**Visual Reference Created**
**File**: `/EMAIL-BOUNCE-TEST-FLOW.md`
**Purpose**: Visual understanding of test coverage and execution flow
**Last Updated**: 2025-01-12
