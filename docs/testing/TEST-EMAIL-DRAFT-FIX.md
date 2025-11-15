# Quick Test Guide: Email Draft Fix

## What Was Fixed
The AI Agent now properly generates email subjects and bodies for email cards. Previously, these fields were empty.

## Quick Test (2 minutes)

### Option 1: Test Automated Agent
1. Go to http://localhost:9002 (or your app URL)
2. Navigate to AI Agent Manager page
3. Click "Run Work Block"
4. Wait for cards to appear (~10-30 seconds)
5. Click on any "Email" card
6. **✅ CHECK**: Subject and Message fields should be filled

### Option 2: Test via Chat
1. Open AI Agent chat
2. Type: "Create an email to reach out to our top client about Q4 opportunities"
3. Wait for card creation
4. Click the new card
5. **✅ CHECK**: Subject and Message fields should be filled

## What to Look For

### ✅ GOOD - Email card should look like this:
```
To: Client Name
   contact@email.com

Why This Email?
Strategic outreach based on previous order volume...

Subject: Q4 Partnership Opportunity Discussion

Message:
Dear [Name],

I hope this message finds you well...
[Complete email content here]
```

### ❌ BAD - If you see this, the fix didn't work:
```
To: Client Name
   contact@email.com

Why This Email?
Contact them about Q4 opportunities. Subject: Q4 Partnership...

Subject: [empty]

Message: [empty]
```

## If It's Still Not Working

1. **Check Browser Console** (F12):
   - Look for "Creating card with emailDraft" logs
   - Look for error messages about missing emailDraft

2. **Check Server Terminal**:
   - Look for "ERROR: send_email action missing emailDraft"
   - Check for validation errors

3. **Try Clearing and Regenerating**:
   - Delete all current cards
   - Run "Work Block" again to generate fresh cards

4. **Verify Changes Were Saved**:
   ```bash
   cd /Users/sherrardhaugabrooks/Documents/Salesmod
   git status
   ```
   Should show modifications to:
   - src/lib/agent/planner.ts
   - src/lib/agent/orchestrator.ts
   - src/lib/agent/tools.ts

5. **Restart Dev Server**:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again
   - Test again

## Expected Console Logs

When working correctly, you should see:
```
Creating card with emailDraft: {
  title: "Reactivation Campaign - LRES Corporation",
  hasSubject: true,
  hasBody: true,
  subjectLength: 45,
  bodyLength: 283
}
```

## Quick Validation Checklist
- [ ] Subject field is populated (not empty)
- [ ] Subject is at least 5 characters
- [ ] Message field is populated (not empty)
- [ ] Message is at least 20 characters
- [ ] Message is formatted as HTML
- [ ] "Why This Email?" is different from the message content
- [ ] No error logs in console

## Success Criteria
✅ All email cards have complete subject and body text
✅ The rationale (Why This Email?) is separate from email content
✅ No console errors about missing emailDraft
✅ Cards can be approved and sent successfully

---

**Quick Status Check**: Open browser console and run:
```javascript
// Check if any email cards are missing subject/body
const emailCards = document.querySelectorAll('[data-card-type="send_email"]');
console.log(`Found ${emailCards.length} email cards`);
```

