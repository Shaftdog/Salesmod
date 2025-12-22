# P1 Engine Testing Strategy

**Status**: current
**Last Verified**: 2025-12-22
**Updated By**: Claude Code

## Overview

This document outlines the testing strategy for Phase 1 (P1) automation engines, explaining what gets unit tested versus integration tested, and why.

## Testing Philosophy

### Unit Test These
- **Pure functions** (no database calls)
- **Business logic algorithms**
- **Input validation**
- **Data transformations**
- **Scoring/calculation logic**

### Integration Test These
- **Database workflows**
- **Multi-step automation**
- **Email sending**
- **Card creation flows**
- **Complex state transitions**

## Engine-by-Engine Strategy

### Feedback Engine (`feedback-engine.ts`)

**Unit Tests** ✅
- `analyzeFeedbackResponse()` - Pure sentiment analysis
- Input validation (requestId, responseText)
- Keyword matching logic
- Sentiment scoring algorithm
- Key issue detection

**Integration Tests** (E2E)
- Full feedback request workflow
- Email sending
- Case creation for service recovery
- Database state transitions

**Rationale**: Sentiment analysis is pure logic that's easy to test. Database workflows are better tested end-to-end.

---

### Contact Enricher (`contact-enricher.ts`)

**Unit Tests** ✅
- `parseEmailSignature()` - Regex extraction
- `inferRoleFromTitle()` - Classification logic
- `detectOpportunitySignals()` - Signal detection
- All parsing/extraction logic

**Integration Tests** (E2E)
- Queue processing
- Contact merging
- Signal recording
- Enrichment workflows

**Rationale**: 90% of this module is pure functions. The regex and detection logic is perfect for unit testing.

---

### Compliance Engine (`compliance-engine.ts`)

**Unit Tests** ✅
- `createComplianceSchedule()` - Date calculations
- Frequency validation
- Period calculations
- Default value logic

**Integration Tests** (E2E)
- Check generation
- Entity validation
- Reminder sending
- Escalation workflows

**Rationale**: Date math and validation are critical and easy to unit test. Workflows involve too many database calls.

---

### Deals Engine (`deals-engine.ts`)

**Unit Tests** ⏭️ Deferred
- Stall detection logic (if extracted)
- Follow-up interval calculations

**Integration Tests** (E2E) ⭐ Primary
- Stalled deal detection
- Follow-up scheduling
- Stage transitions
- Activity tracking

**Rationale**: This engine is almost entirely database workflows. E2E tests provide better value.

---

### Bids Engine (`bids-engine.ts`)

**Unit Tests** ⏭️ Deferred
- Quote number generation
- Follow-up timing calculations

**Integration Tests** (E2E) ⭐ Primary
- Quote creation
- Follow-up automation
- Outcome recording
- Pattern learning

**Rationale**: Quote lifecycle is a complex workflow best tested end-to-end.

---

### Broadcast Integration (`broadcast-integration.ts`)

**Unit Tests** ⏭️ Deferred
- Batch size calculations

**Integration Tests** (E2E) ⭐ Primary
- Campaign scheduling
- Batch processing
- Rate limiting
- Progress tracking

**Rationale**: Campaign automation involves complex state and timing. E2E tests are essential.

---

## Test Coverage Goals

### Target Coverage by Type

| Code Type | Unit Test Coverage | E2E Coverage | Total Coverage |
|-----------|-------------------|--------------|----------------|
| Pure functions | 90%+ | N/A | 90%+ |
| Input validation | 100% | N/A | 100% |
| Business logic | 80%+ | N/A | 80%+ |
| Database workflows | 20% (mocks) | 80%+ | 100% |
| API endpoints | 0% | 100% | 100% |

### Actual Coverage (Current)

| Engine | Unit Coverage | E2E Coverage | Status |
|--------|--------------|--------------|--------|
| feedback-engine | 85% | 0% | ✅ Core tested |
| contact-enricher | 95% | 0% | ✅ Pure functions |
| compliance-engine | 70% | 0% | ✅ Critical paths |
| deals-engine | 0% | 0% | ⏭️ E2E planned |
| bids-engine | 0% | 0% | ⏭️ E2E planned |
| broadcast-integration | 0% | 0% | ⏭️ E2E planned |

---

## What Makes a Good Unit Test?

### ✅ Good Examples

```typescript
// Pure function - perfect for unit testing
it('should detect negative sentiment', async () => {
  const result = await analyzeFeedbackResponse(
    'req-1',
    'Poor quality, bad service'
  );

  expect(result.sentiment).toBe('negative');
  expect(result.requiresRecovery).toBe(true);
});

// Input validation - critical to test
it('should throw on empty responseText', async () => {
  await expect(
    analyzeFeedbackResponse('req-1', '')
  ).rejects.toThrow('responseText is required');
});

// Business logic - easy to verify
it('should calculate quarterly due date', () => {
  const nextDue = calculateNextQuarterlyDate(new Date('2025-02-15'));
  expect(nextDue.getMonth() % 3).toBe(0); // Divisible by 3
  expect(nextDue.getDate()).toBe(1); // First of month
});
```

### ❌ Bad Examples (Better as Integration Tests)

```typescript
// Too many database mocks - fragile
it('should create cards from task expansion', async () => {
  // Setup 10 different mock chains...
  // This breaks if implementation changes
});

// Complex workflow - test end-to-end instead
it('should complete full deal follow-up cycle', async () => {
  // Detect stalled deals
  // Create follow-up cards
  // Update deal status
  // Record activity
  // Better as E2E test!
});
```

---

## Mock Guidelines

### When to Mock
- External services (Anthropic AI, Gmail API)
- Database calls in focused unit tests
- Time/dates for deterministic tests
- File system operations

### When NOT to Mock
- Pure functions (just test them directly!)
- Simple data transformations
- Business logic calculations
- Validation logic

### Mock Complexity Threshold
If your test has more than **3 mock chains**, consider making it an integration test instead.

```typescript
// TOO COMPLEX - defer to E2E
mockServiceRoleClient.from.mockReturnValueOnce({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: {...} })
}).mockReturnValueOnce({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  // ... 5 more chains
});

// BETTER - test as integration
// Use actual test database
// Verify end-to-end behavior
```

---

## Test Naming Conventions

### Good Test Names
```typescript
// Describes behavior, not implementation
it('should detect urgency from multiple keywords')
it('should reject invalid frequency with error message')
it('should extract phone number with parentheses')
```

### Bad Test Names
```typescript
// Too vague
it('works')
it('test parseEmailSignature')

// Too implementation-focused
it('calls supabase.from().insert()')
it('uses regex pattern /\d{3}/')
```

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific engine
npm test feedback-engine

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run E2E tests (when created)
npm run test:e2e
```

---

## Test Organization

```
src/lib/agent/
├── __tests__/
│   ├── feedback-engine.test.ts
│   ├── contact-enricher.test.ts
│   ├── compliance-engine.test.ts
│   ├── job-planner.test.ts
│   └── orchestrator-job-cards.test.ts
├── feedback-engine.ts
├── contact-enricher.ts
├── compliance-engine.ts
├── deals-engine.ts
├── bids-engine.ts
└── broadcast-integration.ts

e2e/
├── feedback-workflow.spec.ts          # Full feedback cycle
├── deal-automation.spec.ts            # Deal follow-ups
├── quote-lifecycle.spec.ts            # Quote creation to outcome
└── campaign-sending.spec.ts           # Broadcast batches
```

---

## Key Principles

1. **Test behavior, not implementation**
   - "Should detect negative sentiment" ✅
   - "Should call supabase.update()" ❌

2. **Pure functions first**
   - Easiest to test
   - Highest value
   - Most stable

3. **Pragmatic about mocking**
   - If mocks are complex, use integration tests
   - Don't mock what you own

4. **Edge cases matter**
   - Empty strings
   - Null values
   - Very long inputs
   - Special characters
   - Boundary conditions

5. **Fast feedback loops**
   - Unit tests run in milliseconds
   - E2E tests run in seconds
   - Use the right tool for the job

---

## Maintenance

### When to Update Tests
- ✅ When adding new features
- ✅ When fixing bugs (add test first!)
- ✅ When refactoring (tests shouldn't break)
- ❌ When implementation details change (unless behavior changes)

### Red Flags
- Test requires 10+ lines of setup
- Test breaks when refactoring
- Can't tell what failed from test name
- Mocking internal implementation details

---

## Future Improvements

1. **Add E2E tests for workflow engines**
   - deals-engine
   - bids-engine
   - broadcast-integration

2. **Performance testing**
   - Large text processing
   - Batch operations
   - Concurrent signal detection

3. **Property-based testing**
   - Generate random email signatures
   - Verify parser never crashes
   - Test with fuzzing

4. **Visual regression testing**
   - Email templates
   - Generated reports
   - Dashboard charts

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://www.jamesshore.com/v2/books/aoad1/test-driven-development)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Summary

**Unit Test**:
- Pure functions ✅
- Input validation ✅
- Business logic ✅
- Data transformations ✅

**Integration Test**:
- Database workflows ✅
- Multi-step automation ✅
- External integrations ✅
- Complete user flows ✅

**Result**: Pragmatic testing strategy that provides confidence without being brittle.
