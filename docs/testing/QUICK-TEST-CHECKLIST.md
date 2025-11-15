---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# AI Chat Contact Creation - Quick Test Checklist

**⏱️ 5 Minute Test | 📍 Start Here**

---

## Pre-Test Setup

- [ ] Server running at http://localhost:9002
- [ ] Login credentials ready:
  - Email: `shaugabrooks@[domain].com` (NOT just "shaugabrooks")
  - Password: `Latter!974`
- [ ] Browser console open (F12 → Console tab)

---

## Test Execution

### Step 1: Login ✓
- [ ] Navigate to http://localhost:9002
- [ ] Login successful
- [ ] Redirected to dashboard

### Step 2: Open Agent Chat ✓
- [ ] Click "Agent" or "Chat" link
- [ ] OR navigate to http://localhost:9002/agent
- [ ] Chat interface visible
- [ ] Input field present

### Step 3: Search for Client ✓
**Type in chat:**
```
What clients do I have? Show me the first one.
```

- [ ] AI responds within 10 seconds
- [ ] Response contains client information
- [ ] Response contains UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- [ ] Copy the UUID for next step

**UUID from response:** `_________________________________`

---

### Step 4: Create Contact ✓
**Type in chat (paste your client UUID):**
```
Add a new contact named John Smith with email john@test.com for client [paste-uuid-here]
```

**Wait for AI response...**

- [ ] AI responds within 10 seconds
- [ ] Response contains "success" or "created"
- [ ] Response mentions "John Smith"
- [ ] Response mentions "john@test.com"
- [ ] NO error messages
- [ ] Response says "contact" (not "card")

---

## ✅ PASS Criteria

Check ALL boxes to pass:
- [ ] Contact was created
- [ ] AI confirmed creation
- [ ] Response includes contact details
- [ ] No errors occurred
- [ ] AI used word "contact" not "card"

**If all checked: TEST PASSED ✅**

---

## ❌ FAIL Indicators

If ANY of these occur, test FAILED:
- [ ] AI says "I created a card..."
- [ ] Error message displayed
- [ ] AI asks for more information repeatedly
- [ ] Response mentions "kanban" or "action card"
- [ ] No confirmation of creation

**If any checked: TEST FAILED ❌**

---

## Verification (Optional)

### Database Check
```sql
SELECT * FROM contacts
WHERE email = 'john@test.com'
ORDER BY created_at DESC
LIMIT 1;
```

- [ ] Contact exists in database
- [ ] first_name = "John"
- [ ] last_name = "Smith"
- [ ] email = "john@test.com"
- [ ] client_id matches UUID from Step 3

---

## Results

**Date Tested:** _______________

**Result:** ⬜ PASS | ⬜ FAIL

**AI Response (copy/paste):**
```
[paste AI's response here]
```

**Notes:**
```
[any observations, issues, or comments]
```

---

## Screenshot Checklist

Take screenshots of:
- [ ] Step 3 - Client search response
- [ ] Step 4 - Contact creation request
- [ ] Step 4 - Contact creation response
- [ ] Browser console (showing no errors)

Save to: `/Users/sherrardhaugabrooks/Documents/Salesmod/test-results/manual-test-[date]/`

---

## If Test Fails

1. **Screenshot everything**
2. **Copy browser console logs** (F12 → Console)
3. **Note exact error message**
4. **Provide to developer with:**
   - AI response text
   - Console logs
   - Screenshots
   - Client ID used

---

## Quick Reference

**Good Response Example:**
> "I've successfully created the contact John Smith for ABC Company. The contact details are: Name: John Smith, Email: john@test.com, Client: ABC Company. The contact ID is abc123-def456..."

**Bad Response Example:**
> "I've created an action card to add John Smith..." ← ❌ WRONG TOOL USED

---

## Next Steps After Testing

### If PASS ✅:
- Check off requirement as complete
- Archive test documentation
- Optional: Clean up test data from database

### If FAIL ❌:
- Document failure details
- Provide to developer for debugging
- Wait for fix
- Re-test after fix deployed

---

**Need Help?**
- Full test plan: `AGENT-CHAT-CONTACT-CREATION-TEST-REPORT.md`
- Summary: `TEST-SUMMARY-CONTACT-CREATION.md`
