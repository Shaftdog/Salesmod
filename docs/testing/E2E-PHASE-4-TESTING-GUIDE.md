---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Phase 4 Learning System - End-to-End Testing Guide 🧪

## Test Environment
- **URL**: http://localhost:9002/agent
- **Status**: ✅ Dev server running
- **Compilation**: ✅ All components compiled successfully

---

## Pre-Test Setup

### 1. Verify Agent Page Loads
- [ ] Navigate to http://localhost:9002/agent
- [ ] Verify page loads without errors
- [ ] Verify all 4 tabs are visible:
  - Board (Kanban icon)
  - Learning (Brain icon)
  - Rules (Settings icon)
  - Automation (Zap icon) ⚡ **NEW**

### 2. Check Stats Cards
- [ ] Verify 4 stat cards display:
  - Total Cards
  - Emails Sent
  - Approval Rate
  - Completion Rate

---

## Test Suite 1: Board Tab (Baseline)

### Test 1.1: Kanban Board Display
- [ ] Click "Board" tab
- [ ] Verify Jobs Filter Bar displays
- [ ] Verify Kanban Board renders
- [ ] Check columns: Suggested, Approved, Completed, Rejected

### Test 1.2: Card Interactions
- [ ] Click on a card
- [ ] Verify email draft sheet opens (for send_email cards)
- [ ] Verify card detail sheet opens (for other card types)
- [ ] Close the sheet

**Expected Result**: All baseline features work correctly

---

## Test Suite 2: Learning Tab (Phase 4.2)

### Test 2.1: Dashboard Display
- [ ] Click "Learning" tab
- [ ] Verify loading spinner appears briefly
- [ ] Verify dashboard loads with sections:
  - Key Metrics (4 cards)
  - Feedback Breakdown
  - Top Rejection Reasons
  - Recent Learning Rules
  - Success Rate Trend (30-day chart)

### Test 2.2: Metrics Validation
- [ ] Check Success Rate card:
  - [ ] Displays percentage
  - [ ] Shows color coding (green ≥70%, yellow 50-69%, red <50%)
  - [ ] Shows trend arrow (up/down)
- [ ] Check Total Feedback card
- [ ] Check Learning Velocity card with progress bar
- [ ] Check Rule Effectiveness card with progress bar

### Test 2.3: Chart Interaction
- [ ] Hover over bars in Success Rate Trend chart
- [ ] Verify tooltip shows:
  - Date
  - Success rate percentage
  - Approved/total count
- [ ] Scroll through Recent Rules list
- [ ] Verify batch rules show sparkles icon ✨

### Test 2.4: Refresh Functionality
- [ ] Click "Refresh" button
- [ ] Verify data reloads
- [ ] Check for console errors (should be none)

**Expected Result**: All learning metrics display correctly with accurate data

---

## Test Suite 3: Rules Tab (Phase 4.3)

### Test 3.1: Rules Table Display
- [ ] Click "Rules" tab
- [ ] Verify rules table loads
- [ ] Check table columns:
  - Rule (with sparkles for batch rules)
  - Reason
  - Type (badge)
  - Importance (progress bar)
  - Created (date)
  - Actions (Test, Edit, Delete buttons)

### Test 3.2: Filtering and Sorting
- [ ] Click "Card Type" dropdown
- [ ] Select "send_email"
- [ ] Verify table filters to show only send_email rules
- [ ] Click "Date" sort button
- [ ] Verify rules reorder by date
- [ ] Click again to toggle ascending/descending
- [ ] Click "Importance" sort button
- [ ] Verify rules reorder by importance

### Test 3.3: Edit Rule
- [ ] Click edit icon (pen) on any rule
- [ ] Verify edit dialog opens with:
  - Rule textarea (populated)
  - Reason input (populated)
  - Card Type select (populated)
  - Importance slider (populated)
- [ ] Modify rule text: "Updated rule for testing"
- [ ] Adjust importance slider to 75%
- [ ] Click "Save Changes"
- [ ] Verify:
  - Dialog closes
  - Table refreshes
  - Updated rule shows new values

### Test 3.4: Test Rule
- [ ] Find a rule with a regex pattern
- [ ] Click test icon (test tube)
- [ ] Verify test dialog opens
- [ ] Wait for test to complete
- [ ] Verify results show:
  - Affected cards count
  - Total pending cards
  - Card type distribution
  - Sample cards (first 5)
- [ ] Click "Close"

### Test 3.5: Delete Rule
- [ ] Click delete icon (trash) on a rule
- [ ] Verify confirmation dialog appears
- [ ] Check that rule text is displayed
- [ ] Click "Cancel" - dialog should close
- [ ] Click delete again
- [ ] Click "Delete Rule"
- [ ] Verify:
  - Dialog closes
  - Table refreshes
  - Rule is removed from list

**Expected Result**: Full CRUD operations work correctly

---

## Test Suite 4: Automation Tab (Phase 4.4) ⚡ **NEW**

### Test 4.1: Automation Dashboard Display
- [ ] Click "Automation" tab 🎯 **CRITICAL TEST**
- [ ] Verify loading spinner with "Analyzing learning data..." text
- [ ] Verify dashboard loads with sections:
  - Summary Stats (4 cards)
  - Auto-Rule Suggestions
  - Consolidation Suggestions
  - Rule Conflicts
  - Deprecation Candidates
  - Top Performing Rules

### Test 4.2: Summary Stats Validation
- [ ] Check Total Suggestions card (Sparkles icon)
- [ ] Check Auto-Rules card (Target icon)
- [ ] Check Conflicts card (AlertTriangle icon)
- [ ] Check Consolidations card (GitMerge icon)
- [ ] Verify all counts are accurate

### Test 4.3: Auto-Rule Suggestions
**Prerequisites**: Need 3+ similar rejections in feedback

If auto-rule suggestions are present:
- [ ] Verify each suggestion shows:
  - Card type badge
  - Occurrences count (e.g., "5x occurrences")
  - Confidence badge (green if >80%)
  - Rule text (bold)
  - Reason (muted)
  - Pattern/regex (if applicable)
  - Importance progress bar
  - "Create Rule" button
  - Dismiss button (X)
- [ ] Click "Create Rule" on a suggestion
- [ ] Verify confirmation dialog opens
- [ ] Read description
- [ ] Click "Confirm"
- [ ] Verify:
  - Dialog closes
  - Dashboard refreshes
  - Suggestion disappears
  - New rule appears in Rules tab

If no suggestions:
- [ ] Verify "All Clear!" message displays with green checkmark

### Test 4.4: Consolidation Suggestions
**Prerequisites**: Need similar rules (>70% similarity)

If consolidation suggestions are present:
- [ ] Verify each suggestion shows:
  - Similarity badge (e.g., "85% similar")
  - Rule 1 card (muted background)
  - Rule 2 card (muted background)
  - Separator line
  - Merged result card (blue background)
  - "Merge" button
  - Dismiss button
- [ ] Click "Merge" button
- [ ] Verify confirmation dialog:
  - Title: "Confirm Action"
  - Description: "This will merge the two rules..."
- [ ] Click "Confirm"
- [ ] Verify:
  - Dialog closes
  - Dashboard refreshes
  - Suggestion disappears
  - New consolidated rule in Rules tab
  - Original rules marked as deprecated

If no suggestions:
- [ ] Continue to next test

### Test 4.5: Rule Conflicts
**Prerequisites**: Need contradictory rules

If conflicts are present:
- [ ] Verify each conflict shows:
  - Red border around card
  - Conflict type badge (e.g., "opposite_actions")
  - Rule 1 card with importance
  - Rule 2 card with importance
  - Alert with suggestion
  - Three action buttons:
    - "Keep #1"
    - "Keep #2"
    - "Keep Both"
- [ ] Click "Keep #1" button
- [ ] Verify confirmation dialog
- [ ] Click "Confirm"
- [ ] Verify:
  - Dialog closes
  - Dashboard refreshes
  - Conflict disappears
  - Rule 2 marked as deprecated in Rules tab

If no conflicts:
- [ ] Continue to next test

### Test 4.6: Deprecation Candidates
**Prerequisites**: Need rules >30 days old with no triggers

If deprecation candidates are present:
- [ ] Verify each candidate shows:
  - Clock icon with days old (e.g., "45 days old")
  - Rule text
  - Reason (e.g., "Not triggered in last 30 days")
  - "Archive" button
- [ ] Click "Archive" button
- [ ] Verify confirmation dialog
- [ ] Click "Confirm"
- [ ] Verify:
  - Dialog closes
  - Dashboard refreshes
  - Candidate disappears
  - Rule marked as deprecated in Rules tab

If no candidates:
- [ ] Continue to next test

### Test 4.7: Top Performing Rules
- [ ] Verify Top Performing Rules section shows:
  - Ranked list (badges: #1, #2, #3, etc.)
  - Rule text (line-clamped)
  - Triggers count
  - Time saved (minutes)
  - Effectiveness score
  - Importance percentage (large green text)
- [ ] Verify rules are sorted by effectiveness score
- [ ] Check that top rule has highest score

### Test 4.8: Refresh Functionality
- [ ] Click "Refresh" button in header
- [ ] Verify:
  - Loading spinner appears
  - Dashboard reloads
  - All data updates
  - No errors in console

### Test 4.9: Error Handling
**Manual test**:
- [ ] Open browser DevTools
- [ ] Go to Network tab
- [ ] Set throttling to "Offline"
- [ ] Click "Refresh" button
- [ ] Verify error message displays
- [ ] Set throttling back to "No throttling"
- [ ] Click "Retry" button
- [ ] Verify data loads successfully

**Expected Result**: All automation features work correctly with accurate suggestions

---

## Test Suite 5: Integration Tests

### Test 5.1: Cross-Tab Navigation
- [ ] Start on Board tab
- [ ] Click Learning tab - verify smooth transition
- [ ] Click Rules tab - verify smooth transition
- [ ] Click Automation tab - verify smooth transition
- [ ] Click Board tab - verify return to original state
- [ ] Verify no console errors during transitions

### Test 5.2: Data Consistency
- [ ] On Learning tab: Note "Total Rules" count
- [ ] Switch to Rules tab: Count rules in table
- [ ] Verify counts match (accounting for deprecated rules)
- [ ] On Automation tab: Note suggestions count
- [ ] Create an auto-rule
- [ ] Switch to Rules tab: Verify new rule appears
- [ ] Switch back to Automation: Verify suggestion gone

### Test 5.3: Rule Lifecycle
- [ ] Create a new rule via Automation (auto-rule suggestion)
- [ ] Verify it appears in:
  - Rules tab (with auto_generated flag)
  - Learning Dashboard (in Recent Rules)
- [ ] Edit the rule in Rules tab
- [ ] Verify changes persist
- [ ] Delete the rule
- [ ] Verify it's removed from all views

### Test 5.4: Batch Operations
- [ ] In Board tab: Select multiple cards
- [ ] Reject them with the same reason
- [ ] Switch to Learning tab
- [ ] Verify feedback breakdown shows batch operation
- [ ] Switch to Automation tab
- [ ] Verify auto-rule suggestion appears (after 3+ rejections)

### Test 5.5: Agent Control Panel
- [ ] Click "Agent Control Panel" button (top right)
- [ ] Verify panel opens
- [ ] Start agent run
- [ ] Wait for completion
- [ ] Switch to Board tab: Verify new cards created
- [ ] Switch to Learning tab: Verify metrics update

---

## Test Suite 6: Performance Tests

### Test 6.1: Load Times
- [ ] Measure initial page load time
- [ ] Expected: < 3 seconds
- [ ] Measure tab switch time
- [ ] Expected: < 500ms
- [ ] Measure dashboard refresh time
- [ ] Expected: < 2 seconds

### Test 6.2: Large Data Sets
- [ ] With 100+ rules:
  - [ ] Rules tab loads quickly
  - [ ] Filtering works instantly
  - [ ] Sorting is responsive
- [ ] With 50+ suggestions:
  - [ ] Automation tab loads quickly
  - [ ] Scrolling is smooth
  - [ ] Actions execute quickly

### Test 6.3: Concurrent Operations
- [ ] Open two browser tabs to /agent
- [ ] In Tab 1: Create an auto-rule
- [ ] In Tab 2: Refresh automation dashboard
- [ ] Verify suggestion disappears in Tab 2
- [ ] In Tab 2: Edit a rule
- [ ] In Tab 1: Refresh rules table
- [ ] Verify changes appear in Tab 1

---

## Test Suite 7: Edge Cases

### Test 7.1: No Data Scenarios
- [ ] Test with no rules: Verify "No rules found" message
- [ ] Test with no feedback: Verify "No feedback" in Learning tab
- [ ] Test with no suggestions: Verify "All Clear!" in Automation tab

### Test 7.2: Invalid Actions
- [ ] Try to edit a deleted rule: Verify error handling
- [ ] Try to create duplicate rule: Verify validation
- [ ] Try to merge rules of different types: Verify prevented

### Test 7.3: Network Failures
- [ ] Simulate slow network (throttle to 3G)
- [ ] Verify loading states show appropriately
- [ ] Verify operations complete successfully
- [ ] Simulate failed requests (disconnect/reconnect)
- [ ] Verify error messages are user-friendly
- [ ] Verify retry mechanisms work

---

## Console Error Checklist

Throughout all tests, monitor browser console for:
- [ ] No React errors
- [ ] No TypeScript type errors
- [ ] No API errors (except known issues like jobs table)
- [ ] No missing dependencies warnings
- [ ] No infinite render loops
- [ ] No memory leaks

---

## Acceptance Criteria

### Phase 4.2 (Learning Dashboard) - ✅ Complete
- [x] Dashboard displays all metrics correctly
- [x] 30-day trend chart renders and is interactive
- [x] Refresh button works
- [x] Loading and error states display properly

### Phase 4.3 (Rules Management) - ✅ Complete
- [x] Rules table displays with all columns
- [x] Filtering and sorting work correctly
- [x] Edit dialog functions properly
- [x] Test dialog shows accurate results
- [x] Delete confirmation works
- [x] All CRUD operations persist to database

### Phase 4.4 (Automation) - ⚡ **TESTING NOW**
- [ ] Automation dashboard loads without errors
- [ ] Auto-rule suggestions display correctly
- [ ] Consolidation suggestions work
- [ ] Conflict detection identifies issues
- [ ] Deprecation candidates appear for old rules
- [ ] Top performers ranked correctly
- [ ] All action confirmations work
- [ ] Created rules appear in Rules tab
- [ ] Merged rules marked as deprecated
- [ ] Refresh updates all data

---

## Critical Success Factors

1. **No Breaking Changes**: Existing features (Board, Learning, Rules) continue to work
2. **Compilation**: All new code compiles without errors
3. **UI Responsiveness**: All tabs load within acceptable time frames
4. **Data Accuracy**: Metrics and suggestions are calculated correctly
5. **User Experience**: Actions provide clear feedback and confirmations
6. **Error Handling**: Graceful degradation when things go wrong

---

## Test Results Summary

### Phase 4.2 Results
- Status: ✅ **PASSED** (from previous testing)
- All metrics display correctly
- Charts are interactive
- Refresh works

### Phase 4.3 Results
- Status: ✅ **PASSED** (from previous testing)
- Full CRUD operations work
- Filtering and sorting functional
- Test and delete confirmations work

### Phase 4.4 Results
- Status: 🧪 **TESTING IN PROGRESS**
- Compilation: ✅ **PASSED**
- Dashboard loads: ⏳ **PENDING USER VERIFICATION**
- Auto-rule creation: ⏳ **PENDING USER VERIFICATION**
- Consolidation: ⏳ **PENDING USER VERIFICATION**
- Conflict resolution: ⏳ **PENDING USER VERIFICATION**
- Deprecation: ⏳ **PENDING USER VERIFICATION**

---

## Known Issues (Pre-existing)
- Jobs table not found errors (unrelated to Phase 4)
- Occasional Supabase connection timeouts (network issue)
- These do NOT affect Phase 4 functionality

---

## Next Steps

1. **Manual Testing**: Follow this guide to test each feature
2. **Report Issues**: Document any bugs or unexpected behavior
3. **Performance Tuning**: Optimize any slow operations
4. **User Acceptance**: Get feedback from actual users
5. **Phase 5.0**: Begin planning Advanced Analytics features

---

## Test Completion Checklist

- [ ] All Phase 4.2 tests passed
- [ ] All Phase 4.3 tests passed
- [ ] All Phase 4.4 tests passed
- [ ] Integration tests passed
- [ ] Performance tests passed
- [ ] Edge cases handled
- [ ] No console errors
- [ ] Documentation reviewed
- [ ] Ready for production

**Testing Started**: [Date/Time]
**Testing Completed**: [Date/Time]
**Tester**: [Name]
**Overall Status**: ⏳ In Progress
