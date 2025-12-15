---
status: current
last_verified: 2025-11-25
updated_by: Claude Code
---

# Task Library Feature - Test Specification

## Feature Overview
The Task Library is a reusable task management system at `/production/library` that allows users to:
- View library tasks organized by 10 production stages
- Create, edit, and delete library tasks
- Manage task subtasks
- Search and filter tasks
- Navigate from Production Dashboard to Task Library

## Test Scenarios

### 1. Navigation & Page Structure
**Test ID:** TL-001
**Priority:** High
**Description:** Verify Task Library page loads with correct layout and navigation

**Steps:**
1. Navigate to http://localhost:3000 (requires login)
2. Login with testuser123@gmail.com (admin account)
3. Navigate to /production
4. Verify "Task Library" button in header navigation (with Library icon)
5. Click "Task Library" button and verify navigation to /production/library
6. Verify page heading "Task Library"
7. Verify "Back" button links to /production
8. Verify "New Task" button is visible
9. Verify "Refresh" button is visible
10. Verify task count badge (format: "X tasks, Y subtasks")

**Expected Results:**
- Page loads without errors
- All UI elements are visible and correctly styled
- Navigation buttons work correctly

---

### 2. Stage Display & Collapsibility
**Test ID:** TL-002
**Priority:** High
**Description:** Verify all 10 production stages are displayed as collapsible sections

**Steps:**
1. Navigate to /production/library (after login)
2. Verify all 10 stages are displayed:
   - INTAKE
   - SCHEDULING
   - SCHEDULED
   - INSPECTED
   - FINALIZATION
   - READY_FOR_DELIVERY
   - DELIVERED
   - CORRECTION
   - REVISION
   - WORKFILE
3. Verify each stage shows task count (e.g., "16 tasks")
4. Click a stage header to collapse/expand
5. Verify chevron icon changes (ChevronDown when expanded, ChevronRight when collapsed)
6. Verify tasks appear when expanded
7. Verify tasks hide when collapsed

**Expected Results:**
- All 10 stages visible with correct display names
- Task counts accurate
- Collapsible behavior works smoothly
- Stage badges have correct colors per STAGE_COLORS mapping

---

### 3. Task Display & Details
**Test ID:** TL-003
**Priority:** High
**Description:** Verify task items display correct information and expand to show subtasks

**Steps:**
1. Navigate to /production/library
2. Expand INTAKE stage
3. Locate a task (e.g., "INTAKE" task)
4. Verify task displays:
   - Title
   - Description (if present)
   - Role badge (e.g., "Appraiser", "Reviewer", "Admin", "Trainee")
   - Time estimate with clock icon (e.g., "30m")
   - Subtask count with CheckSquare icon (if has subtasks)
   - "Required" badge (if is_required = true)
5. Click task to expand
6. Verify subtasks are shown in expanded section
7. Verify each subtask shows:
   - Title
   - Role badge
   - Time estimate
   - "Required" badge (if applicable)
8. Verify Edit button (pencil icon) is visible
9. Verify Delete button (trash icon) is visible

**Expected Results:**
- All task metadata displayed correctly
- Subtasks visible when task expanded
- Action buttons functional and properly positioned

---

### 4. Search Functionality
**Test ID:** TL-004
**Priority:** Medium
**Description:** Verify search filters tasks across all stages

**Steps:**
1. Navigate to /production/library
2. Note initial task counts per stage
3. Type "INTAKE" in search box
4. Verify only tasks/subtasks containing "INTAKE" are shown
5. Verify stages with no matching tasks are hidden
6. Verify task count updates in visible stages
7. Clear search box
8. Verify all tasks return
9. Search for a subtask keyword
10. Verify parent task appears if subtask matches

**Expected Results:**
- Search filters in real-time
- Search is case-insensitive
- Matches in title, description, or subtasks
- Empty stages hidden during search
- Clearing search restores all tasks

---

### 5. Task Editing (Basic)
**Test ID:** TL-005
**Priority:** Medium
**Description:** Verify edit dialog opens and displays task data

**Steps:**
1. Navigate to /production/library
2. Expand INTAKE stage
3. Click Edit button (pencil icon) on a task
4. Verify edit dialog opens
5. Verify dialog title is "Edit Library Task"
6. Verify task data is populated in form:
   - Title field
   - Description field
   - Stage dropdown
   - Role dropdown
   - Estimated minutes input
   - Is Required checkbox
7. Verify subtasks section shows existing subtasks
8. Click Cancel button
9. Verify dialog closes without saving

**Expected Results:**
- Dialog opens smoothly
- All fields populated with current task data
- Cancel button closes dialog
- No changes persisted

---

### 6. Task Creation Dialog
**Test ID:** TL-006
**Priority:** Medium
**Description:** Verify "New Task" button opens creation dialog

**Steps:**
1. Navigate to /production/library
2. Click "New Task" button in header
3. Verify dialog opens with title "Create Library Task"
4. Verify form fields are empty/default:
   - Title (empty)
   - Description (empty)
   - Stage (dropdown with all stages)
   - Role (default or dropdown)
   - Estimated minutes (default value)
   - Is Required (checkbox)
5. Verify "Add Subtask" section is available
6. Click Cancel
7. Verify dialog closes

**Expected Results:**
- Create dialog opens
- Form ready for new task input
- Cancel closes without creating

---

### 7. Production Dashboard Links
**Test ID:** TL-007
**Priority:** High
**Description:** Verify Task Library links from Production Dashboard

**Steps:**
1. Navigate to /production
2. Verify header navigation bar contains:
   - "Task Library" button with Library icon
3. Scroll down to "Quick Links" section
4. Verify "Task Library" card with:
   - Title "Task Library"
   - Description "Manage reusable task definitions"
   - ArrowUpRight icon
5. Click header "Task Library" button
6. Verify navigation to /production/library
7. Click Back button to return to /production
8. Click "Task Library" quick link card
9. Verify navigation to /production/library

**Expected Results:**
- Both navigation methods work
- Task Library accessible from dashboard
- Back button returns to dashboard

---

### 8. Refresh Functionality
**Test ID:** TL-008
**Priority:** Low
**Description:** Verify Refresh button reloads task data

**Steps:**
1. Navigate to /production/library
2. Note current task counts
3. Click "Refresh" button
4. Verify RefreshCw icon spins during loading
5. Verify tasks reload
6. Verify task counts remain consistent

**Expected Results:**
- Refresh button triggers data reload
- Loading indicator shows
- Data updates correctly

---

### 9. Stage-Specific Task Creation
**Test ID:** TL-009
**Priority:** Medium
**Description:** Verify "+" button on stage header opens create dialog with stage pre-selected

**Steps:**
1. Navigate to /production/library
2. Expand SCHEDULING stage
3. Click "+" button in stage header
4. Verify create dialog opens
5. Verify stage dropdown pre-selected to "SCHEDULING"
6. Click Cancel
7. Repeat for different stage
8. Verify that stage is pre-selected

**Expected Results:**
- Stage-specific creation works
- Correct stage pre-selected in form
- Saves clicks for user

---

### 10. Empty Stage Handling
**Test ID:** TL-010
**Priority:** Low
**Description:** Verify stages with no tasks show appropriate empty state

**Steps:**
1. Navigate to /production/library
2. Expand all stages
3. Find a stage with 0 tasks (if any)
4. Verify empty state message:
   - ListTodo icon
   - "No tasks in this stage" text
   - "Add a task" link button
5. Click "Add a task" link
6. Verify create dialog opens with stage pre-selected

**Expected Results:**
- Empty stages show helpful message
- Quick action to add task
- Good UX for empty states

---

## Test Data Requirements

### Prerequisites
- User account: testuser123@gmail.com (role: admin)
- Task library seeded with default tasks (via seed-task-templates.js)
- Expected data:
  - Multiple tasks in INTAKE stage (e.g., 16 tasks)
  - Tasks with subtasks
  - Tasks marked as required
  - Tasks with different roles assigned
  - Tasks across all 10 stages

### Database State
- At least 1 task in each stage for display testing
- At least 1 task with multiple subtasks
- At least 1 task with is_required = true
- At least 1 task with is_required = false

---

## Error Scenarios to Test

### E1: Loading Error
- Simulate API failure
- Verify error message displays
- Verify "Retry" button appears
- Verify retry button reloads data

### E2: Delete Confirmation
- Click delete button on a task
- Verify confirmation dialog appears
- Verify warning about templates using this task
- Verify cancel doesn't delete
- (Don't actually delete in tests to preserve data)

---

## Browser Console Checks
- No JavaScript errors
- No 404 network errors
- No React warnings
- API calls complete successfully

---

## Accessibility Checks (Basic)
- All buttons have proper labels
- Dialogs have proper ARIA attributes
- Keyboard navigation works
- Focus management in dialogs

---

## Performance Expectations
- Page loads in < 2 seconds
- Search filters in < 100ms
- Dialog opens in < 300ms
- Stage expand/collapse in < 200ms

---

## Cross-Browser Testing
Target: Chrome (primary), Firefox, Edge
- Test on latest stable versions
- Verify consistent behavior
- Check for layout issues

---

## Notes for Tester
- Login required - use testuser123@gmail.com
- Server must be running at http://localhost:3000
- Task library should be seeded with default data
- Some tests may need to be run in sequence
- Do NOT delete tasks - only test UI interactions
- Take screenshots of key states
- Document any console errors
- Report any visual glitches or layout issues

---

## Success Criteria
All tests (TL-001 through TL-010) must pass with:
- ✅ Correct UI rendering
- ✅ Functional navigation
- ✅ Accurate data display
- ✅ No console errors
- ✅ Smooth interactions
- ✅ Responsive layout
