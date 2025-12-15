# Manual Testing Guide: Campaigns Feature (Production RBAC)

## Quick Start

Since automated tests require valid credentials, follow this manual testing procedure to verify the campaigns feature works with production role-based access control.

---

## Prerequisites

- ✅ App running at http://localhost:9002
- ✅ Production RBAC enabled in API
- ✅ All users have admin role in database
- ✅ You have valid login credentials

---

## Test Procedure

### Step 1: Authentication

1. Open browser to http://localhost:9002
2. **Log in with your admin credentials**
3. Verify you're successfully authenticated (check for user menu/profile)

---

### Step 2: Campaign List Page

**Navigate to:** http://localhost:9002/sales/campaigns

**Checklist:**

- [ ] Page loads without errors (no 403/500)
- [ ] Page heading displays: "Email Campaigns"
- [ ] **NO error toast appears** (check bottom right corner)
- [ ] Search bar is visible
- [ ] "New Campaign" button is visible (top right)
- [ ] If campaigns exist, they display in a list/table
- [ ] If no campaigns exist, you see "No campaigns yet" message

**Open Browser DevTools (F12):**

**Console Tab:**
- [ ] NO error: "Auth session missing"
- [ ] NO error: "Failed to fetch campaigns"
- [ ] NO 401 errors

**Network Tab:**
- [ ] Find request to `/api/campaigns`
- [ ] Status should be: **200 OK** (not 401 or 403)
- [ ] Response should be JSON array of campaigns

**Expected Result:** ✅ Campaigns list loads successfully with no authentication errors

---

### Step 3: Campaign Creation Wizard

**Navigate to:** http://localhost:9002/sales/campaigns/new

**Checklist:**

- [ ] Wizard page loads without errors
- [ ] Progress indicator shows 4 steps
- [ ] Current step is "Audience" (step 1 of 4)
- [ ] Form fields are visible:
  - [ ] Campaign Name input
  - [ ] Description textarea
  - [ ] Client Type checkboxes (AMC, Broker, Attorney, etc.)
  - [ ] "Last order at least" field
  - [ ] "Last order at most" field
  - [ ] Audience Preview section
- [ ] "Back" button is visible
- [ ] "Next" button is visible

**Interaction Test:**

1. **Enter campaign name:** "Production Test Campaign"
2. **Enter description:** "Testing production RBAC"
3. **Check one client type:** e.g., "AMC"
4. **Enter "Last order at least":** 180
5. **Enter "Last order at most":** 365

**After filling form:**
- [ ] "Next" button becomes enabled (if it wasn't already)
- [ ] Click "Refresh" in Audience Preview section
- [ ] Preview shows matching clients (or "Configure filters" message)
- [ ] NO console errors appear

**Open Browser DevTools (F12):**

**Console Tab:**
- [ ] NO authentication errors
- [ ] NO 401/403 errors

**Expected Result:** ✅ Wizard loads and form works correctly

---

### Step 4: API Authorization Check

**Still in Browser DevTools:**

**Network Tab:**
1. Clear network log (🚫 icon)
2. Refresh the campaigns list page
3. Find the request to `/api/campaigns`

**Verify:**
- [ ] **Status:** 200 OK (SUCCESS)
- [ ] **NOT:** 401 Unauthorized
- [ ] **NOT:** 403 Forbidden
- [ ] **NOT:** 500 Internal Server Error

**Click on the request and check:**

**Headers Tab:**
- [ ] Cookie header is present (contains authentication session)
- [ ] OR Authorization header is present

**Response Tab:**
- [ ] Valid JSON array
- [ ] Each campaign has: id, name, status, etc.

**Expected Result:** ✅ API accepts authenticated requests and returns data

---

## Success Criteria

All of the following must be true:

✅ **Authentication:**
- User can log in successfully
- Session persists across page navigation

✅ **Campaign List Page:**
- Loads without HTTP errors
- API returns 200 OK
- No error toasts displayed
- No console errors

✅ **Campaign Wizard:**
- Form loads and displays correctly
- Input fields are functional
- No authentication errors
- No console errors

✅ **API Authorization:**
- All API calls return 200 OK
- Authentication headers are included
- No 401/403 errors

---

## If You Encounter Issues

### Issue: "Failed to load campaigns" error toast

**Diagnosis:**
- Open DevTools Console
- Look for: "Auth session missing" or "401 Unauthorized"

**Solution:**
1. Log out completely
2. Clear browser cache and cookies
3. Log back in
4. Try again

### Issue: 401 Unauthorized on API calls

**Diagnosis:**
- DevTools > Network > `/api/campaigns` shows 401

**Possible Causes:**
1. Not logged in
2. Session expired
3. Authentication middleware issue

**Solution:**
1. Verify you're logged in (check for user menu)
2. Try logging out and back in
3. Check that your user has "admin" role in database

### Issue: 403 Forbidden on API calls

**Diagnosis:**
- DevTools > Network > `/api/campaigns` shows 403

**Possible Causes:**
- User doesn't have admin role
- Role-based permission check failing

**Solution:**
1. Verify your user has "admin" role:
   ```sql
   SELECT email, role FROM users WHERE email = 'YOUR_EMAIL';
   ```
2. If role is not "admin", update it:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'YOUR_EMAIL';
   ```

---

## Reporting Results

After completing manual testing, report your findings:

### If All Tests Pass ✅

**Message:**
```
✅ Manual Testing Complete - All Tests Passed

- Campaign list page loads successfully
- API returns 200 OK
- No authentication errors
- Wizard functions correctly
- Production RBAC working as expected

Evidence:
- No error toasts displayed
- Console shows no errors
- Network shows 200 OK responses
```

### If Tests Fail ❌

**Report the following:**
1. Which step failed
2. Error messages (from console)
3. HTTP status codes (from network tab)
4. Screenshot of the error
5. Whether you were logged in

**Example:**
```
❌ Test Failed at Step 2

Issue: Campaign list shows "Failed to load campaigns" error

Evidence:
- Console error: "Auth session missing"
- Network: GET /api/campaigns returned 401
- User: Logged in as admin@example.com
- Screenshot: [attach screenshot]
```

---

## Quick Reference

**Test URLs:**
- Campaign List: http://localhost:9002/sales/campaigns
- New Campaign: http://localhost:9002/sales/campaigns/new

**Expected API Responses:**
- GET `/api/campaigns` → 200 OK (array of campaigns)
- POST `/api/campaigns` → 201 Created (new campaign)

**DevTools Shortcuts:**
- Open DevTools: F12 or Cmd+Opt+I (Mac)
- Console tab: See errors and logs
- Network tab: See API requests/responses

---

## Time Estimate

⏱️ **5-10 minutes** for complete manual testing

---

**Created:** 2025-11-17
**For:** Production RBAC verification
**Status:** Ready for manual execution
