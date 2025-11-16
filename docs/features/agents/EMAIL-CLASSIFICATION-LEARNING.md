# Email Classification Learning System

**Status:** ✅ Implemented
**Last Updated:** 2025-11-16
**Feature Type:** AI Learning & Adaptation

---

## Overview

The Email Classification Learning System allows the AI to learn from your feedback about email categorization. When you review cards and indicate that an email was misclassified, the system stores rules that influence future email classification.

### Key Benefits

✅ **Learns Your Preferences** - System adapts to your business logic
✅ **Reduces Manual Review** - Fewer misclassified emails over time
✅ **Pattern-Based Rules** - Match by sender, domain, or subject patterns
✅ **High-Speed Classification** - Rule matches bypass AI for instant classification
✅ **Transparent Logic** - See exactly why each email was classified

---

## How It Works

### The Flow

```
┌─────────────────────────────────────────┐
│  Gmail Email Arrives                    │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  Check User-Defined Rules               │
│  (Fast Path - Instant Classification)  │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    Rule Match?        No Match
         │                 │
         ↓                 ↓
   ┌─────────┐      ┌──────────────┐
   │ Return  │      │ AI Classifier│
   │ Category│      │ with Rules   │
   │ (0.99)  │      │ as Context   │
   └─────────┘      └──────┬───────┘
                           │
                           ↓
                    ┌──────────────┐
                    │ Card Created │
                    └──────────────┘
```

### Rule Priority

1. **User-Defined Rules** (Highest Priority)
   - Checked first
   - Confidence: 0.99
   - Instant classification

2. **AI Classification** (Fallback)
   - Uses rules as context
   - Considers your patterns
   - Confidence: Variable (0-1)

---

## Creating Classification Rules

### Via Card Review Chat

When reviewing a card, tell the AI agent that the email was misclassified:

**Example Conversation:**

```
You: "This email from HubSpot was misclassified. It's a notification, not an opportunity."

Agent: [Calls storeEmailClassificationRule]
✓ Classification rule created: "sender_domain" matching "hubspot.com" → NOTIFICATIONS

Future emails from @hubspot.com will be classified as NOTIFICATIONS instead of OPPORTUNITY.
```

### Rule Types

| Pattern Type | Description | Example |
|-------------|-------------|---------|
| `sender_email` | Match exact email address | `john@example.com` |
| `sender_domain` | Match entire domain | `hubspot.com` |
| `subject_contains` | Substring in subject | `newsletter` |
| `subject_regex` | Regex pattern in subject | `.*invoice.*\d+` |

---

## Technical Implementation

### Database Schema

**Table:** `agent_memories`
**Scope:** `email_classification`

```sql
-- Example rule structure
{
  "type": "classification_rule",
  "pattern_type": "sender_domain",
  "pattern_value": "hubspot.com",
  "correct_category": "NOTIFICATIONS",
  "wrong_category": "OPPORTUNITY",
  "reason": "HubSpot emails are marketing notifications",
  "confidence_override": 0.99,
  "created_from_card_id": "card-uuid",
  "created_at": "2025-11-16T..."
}
```

### Files Modified

1. **Migration:**
   - `supabase/migrations/20251116000001_add_email_classification_scope.sql`

2. **Tool Registry:**
   - `src/lib/agent/anthropic-tool-registry.ts`
   - Added `storeEmailClassificationRule` tool

3. **Tool Executor:**
   - `src/lib/agent/anthropic-tool-executor.ts`
   - Implemented rule storage logic

4. **Email Classifier:**
   - `src/lib/agent/email-classifier.ts`
   - Added `fetchClassificationRules()` - Loads rules from database
   - Added `checkClassificationRules()` - Fast path matching
   - Modified `classifyEmail()` - Accepts orgId, checks rules first
   - Modified `buildClassificationPrompt()` - Injects rules into AI prompt

5. **Gmail Poller:**
   - `src/lib/agent/gmail-poller.ts`
   - Passes `orgId` to `classifyEmail()`

---

## Email Categories

### Available Categories

- **AMC_ORDER** - Official appraisal orders from AMCs
- **OPPORTUNITY** - New business leads
- **CASE** - Complex issues (complaints, disputes)
- **STATUS** - Status update requests
- **SCHEDULING** - Property inspection logistics
- **UPDATES** - Order updates
- **AP** - Bills to pay
- **AR** - Payments received
- **INFORMATION** - General announcements
- **NOTIFICATIONS** - Automated system alerts
- **REMOVE** - Unsubscribe requests
- **ESCALATE** - Low confidence/unclear emails

---

## Usage Examples

### Example 1: HubSpot Marketing Emails

**Problem:** HubSpot emails keep getting classified as OPPORTUNITY

**Solution:**
```
You: "Emails from HubSpot are always notifications, not opportunities.
Create a rule for this."

Agent: ✓ Classification rule created
Pattern: sender_domain = "hubspot.com"
Category: NOTIFICATIONS
Confidence: 0.99

Future HubSpot emails will be classified as NOTIFICATIONS.
```

### Example 2: Newsletter Subject Pattern

**Problem:** Newsletters getting classified as INFORMATION instead of NOTIFICATIONS

**Solution:**
```
You: "Emails with 'newsletter' in the subject should always be NOTIFICATIONS."

Agent: ✓ Classification rule created
Pattern: subject_contains = "newsletter"
Category: NOTIFICATIONS

All emails with "newsletter" in subject will be NOTIFICATIONS.
```

### Example 3: Specific Sender

**Problem:** One specific client's emails keep getting escalated

**Solution:**
```
You: "Emails from jane@acme.com should be STATUS requests."

Agent: ✓ Classification rule created
Pattern: sender_email = "jane@acme.com"
Category: STATUS
Confidence: 0.99

Future emails from jane@acme.com will be classified as STATUS.
```

---

## Viewing Active Rules

### Via Database Query

```sql
SELECT
  content->>'pattern_type' as pattern_type,
  content->>'pattern_value' as pattern_value,
  content->>'correct_category' as category,
  content->>'reason' as reason,
  importance,
  created_at
FROM agent_memories
WHERE scope = 'email_classification'
  AND org_id = '<your-org-id>'
ORDER BY importance DESC, created_at DESC;
```

### Via Card Review Chat

```
You: "Show me my classification rules"

Agent: [Fetches and displays rules]

Current classification rules:
1. sender_domain: hubspot.com → NOTIFICATIONS
   Reason: HubSpot emails are marketing notifications

2. subject_contains: newsletter → NOTIFICATIONS
   Reason: Newsletters should not create deal cards

... (continues)
```

---

## Performance Impact

### Before Rules
```
Email arrives → AI Classification (200-500ms) → Card Created
```

### After Rules
```
Email arrives → Rule Check (5ms) → Card Created ✅

OR (if no match)

Email arrives → Rule Check (5ms) → AI Classification (200-500ms) → Card Created
```

**Speed Improvement:** 40-100x faster for rule-matched emails

---

## Migration Notes

### Applying the Migration

The migration adds `email_classification` to the allowed scopes in `agent_memories`:

```sql
-- Existing scopes
'chat', 'email', 'session', 'client_context', 'card_feedback'

-- Added scope
'email_classification'
```

### Apply via Supabase

```bash
# Local development
npx supabase db push

# Production
npx supabase db push --db-url <production-url>
```

---

## Future Enhancements

### Planned Features

1. **UI for Rule Management**
   - View all classification rules
   - Edit/delete rules
   - Enable/disable rules
   - Rule priority ordering

2. **Rule Analytics**
   - Show how many emails matched each rule
   - Track rule effectiveness
   - Suggest rule consolidation

3. **Automatic Rule Suggestion**
   - Detect patterns in rejections
   - Auto-suggest rules after 3+ similar rejections
   - Batch apply rules to existing cards

4. **Rule Testing**
   - Test rules against historical emails
   - Preview rule impact before saving
   - Conflict detection

---

## Troubleshooting

### Rules Not Working?

**Check 1:** Migration applied?
```sql
-- Check if scope constraint includes email_classification
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'agent_memories_scope_check';
```

**Check 2:** Rules stored correctly?
```sql
-- Check for your rules
SELECT COUNT(*) FROM agent_memories
WHERE scope = 'email_classification'
  AND org_id = '<your-org-id>';
```

**Check 3:** Gmail poller passing orgId?
- Check logs for: `[Email Classifier] Loaded X classification rules`
- If X = 0, rules aren't being fetched

### Common Issues

**Issue:** "Invalid scope" error
- **Fix:** Apply migration `20251116000001_add_email_classification_scope.sql`

**Issue:** Rules not matching
- **Fix:** Check pattern type and value
  - `sender_domain` should be just the domain: `hubspot.com` (not `@hubspot.com`)
  - `subject_contains` is case-insensitive
  - `subject_regex` requires valid regex syntax

---

## API Reference

### Tool: storeEmailClassificationRule

**Purpose:** Store a rule to improve email classification

**Parameters:**
```typescript
{
  cardId: string;              // Card that triggered this rule
  patternType: 'sender_email' | 'sender_domain' | 'subject_contains' | 'subject_regex';
  patternValue: string;        // Pattern to match
  correctCategory: EmailCategory;  // Correct category
  wrongCategory?: string;      // What it was misclassified as
  reason: string;              // Why this rule is needed
  confidenceOverride?: number; // Optional: override confidence (0-1)
}
```

**Returns:**
```typescript
{
  success: true;
  message: "✓ Classification rule created: ...",
  rule: {
    key: string;
    patternType: string;
    patternValue: string;
    correctCategory: string;
    reason: string;
  },
  impact: string; // Description of rule's effect
}
```

---

## Related Documentation

- [Gmail Integration](../../../GMAIL_INTEGRATION.md)
- [Card Review System](./AGENT-IMPLEMENTATION-README.md)
- [Agent Memory System](./.claude/AGENT-GUIDE.md)
- [Email Categories](../../troubleshooting/gmail-card-creation-fix.md)

---

**Questions or Issues?**
File an issue or ask in the Card Review chat: "How do classification rules work?"
