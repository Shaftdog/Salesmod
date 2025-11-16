# Email Classification Learning System - Test Execution Guide

## Test Overview

This document provides instructions for running automated E2E tests for the Email Classification Learning System feature.

## Feature Being Tested

**Email Classification Learning System** allows users to teach the AI how to classify emails by creating rules through card review conversations. The system has two main components:

1. **Rule Creation**: Via card review chat, users tell the AI an email was misclassified, and it stores a classification rule
2. **Rule Application**: When new emails arrive, rules are checked first (fast path) before AI classification

## Prerequisites

### 1. Development Server Running

```bash
# Start the Next.js development server
npm run dev
```

Server should be accessible at: http://localhost:3000

### 2. Authenticated User

You must be logged in to the application before running tests. The tests will skip if authentication is required.

### 3. Test Data Setup

Ensure you have:
- At least one kanban card available for testing
- Access to the card review/chat interface
- Database access to verify rules (optional)

## Running the Tests

### Full Test Suite

```bash
# Run all email classification tests
npx playwright test e2e/email-classification-learning-system.spec.ts
```

### Individual Test Scenarios

```bash
# Scenario 1: Create classification rule via card review chat
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 1"

# Scenario 2: Security validations - duplicate rule rejection
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 2"

# Scenario 3: Security validations - ReDoS pattern rejection
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 3"

# Scenario 4: Rule application - verify cache invalidation
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 4"

# Scenario 5: UI/UX - Check classification rule management interface
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 5"

# Scenario 6: Verify error messages are clear and helpful
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 6"

# Database Verification
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Database"

# Performance Test
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Performance"

# Console Errors Check
npx playwright test e2e/email-classification-learning-system.spec.ts -g "Console Errors"
```

### Headed Mode (Watch browser execution)

```bash
# Run with visible browser
npx playwright test e2e/email-classification-learning-system.spec.ts --headed

# Run with Playwright UI
npx playwright test e2e/email-classification-learning-system.spec.ts --ui
```

### Debug Mode

```bash
# Run in debug mode with inspector
npx playwright test e2e/email-classification-learning-system.spec.ts --debug
```

## Test Scenarios

### Scenario 1: Create Classification Rule via Card Review

**What it tests:**
- Navigate to kanban board
- Open card review chat
- Submit message: "This email from newsletter@hubspot.com was misclassified as OPPORTUNITY, it should be NOTIFICATIONS"
- Verify AI responds with rule creation confirmation
- Check for success indicators

**Expected Results:**
- ✅ AI calls `storeEmailClassificationRule` tool
- ✅ Success message appears: "Classification rule created"
- ✅ Rule is stored in `agent_memories` table with scope='email_classification'

**Screenshots:**
- `test-results/01-kanban-board.png`
- `test-results/02-card-opened.png`
- `test-results/03-message-typed.png`
- `test-results/04-message-sent.png`
- `test-results/05-rule-created-success.png`

### Scenario 2: Security Validations - Duplicate Rule Rejection

**What it tests:**
- Create a classification rule
- Attempt to create the same rule again
- Verify duplicate is rejected

**Expected Results:**
- ✅ First rule created successfully
- ✅ Second attempt rejected with error: "Duplicate rule already exists"

**Screenshots:**
- `test-results/10-first-rule-created.png`
- `test-results/11-duplicate-rule-attempt.png`
- `test-results/12-duplicate-rejected.png`

### Scenario 3: Security Validations - ReDoS Pattern Rejection

**What it tests:**
- Attempt to create rule with dangerous regex pattern like `(a+)+`
- Verify pattern is rejected for security

**Expected Results:**
- ✅ Pattern rejected with error containing: "nested quantifiers" or "ReDoS risk"

**Screenshots:**
- `test-results/20-redos-pattern-attempt.png`
- `test-results/21-redos-rejected.png`

### Scenario 4: Cache Invalidation

**What it tests:**
- Create a classification rule
- Verify cache invalidation is triggered

**Expected Results:**
- ✅ Rule created successfully
- ✅ Cache is invalidated (verified by subsequent email classification using new rule)

**Screenshots:**
- `test-results/30-before-cache-test.png`
- `test-results/31-cache-test-rule-created.png`

### Scenario 5: UI/UX - Rule Management Interface

**What it tests:**
- Look for classification rules management interface
- Check settings page
- Check admin panel

**Expected Results:**
- 📋 Document existence of rule management UI (or lack thereof)

**Screenshots:**
- `test-results/40-settings-page.png`
- `test-results/41-rules-interface-found.png`
- `test-results/42-admin-panel.png`

### Scenario 6: Error Message Quality

**What it tests:**
- Invalid category name
- Incomplete rule specification
- Other validation errors

**Expected Results:**
- ✅ Clear, helpful error messages for all validation failures

**Screenshots:**
- `test-results/50-invalid-category-test.png`
- `test-results/51-incomplete-request.png`

### Database Verification

**What it tests:**
- Document expected database structure
- Check for API endpoint to view rules

**Expected Database Structure:**

```json
{
  "table": "agent_memories",
  "scope": "email_classification",
  "content": {
    "type": "classification_rule",
    "pattern_type": "sender_email|sender_domain|subject_contains|subject_regex",
    "pattern_value": "example.com",
    "correct_category": "NOTIFICATIONS",
    "wrong_category": "OPPORTUNITY",
    "reason": "Why this rule exists",
    "confidence_override": 0.99,
    "match_count": 0,
    "last_matched_at": null,
    "enabled": true
  }
}
```

**Screenshots:**
- `test-results/60-api-endpoint-found.png`

### Performance Test

**What it tests:**
- Measure rule creation time
- Ensure reasonable performance (<10 seconds)

**Expected Results:**
- ✅ Rule creation completes in under 10 seconds

**Screenshots:**
- `test-results/70-performance-test.png`

### Console Errors Check

**What it tests:**
- Monitor browser console for JavaScript errors
- Verify no critical errors occur during rule creation

**Expected Results:**
- ✅ No critical JavaScript errors
- ⚠️ Warnings are acceptable

**Screenshots:**
- `test-results/80-console-error-test.png`

## Test Results Location

All test results are stored in:
- **Screenshots**: `test-results/*.png`
- **Test Report**: Generated by Playwright in `playwright-report/`
- **Video Recordings**: `test-results/videos/` (if configured)

## Viewing Test Results

### HTML Report

```bash
# Generate and open HTML report
npx playwright show-report
```

### Screenshots

Screenshots are automatically saved to `test-results/` directory with descriptive names.

## Manual Database Verification

If you want to manually verify rules in the database:

### Using Supabase Dashboard

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to Table Editor
4. Open `agent_memories` table
5. Filter by `scope = 'email_classification'`

### Using SQL

```sql
-- View all classification rules
SELECT
  key,
  content->>'pattern_type' as pattern_type,
  content->>'pattern_value' as pattern_value,
  content->>'correct_category' as correct_category,
  content->>'reason' as reason,
  content->>'match_count' as match_count,
  created_at
FROM agent_memories
WHERE scope = 'email_classification'
ORDER BY created_at DESC;

-- Count rules per org
SELECT
  org_id,
  COUNT(*) as rule_count
FROM agent_memories
WHERE scope = 'email_classification'
GROUP BY org_id;

-- Check specific rule
SELECT * FROM agent_memories
WHERE scope = 'email_classification'
  AND content->>'pattern_value' = 'hubspot.com';
```

## Security Validations Checklist

Tests verify these security features are implemented:

- ✅ **ReDoS Protection**: Regex validation with timeout (100ms)
- ✅ **Prompt Injection Sanitization**: User input sanitized before storage
- ✅ **Category Validation**: Only valid categories accepted
- ✅ **Pattern Type Validation**: Only valid pattern types accepted
- ✅ **Rule Count Limit**: Maximum 50 rules per organization
- ✅ **Duplicate Detection**: Prevents duplicate rules
- ✅ **Input Length Limits**:
  - Pattern value: max 300 characters
  - Regex pattern: max 200 characters
  - Reason: max 1000 characters

## Known Limitations

1. **Authentication**: Tests skip if user is not authenticated
2. **Card Availability**: Tests skip if no cards are available
3. **Database Access**: UI tests cannot directly verify database state
4. **API Endpoint**: Some tests assume existence of API endpoints (may not be implemented)

## Troubleshooting

### Test Skips Due to "No review interface available"

**Problem**: Card review chat interface not found

**Solutions**:
1. Ensure you have at least one kanban card
2. Check that cards have a "Review" or "Chat" button
3. Verify card review feature is implemented

### Authentication Required

**Problem**: Tests skip with "authentication required"

**Solution**:
1. Manually log in to the application at http://localhost:3000
2. Keep the browser session active
3. Run tests in the same browser context

### No Cards Available

**Problem**: No cards found on kanban board

**Solution**:
1. Create a test card manually
2. Use email integration to generate cards from emails
3. Run agent system to create suggested cards

### Server Not Running

**Problem**: Tests fail immediately

**Solution**:
```bash
# Start development server
npm run dev
```

## Environment Variables

Optional environment variables for test configuration:

```bash
# Set test organization ID
export TEST_ORG_ID=your-org-id

# Set base URL (default: http://localhost:3000)
export BASE_URL=http://localhost:3000
```

## CI/CD Integration

To run these tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Start Development Server
  run: npm run dev &

- name: Wait for Server
  run: npx wait-on http://localhost:3000

- name: Run Email Classification Tests
  run: npx playwright test e2e/email-classification-learning-system.spec.ts

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## Success Criteria

For the feature to be considered fully tested and passing:

- ✅ All 9 test scenarios pass
- ✅ No critical console errors
- ✅ Rule creation succeeds with proper validation
- ✅ Security validations work (duplicates, ReDoS, limits)
- ✅ Cache invalidation occurs on rule creation
- ✅ Error messages are clear and helpful
- ✅ Performance is acceptable (<10 seconds per rule)
- ✅ Database structure matches specification

## Next Steps After Testing

If tests reveal issues:

1. **Bugs Found**: Create detailed bug reports with screenshots
2. **Feature Gaps**: Document missing functionality
3. **Performance Issues**: Identify bottlenecks
4. **UX Problems**: Suggest improvements to user experience

Report format should include:
- Test scenario that failed
- Expected behavior
- Actual behavior
- Screenshots from `test-results/`
- Console logs (if applicable)
- Steps to reproduce

## Contact

For questions about these tests or the Email Classification Learning System feature:
- Check implementation files:
  - `src/lib/agent/anthropic-tool-executor.ts` (Rule storage)
  - `src/lib/agent/email-classifier.ts` (Rule checking)
  - `src/lib/agent/anthropic-tool-registry.ts` (Tool definition)
